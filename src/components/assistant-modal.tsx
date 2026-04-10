"use client";

import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AssistantPlannedAction } from "@/lib/openai";

type Props = {
  open: boolean;
  onClose: () => void;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const OPENING: ChatMsg = {
  role: "assistant",
  content:
    "Привіт! Я помічник у цій грі досягнень. Чим можу допомогти? Можу згенерувати нові завдання — напиши, скільки штук і які саме потрібні: щоденні, щотижневі чи щомісячні (можна комбінацію). Якщо буде неясно — уточню, перш ніж щось додавати.",
};

export function AssistantModal({ open, onClose }: Props) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([OPENING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConsent, setPendingConsent] = useState<{
    consentSummary: string;
    action: AssistantPlannedAction;
  } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) {
      setMessages([OPENING]);
      setInput("");
      setError(null);
      setPendingConsent(null);
      setLoading(false);
      setApplying(false);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingConsent, loading]);

  const sendChat = useCallback(
    async (nextMessages: ChatMsg[]) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        });
        const data = (await res.json()) as {
          error?: string;
          reply?: string;
          status?: string;
          consentSummary?: string;
          action?: AssistantPlannedAction | null;
        };
        if (!res.ok) throw new Error(data.error ?? "Помилка");

        const reply = String(data.reply ?? "").trim() || "…";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

        if (
          data.status === "await_consent" &&
          data.action?.type === "add_achievements" &&
          data.action.breakdown
        ) {
          const b = data.action.breakdown;
          const t = b.day + b.week + b.month;
          setPendingConsent({
            consentSummary:
              String(data.consentSummary ?? "").trim() ||
              `Згенерувати ${t} нових досягнень (щоденних: ${b.day}, щотижневих: ${b.week}, щомісячних: ${b.month}).`,
            action: data.action,
          });
        } else {
          setPendingConsent(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Помилка");
        setPendingConsent(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || applying) return;
    if (pendingConsent) return;

    const userMsg: ChatMsg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    await sendChat(next);
  }

  async function handleConsentAgree() {
    if (!pendingConsent || applying) return;
    const { action } = pendingConsent;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch("/api/achievements/extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breakdown: action.breakdown }),
      });
      const data = (await res.json()) as { error?: string; added?: number };
      if (!res.ok) throw new Error(data.error ?? "Не вдалося застосувати");

      const n =
        data.added ??
        action.breakdown.day +
          action.breakdown.week +
          action.breakdown.month;
      setPendingConsent(null);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Застосовано. Додано ${n} нових досягнень — вони вже у твоєму списку на головній.`,
        },
      ]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
    } finally {
      setApplying(false);
    }
  }

  async function handleConsentDecline() {
    if (!pendingConsent || loading || applying) return;
    const declineText =
      "Ні, не застосовуємо цю допомогу. Залиш усе як є.";
    const next: ChatMsg[] = [
      ...messages,
      { role: "user", content: declineText },
    ];
    setPendingConsent(null);
    setMessages(next);
    await sendChat(next);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex flex-col items-stretch justify-end p-0 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Закрити"
      />
      <div
        className={cn(
          "glass-modal relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden animate-fade-in sm:h-auto sm:max-h-[min(90vh,800px)]",
          "rounded-none sm:rounded-2xl",
          "p-0"
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/[0.06] px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-white/10 sm:px-5 sm:pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--accent))]/15">
              <Sparkles className="h-5 w-5 text-[rgb(var(--accent))]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 id="assistant-modal-title" className="text-lg font-semibold tracking-tight">
                Помічник
              </h2>
              <p className="text-xs text-[rgb(var(--muted))]">Переписка з ШІ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[rgb(var(--muted))] transition hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed",
                    m.role === "user"
                      ? "bg-[rgb(var(--accent))] text-white"
                      : "bg-black/[0.05] text-[rgb(var(--fg))] dark:bg-white/10"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-1 text-sm text-[rgb(var(--muted))]">
              <Loader2 className="h-4 w-4 animate-spin text-[rgb(var(--accent))]" />
              Помічник думає…
            </div>
          ) : null}

          {pendingConsent ? (
            <div
              className="rounded-2xl border border-[rgb(var(--accent))]/25 bg-[rgb(var(--accent))]/[0.06] p-4 dark:bg-[rgb(var(--accent))]/10"
              role="region"
              aria-label="Підтвердження допомоги"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Згода на застосування
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--fg))]">
                {pendingConsent.consentSummary}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={applying}
                  onClick={() => void handleConsentDecline()}
                  className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
                >
                  Ні, не зараз
                </button>
                <button
                  type="button"
                  disabled={applying}
                  onClick={() => void handleConsentAgree()}
                  className={cn(
                    "rounded-xl bg-[rgb(var(--accent))] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20",
                    "transition hover:opacity-95 disabled:opacity-60"
                  )}
                >
                  {applying ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Застосовую…
                    </span>
                  ) : (
                    "Погоджуюсь застосувати"
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
              {error}
            </p>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-black/[0.06] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10 sm:pb-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={
                pendingConsent
                  ? "Спочатку обери згоду вище…"
                  : "Напиши, що потрібно…"
              }
              disabled={loading || applying || Boolean(pendingConsent)}
              rows={2}
              className={cn(
                "min-h-[44px] flex-1 resize-none rounded-xl border border-black/10 bg-white/80 px-3 py-2.5 text-base text-[rgb(var(--fg))] sm:text-[15px]",
                "placeholder:text-[rgb(var(--muted))] focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/20",
                "dark:border-white/10 dark:bg-black/30",
                (loading || applying || pendingConsent) && "opacity-60"
              )}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={
                !input.trim() || loading || applying || Boolean(pendingConsent)
              }
              className={cn(
                "inline-flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl",
                "bg-[rgb(var(--accent))] text-white transition hover:opacity-95 disabled:opacity-40"
              )}
              aria-label="Надіслати"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
