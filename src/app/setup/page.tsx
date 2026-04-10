"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { OnboardingProfilePayload } from "@/lib/openai";

type Msg = { role: "user" | "assistant"; content: string };

function safeAssistantText(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (s.length >= 3) return s;
  return "Привіт! Радію, що ти тут. Як тебе звати й скільки тобі років?";
}

export default function SetupPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/user")
      .then((r) => {
        if (r.ok) router.replace("/dashboard");
      })
      .catch(() => {});
  }, [router]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const errorBannerRef = useRef<HTMLParagraphElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (error && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [] }),
        });
        const d = (await r.json()) as {
          error?: string;
          assistantMessage?: string;
        };
        if (!r.ok) throw new Error(d.error ?? "Не вдалося почати діалог");
        if (cancelled) return;
        setMessages([
          { role: "assistant", content: safeAssistantText(d.assistantMessage) },
        ]);
        setStarted(true);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Помилка завантаження");
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function finalize(
    profile: OnboardingProfilePayload,
    allMessages: Msg[]
  ) {
    const conversationSummary = allMessages
      .map((m) =>
        m.role === "user"
          ? `Користувач: ${m.content}`
          : `Асистент: ${m.content}`
      )
      .join("\n");

    const res = await fetch("/api/profile", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name,
        age: profile.age,
        category: profile.category,
        interests: profile.interests,
        mainGoal: profile.mainGoal,
        horizons: profile.horizons,
        conversationSummary,
      }),
    });
    const rawText = await res.text();
    let data: { error?: string } = {};
    try {
      data = rawText ? (JSON.parse(rawText) as { error?: string }) : {};
    } catch {
      throw new Error(
        res.ok
          ? "Сервер повернув некоректну відповідь. Спробуй ще раз."
          : `Помилка збереження (${res.status}). Спробуй ще раз або онови сторінку.`
      );
    }
    if (!res.ok) {
      throw new Error(
        data.error ?? "Не вдалося зберегти профіль і створити досягнення."
      );
    }
    // Повне завантаження сторінки — щоб httpOnly cookie сесії гарантовано пішов у запит до /dashboard
    window.location.assign("/dashboard");
  }

  async function send() {
    const text = input.trim();
    if (!text || loading || generating || bootLoading) return;

    setError(null);
    const userMsg: Msg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const d = (await r.json()) as {
        error?: string;
        phase?: string;
        assistantMessage?: string;
        profile?: OnboardingProfilePayload | null;
      };
      if (!r.ok) throw new Error(d.error ?? "Помилка діалогу");

      const assistantMsg: Msg = {
        role: "assistant",
        content: safeAssistantText(d.assistantMessage),
      };
      const afterChat = [...nextMessages, assistantMsg];
      setMessages(afterChat);

      if (d.phase === "ready" && d.profile) {
        setGenerating(true);
        setLoading(false);
        try {
          await finalize(d.profile, afterChat);
        } catch (err) {
          setGenerating(false);
          setError(
            err instanceof Error ? err.message : "Не вдалося зберегти профіль"
          );
        }
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Щось пішло не так");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh px-4 pb-[max(7rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
      <header className="mx-auto flex max-w-lg items-center justify-between sm:max-w-xl">
        <Link
          href="/"
          className="text-sm font-medium text-[rgb(var(--muted))] transition hover:text-[rgb(var(--fg))]"
        >
          ← На головну
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto mt-8 max-w-lg sm:max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Знайомство
        </h1>
        <p className="mt-2 text-[rgb(var(--muted))]">
          Поговори з асистентом крок за кроком: ім&apos;я, вік, інтереси й те, до
          чого прагнеш — так підберемо досягнення під тебе (щоденні, щотижневі
          чи щомісячні).
        </p>

        <div
          className={cn(
            "glass mt-8 flex max-h-[min(520px,min(70vh,70dvh))] flex-col overflow-hidden rounded-[1.5rem]",
            "shadow-glass",
            "opacity-0 motion-safe:animate-spring-up motion-reduce:opacity-100"
          )}
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            {bootLoading && (
              <div className="flex items-center gap-3 text-[rgb(var(--muted))]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>З&apos;єднуємося з асистентом…</span>
              </div>
            )}
            {error && !bootLoading && (
              <p
                ref={errorBannerRef}
                role="alert"
                className="rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300"
              >
                {error}
              </p>
            )}
            {started &&
              messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                      m.role === "user"
                        ? "bg-[rgb(var(--accent))] text-white"
                        : "bg-black/[0.06] text-[rgb(var(--fg))] dark:bg-white/[0.08]"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            {loading && !generating && messages.length > 0 && (
              <div className="flex items-center gap-2 pl-1 text-sm text-[rgb(var(--muted))]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Асистент друкує…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-black/[0.06] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/[0.08] sm:p-4 sm:pb-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                disabled={loading || generating || bootLoading || !started}
                rows={2}
                placeholder="Напиши відповідь…"
                className={cn(
                  "min-h-[52px] flex-1 resize-none rounded-2xl border border-black/[0.08] bg-white/80 px-4 py-3 text-base sm:text-[15px]",
                  "placeholder:text-black/35 focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/25",
                  "dark:border-white/10 dark:bg-black/20 dark:placeholder:text-white/35",
                  "disabled:opacity-50"
                )}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={
                  loading ||
                  generating ||
                  bootLoading ||
                  !started ||
                  !input.trim()
                }
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--accent))] text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Надіслати"
              >
                <Send className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {generating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] backdrop-blur-md animate-in fade-in duration-300 sm:px-6">
          <div className="glass-modal max-w-md p-6 text-center sm:p-10">
            <div className="relative mx-auto mb-6 h-20 w-20">
              <span className="absolute inset-0 animate-ping rounded-full bg-[rgb(var(--accent))]/30" />
              <span className="absolute inset-2 animate-pulse rounded-full bg-[rgb(var(--accent))]/20" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[rgb(var(--accent))]/15">
                <Loader2 className="h-10 w-10 animate-spin text-[rgb(var(--accent))]" />
              </div>
            </div>
            <p className="text-lg font-semibold tracking-tight">
              Створюємо персональні досягнення
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
              Аналізуємо розмову й підбираємо кроки — за кілька секунд буде
              готово.
            </p>
            <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div className="h-full w-full animate-pulse rounded-full bg-[rgb(var(--accent))]/70" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
