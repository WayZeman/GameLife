"use client";

import { Loader2, PartyPopper, X } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { XpRewardData } from "@/components/xp-reward-overlay";

type Props = {
  open: boolean;
  achievementId: string | null;
  achievementTitle: string;
  onClose: () => void;
  onVerified: (reward: XpRewardData | null) => void;
};

type ApiVerifyResponse = {
  error?: string;
  completed?: boolean;
  confidence?: number;
  reason?: string;
  achievementCompleted?: boolean;
  xpGained?: number;
  totalXP?: number;
  level?: number;
  previousLevel?: number;
  levelUp?: boolean;
};

function mapReward(data: ApiVerifyResponse): XpRewardData | null {
  if (
    data.achievementCompleted &&
    (data.xpGained ?? 0) > 0 &&
    typeof data.totalXP === "number" &&
    typeof data.level === "number" &&
    typeof data.previousLevel === "number"
  ) {
    return {
      xpGained: data.xpGained!,
      totalXP: data.totalXP,
      newLevel: data.level,
      previousLevel: data.previousLevel,
      levelUp: Boolean(data.levelUp),
    };
  }
  return null;
}

type Outcome = {
  passed: boolean;
  achievementCompleted: boolean;
  xpGained: number;
  confidence: number;
  reason: string;
  reward: XpRewardData | null;
};

function buildOutcome(data: ApiVerifyResponse): Outcome {
  return {
    passed: Boolean(data.completed),
    achievementCompleted: Boolean(data.achievementCompleted),
    xpGained: Number(data.xpGained ?? 0),
    confidence: Number(data.confidence ?? 0),
    reason: String(data.reason ?? ""),
    reward: mapReward(data),
  };
}

