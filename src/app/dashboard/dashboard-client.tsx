"use client";

import type { Achievement } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Archive, LayoutGrid, Sparkles, Trophy, X } from "lucide-react";
import { AchievementCard } from "@/components/achievement-card";
import { ProofModal } from "@/components/proof-modal";
import { XpBar } from "@/components/xp-bar";
import {
  XpRewardOverlay,
  type XpRewardData,
} from "@/components/xp-reward-overlay";
import { cn } from "@/lib/utils";

type Progress = { current: number; next: number; pct: number };

const PERIOD_SECTION_UA: Record<string, string> = {
  day: "Щоденні",
  week: "Щотижневі",
  month: "Щомісячні",
};

const PERIOD_ORDER = ["day", "week", "month"] as const;

export function DashboardClient({
  userName,
  welcomeMessage,
  totalXP,
  level,
  progress,
  achievements,
}: {
  userName: string;
  welcomeMessage: string | null;
  totalXP: number;
  level: number;
  progress: Progress;
  achievements: Achievement[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("");
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [xpReward, setXpReward] = useState<{
    open: boolean;
    data: XpRewardData | null;
  }>({ open: false, data: null });

  useEffect(() => {
    if (!welcomeMessage) return;
    if (typeof window !== "undefined" && sessionStorage.getItem("life-welcome-seen")) {
      return;
    }
    setWelcomeOpen(true);
  }, [welcomeMessage]);

  const activeAchievements = useMemo(
    () => achievements.filter((a) => !a.archived),
    [achievements]
  );

  const archivedAchievements = useMemo(
    () =>
      achievements
        .filter((a) => a.archived)
        .slice()
        .sort((a, b) => {
          const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return tb - ta;
        }),
    [achievements]
  );

  const buckets = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const p of PERIOD_ORDER) {
      map.set(p, []);
    }
    for (const a of activeAchievements) {
      const key =
        a.period === "year"
          ? "month"
          : a.period && map.has(a.period)
            ? a.period
            : "month";
      map.get(key)!.push(a);
    }
    return map;
  }, [activeAchievements]);

  const [listTab, setListTab] = useState<"active" | "archive">("active");

  const [periodTab, setPeriodTab] =
    useState<(typeof PERIOD_ORDER)[number]>("day");

  const tabItems = buckets.get(periodTab) ?? [];

  const openProof = (a: Achievement) => {
    setActiveId(a.id);
    setActiveTitle(a.title);
    setModalOpen(true);
  };

  function dismissWelcome() {
    setWelcomeOpen(false);
    sessionStorage.setItem("life-welcome-seen", "1");
  }

  const handleVerified = useCallback(
    (reward: XpRewardData | null) => {
      setModalOpen(false);
      setActiveId(null);
      if (reward) {
        setXpReward({ open: true, data: reward });
      } else {
        router.refresh();
      }
    },
    [router]
  );

  const handleXpRewardComplete = useCallback(() => {
    setXpReward({ open: false, data: null });
    router.refresh();
  }, [router]);

  return (
    <>
      <XpRewardOverlay
        open={xpReward.open}
        data={xpReward.data}
        onComplete={handleXpRewardComplete}
      />

      {welcomeOpen && welcomeMessage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={dismissWelcome}
            aria-label="Закрити"
          />
          <div
            className={cn(
              "glass-modal relative z-10 max-h-[min(85vh,100dvh-2rem)] w-full max-w-lg overflow-y-auto p-5 sm:p-8",
              "opacity-0 motion-safe:animate-spring-up motion-reduce:opacity-100"
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--accent))]/15">
                  <Sparkles className="h-6 w-6 text-[rgb(var(--accent))]" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Привітання</h2>
              </div>
              <button
                type="button"
                onClick={dismissWelcome}
                className="rounded-full p-2 text-[rgb(var(--muted))] transition hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[rgb(var(--fg))]">
              {welcomeMessage}
            </p>
            <button
              type="button"
              onClick={dismissWelcome}
              className="mt-8 w-full rounded-2xl bg-[rgb(var(--accent))] py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-95"
            >
              До досягнень
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto mt-6 max-w-3xl opacity-0 motion-safe:animate-spring-up motion-reduce:opacity-100 sm:mt-10">
        <div className="glass rounded-[1.5rem] p-5 sm:p-8 md:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[rgb(var(--muted))]">З поверненням</p>
              <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                {userName}
              </h1>
            </div>
            <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-4 rounded-3xl bg-black/[0.03] px-4 py-4 sm:w-auto sm:flex-nowrap sm:px-6 dark:bg-white/[0.06]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--accent))]/15">
                <Trophy className="h-7 w-7 text-[rgb(var(--accent))]" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--muted))]">Всього XP</p>
                <p className="text-2xl font-semibold tabular-nums">{totalXP}</p>
              </div>
              <div className="hidden h-10 w-px bg-black/10 sm:block dark:bg-white/10" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--muted))]">Рівень</p>
                <p className="text-2xl font-semibold tabular-nums">{level}</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <XpBar
              label="Прогрес до наступного рівня"
              current={progress.current}
              next={progress.next}
              pct={progress.pct}
            />
          </div>
        </div>

        <div
          className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6"
          role="tablist"
          aria-label="Список досягнень"
        >
          <button
            type="button"
            role="tab"
            aria-selected={listTab === "active"}
            onClick={() => setListTab("active")}
            className={cn(
              "inline-flex min-h-[44px] min-w-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition duration-200 active:scale-[0.97] sm:px-4 sm:py-2.5",
              listTab === "active"
                ? "bg-[rgb(var(--accent))] text-white shadow-lg shadow-blue-500/25"
                : "bg-black/[0.04] text-[rgb(var(--fg))] hover:bg-black/[0.08] dark:bg-white/[0.06]"
            )}
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={2} />
            Завдання
            <span
              className={cn(
                "tabular-nums text-xs font-medium",
                listTab === "active" ? "text-white/90" : "text-[rgb(var(--muted))]"
              )}
            >
              {activeAchievements.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listTab === "archive"}
            onClick={() => setListTab("archive")}
            className={cn(
              "inline-flex min-h-[44px] min-w-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition duration-200 active:scale-[0.97] sm:px-4 sm:py-2.5",
              listTab === "archive"
                ? "bg-[rgb(var(--accent))] text-white shadow-lg shadow-blue-500/25"
                : "bg-black/[0.04] text-[rgb(var(--fg))] hover:bg-black/[0.08] dark:bg-white/[0.06]"
            )}
          >
            <Archive className="h-4 w-4" strokeWidth={2} />
            Архів
            <span
              className={cn(
                "tabular-nums text-xs font-medium",
                listTab === "archive" ? "text-white/90" : "text-[rgb(var(--muted))]"
              )}
            >
              {archivedAchievements.length}
            </span>
          </button>
        </div>

        {listTab === "active" ? (
          <div
            className="mt-4 flex flex-wrap items-center justify-center gap-2"
            role="tablist"
            aria-label="Період досягнень"
          >
            {PERIOD_ORDER.map((p) => {
              const count = buckets.get(p)?.length ?? 0;
              const selected = periodTab === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`period-tab-${p}`}
                  onClick={() => setPeriodTab(p)}
                  className={cn(
                    "inline-flex min-h-[44px] min-w-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition duration-200 active:scale-[0.97] sm:px-4 sm:py-2.5",
                    selected
                      ? "bg-[rgb(var(--accent))] text-white shadow-lg shadow-blue-500/25"
                      : "bg-black/[0.04] text-[rgb(var(--fg))] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
                  )}
                >
                  {PERIOD_SECTION_UA[p]}
                  <span
                    className={cn(
                      "tabular-nums text-xs font-medium",
                      selected ? "text-white/90" : "text-[rgb(var(--muted))]"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-8">
          {listTab === "archive" ? (
            archivedAchievements.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-black/10 px-6 py-10 text-center text-[15px] text-[rgb(var(--muted))] dark:border-white/10">
                Поки порожньо — виконай завдання з активного списку.
              </p>
            ) : (
              <ul className="space-y-5">
                {archivedAchievements.map((a, i) => (
                  <li
                    key={a.id}
                    style={{ "--stagger-delay": `${i * 55}ms` } as CSSProperties}
                    className="animate-stagger-fade"
                  >
                    <AchievementCard
                      achievement={a}
                      variant="archive"
                      onSubmitProof={() => {}}
                    />
                  </li>
                ))}
              </ul>
            )
          ) : tabItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 px-6 py-10 text-center text-[15px] text-[rgb(var(--muted))] dark:border-white/10">
              У цій категорії поки немає завдань.
            </p>
          ) : (
            <ul className="space-y-5" role="tabpanel" aria-labelledby={`period-tab-${periodTab}`}>
              {tabItems.map((a, i) => (
                <li
                  key={a.id}
                  style={{ "--stagger-delay": `${i * 55}ms` } as CSSProperties}
                  className="animate-stagger-fade"
                >
                  <AchievementCard achievement={a} onSubmitProof={() => openProof(a)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ProofModal
        open={modalOpen}
        achievementId={activeId}
        achievementTitle={activeTitle}
        onClose={() => {
          setModalOpen(false);
          setActiveId(null);
        }}
        onVerified={handleVerified}
      />
    </>
  );
}
