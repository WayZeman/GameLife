"use client";

import type { Achievement } from "@prisma/client";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type DifficultyKey = "easy" | "medium" | "hard";

const difficultyStyles: Record<
  DifficultyKey,
  { label: string; className: string }
> = {
  easy: {
    label: "Легко",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  medium: {
    label: "Середньо",
    className: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  hard: {
    label: "Складно",
    className: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  },
};

const CATEGORY_UA: Record<string, string> = {
  health: "Здоров'я",
  learning: "Навчання",
  discipline: "Дисципліна",
  finance: "Фінанси",
  social: "Соціальне",
};

const PERIOD_UA: Record<string, string> = {
  day: "Щоденне",
  week: "Щотижневе",
  month: "Щомісячне",
};

type AchievementRow = Pick<
  Achievement,
  | "id"
  | "title"
  | "description"
  | "difficulty"
  | "xp"
  | "completed"
  | "category"
  | "period"
  | "archived"
  | "completedAt"
>;

export function AchievementCard({
  achievement,
  onSubmitProof,
  variant = "active",
}: {
  achievement: AchievementRow;
  onSubmitProof: () => void;
  variant?: "active" | "archive";
}) {
  const diff = achievement.difficulty as DifficultyKey;
  const d = difficultyStyles[diff] ?? difficultyStyles.medium;
  const categoryLabel = CATEGORY_UA[achievement.category] ?? achievement.category;
  const periodKey =
    achievement.period === "year" ? "month" : achievement.period || "month";
  const periodLabel = PERIOD_UA[periodKey] ?? PERIOD_UA.month;
  const isArchive = variant === "archive" || achievement.archived;
  const completedWhen =
    achievement.completedAt != null
      ? new Date(achievement.completedAt).toLocaleDateString("uk-UA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  return (
    <article
      className={cn(
        "glass group relative overflow-hidden rounded-2xl p-4 transition duration-300 ease-out sm:rounded-3xl sm:p-6",
        "motion-safe:sm:hover:-translate-y-0.5 motion-safe:sm:hover:shadow-glass-lg"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                "bg-black/5 text-[rgb(var(--muted))] dark:bg-white/10"
              )}
            >
              {periodLabel}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                "bg-violet-500/10 text-violet-800 dark:text-violet-300"
              )}
            >
              {categoryLabel}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", d.className)}>
              {d.label}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-tight">{achievement.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-[rgb(var(--muted))]">
            {achievement.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
          <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
            {achievement.completed ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" strokeWidth={1.75} />
            ) : (
              <Circle className="h-6 w-6 text-[rgb(var(--muted))]" strokeWidth={1.75} />
            )}
            <span className="text-sm font-semibold tabular-nums text-[rgb(var(--accent))] sm:text-right">
              +{achievement.xp} XP
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-black/[0.06] pt-4 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:pt-5 dark:border-white/[0.08]">
        {isArchive ? (
          <p className="text-sm text-[rgb(var(--muted))]">
            У архіві{completedWhen ? ` · ${completedWhen}` : ""}
          </p>
        ) : (
          <>
            <p className="text-sm text-[rgb(var(--muted))]">
              {achievement.completed ? "Виконано" : "Не виконано"}
            </p>
            <button
              type="button"
              onClick={onSubmitProof}
              className={cn(
                "w-full min-h-[44px] rounded-full px-6 py-2.5 text-base font-semibold transition duration-200 sm:w-auto sm:text-[15px]",
                "bg-[rgb(var(--accent))] text-white shadow-md shadow-blue-500/20",
                "hover:opacity-95 active:scale-[0.98]",
                achievement.completed &&
                  "pointer-events-none bg-black/10 text-[rgb(var(--muted))] shadow-none dark:bg-white/10"
              )}
              disabled={achievement.completed}
            >
              {achievement.completed ? "Готово" : "Надіслати доказ"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