export function ProofModal({
  open,
  achievementId,
  achievementTitle,
  onClose,
  onVerified,
}: Props) {
  const [textProof, setTextProof] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyKind, setBusyKind] = useState<"text" | "image" | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setTextProof("");
    setFileName(null);
    setOutcome(null);
    setError(null);
    setLoading(false);
    setBusyKind(null);
  }, []);

  const handleClose = () => {
    const hadOutcome = outcome !== null;
    reset();
    onClose();
    if (hadOutcome) onVerified(null);
  };

  const applyApiResult = (data: ApiVerifyResponse) => {
    setOutcome(buildOutcome(data));
  };

  const submitText = async () => {
    if (!achievementId || !textProof.trim()) return;
    setLoading(true);
    setBusyKind("text");
    setError(null);
    setOutcome(null);
    try {
      const res = await fetch(`/api/achievements/${achievementId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textProof: textProof.trim() }),
      });
      const data = (await res.json()) as ApiVerifyResponse;
      if (!res.ok) throw new Error(data.error ?? "Перевірка не вдалася");
      applyApiResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Щось пішло не так");
    } finally {
      setLoading(false);
      setBusyKind(null);
    }
  };

  const submitImage = async (file: File) => {
    if (!achievementId) return;
    setLoading(true);
    setBusyKind("image");
    setError(null);
    setOutcome(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`/api/achievements/${achievementId}/verify`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as ApiVerifyResponse;
      if (!res.ok) throw new Error(data.error ?? "Перевірка не вдалася");
      applyApiResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Щось пішло не так");
    } finally {
      setLoading(false);
      setBusyKind(null);
    }
  };

  const tryAgain = () => {
    setOutcome(null);
    setError(null);
  };

  const continueWithReward = () => {
    if (!outcome?.reward) return;
    const r = outcome.reward;
    reset();
    onClose();
    onVerified(r);
  };

  const dismissWithoutReward = () => {
    reset();
    onClose();
    onVerified(null);
  };

  if (!open) return null;

  const showForm = !outcome;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top,0px)] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
        aria-label="Закрити"
      />
      <div
        className={cn(
          "glass-modal relative z-10 w-full max-w-lg overflow-hidden rounded-t-[1.5rem] p-5 sm:rounded-3xl sm:p-8",
          "animate-fade-in duration-300",
          "pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-8"
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="proof-modal-title" className="text-xl font-semibold tracking-tight">
              {outcome ? "Результат перевірки" : "Надіслати доказ"}
            </h2>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{achievementTitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-[rgb(var(--muted))] transition hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Закрити вікно"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {showForm && (
          <>
            <p className="mb-4 text-sm leading-relaxed text-[rgb(var(--muted))]">
              Доказ обробляється лише в пам&apos;яті й не зберігається. Зберігається лише результат перевірки.
              Напиши <strong className="text-[rgb(var(--fg))]">конкретику</strong>: цифри, час, повторення, км тощо — загальні фрази на кшталт «зробив завдання» без деталей не приймаються.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Текстовий доказ</label>
                <textarea
                  value={textProof}
                  onChange={(e) => setTextProof(e.target.value)}
                  rows={4}
                  disabled={loading}
                  placeholder="Наприклад: 3 підходи по 12 присідань, планка 45 с; або 5 км за 31 хв у додатку…"
                  className={cn(
                    "w-full resize-none rounded-2xl border border-black/[0.08] bg-white/80 px-4 py-3 text-base sm:text-[15px]",
                    "placeholder:text-black/35 focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/25",
                    "dark:border-white/10 dark:bg-black/20 dark:placeholder:text-white/35"
                  )}
                />
                <button
                  type="button"
                  onClick={submitText}
                  disabled={loading || !textProof.trim()}
                  className="mt-3 w-full rounded-2xl bg-[rgb(var(--accent))] py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading && busyKind === "text" ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Перевірка…
                    </span>
                  ) : (
                    "Перевірити текст"
                  )}
                </button>
              </div>

              <div className="relative py-2 text-center text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
                <span className="relative z-10 bg-[rgb(var(--bg))] px-3">або</span>
                <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-black/10 dark:bg-white/10" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Фото-доказ</label>
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/10 px-4 py-8 transition",
                    "hover:border-[rgb(var(--accent))]/40 hover:bg-black/[0.02] dark:border-white/15 dark:hover:bg-white/[0.04]",
                    loading && "pointer-events-none opacity-50"
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={loading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFileName(f.name);
                        void submitImage(f);
                      }
                      e.target.value = "";
                    }}
                  />
                  <span className="text-sm text-[rgb(var(--muted))]">
                    {fileName ? fileName : "Натисни, щоб завантажити фото (не зберігається)"}
                  </span>
                </label>
              </div>
            </div>

            {loading && busyKind === "image" && (
              <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-black/[0.03] py-4 dark:bg-white/[0.06]">
                <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--accent))]" />
                <span className="text-sm font-medium">Перевірка через ШІ…</span>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {outcome && !loading && (
          <div className="animate-fade-in space-y-4 duration-300">
            {!outcome.passed && (
              <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-5 py-5">
                <p className="text-lg font-semibold text-amber-950 dark:text-amber-100">
                  Поки не зараховано
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[rgb(var(--muted))]">
                  Спробуй ще раз: додай більше конкретики (цифри, час, що саме зробив). Загальних фраз недостатньо.
                </p>
                <p className="mt-3 text-sm text-[rgb(var(--muted))]">
                  Впевненість перевірки: {Math.round(outcome.confidence)}%
                </p>
                {outcome.reason ? (
                  <p className="mt-3 rounded-xl bg-black/[0.04] px-3 py-2 text-[15px] leading-relaxed dark:bg-white/[0.06]">
                    {outcome.reason}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={tryAgain}
                    className="flex-1 rounded-2xl bg-[rgb(var(--accent))] py-3.5 text-[15px] font-semibold text-white shadow-md transition hover:opacity-95"
                  >
                    Спробувати ще раз
                  </button>
                  <button
                    type="button"
                    onClick={dismissWithoutReward}
                    className="flex-1 rounded-2xl border border-black/10 py-3.5 text-[15px] font-medium dark:border-white/15"
                  >
                    Закрити
                  </button>
                </div>
              </div>
            )}

            {outcome.passed && outcome.reward && (
              <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-5 py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
                  <PartyPopper className="h-9 w-9 text-emerald-700 dark:text-emerald-300" strokeWidth={1.5} />
                </div>
                <p className="text-xl font-semibold text-emerald-950 dark:text-emerald-50">
                  Вітаємо!
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[rgb(var(--muted))]">
                  Досягнення зараховано. Натисни «Далі», щоб побачити нагороду.
                </p>
                <button
                  type="button"
                  onClick={continueWithReward}
                  className="mt-6 w-full rounded-2xl bg-[rgb(var(--accent))] py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-95"
                >
                  Далі
                </button>
              </div>
            )}

            {outcome.passed && !outcome.reward && (
              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-5 py-5">
                <p className="text-lg font-semibold">Перевірку пройдено</p>
                <p className="mt-2 text-[15px] text-[rgb(var(--muted))]">
                  {outcome.achievementCompleted
                    ? "Дані оновлено."
                    : "Це досягнення вже було зараховане раніше — додатковий досвід не нараховується."}
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  Впевненість: {Math.round(outcome.confidence)}%
                </p>
                {outcome.reason ? (
                  <p className="mt-3 text-[15px] leading-relaxed">{outcome.reason}</p>
                ) : null}
                <button
                  type="button"
                  onClick={dismissWithoutReward}
                  className="mt-5 w-full rounded-2xl bg-[rgb(var(--accent))] py-3.5 text-[15px] font-semibold text-white"
                >
                  Зрозуміло
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
