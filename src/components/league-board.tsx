import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { LeagueRow } from "@/lib/league";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const w = parts[0];
    return w.slice(0, 2).toUpperCase();
  }
  const a = parts[0][0] ?? "";
  const b = parts[parts.length - 1][0] ?? "";
  return `${a}${b}`.toUpperCase();
}

function rankStyle(rank: number): string {
  if (rank === 1) return "bg-amber-400/25 text-amber-900 dark:text-amber-100";
  if (rank === 2) return "bg-slate-400/20 text-slate-800 dark:text-slate-100";
  if (rank === 3) return "bg-orange-400/20 text-orange-950 dark:text-orange-100";
  return "bg-black/[0.05] text-[rgb(var(--muted))] dark:bg-white/10";
}

export function LeagueBoard({
  entries,
  totalPlayers,
  yourGlobalRank,
  yourName,
  ariaLabelledBy,
}: {
  entries: LeagueRow[];
  totalPlayers: number;
  yourGlobalRank: number;
  yourName: string;
  /** Якщо заголовок сторінки вже є — передай id для доступності */
  ariaLabelledBy?: string;
}) {
  return (
    <section aria-labelledby={ariaLabelledBy}>
      <div className="flex justify-end opacity-0 motion-safe:animate-fade-in motion-reduce:opacity-100">
        <p className="text-sm tabular-nums text-[rgb(var(--muted))]">
          Твоє місце:{" "}
          <span className="font-semibold text-[rgb(var(--fg))]">
            {yourGlobalRank} / {totalPlayers}
          </span>
        </p>
      </div>

      <ul
        className="mt-6 space-y-2"
        aria-label="Таблиця лідерів у лізі"
      >
        {entries.map((row, i) => {
          const label = row.isCurrentUser ? yourName.trim() || "Ти" : row.displayName;
          const avatar = row.isCurrentUser ? initials(yourName) : initials(row.displayName);

          return (
            <li
              key={row.userId}
              style={{ "--stagger-delay": `${i * 45}ms` } as CSSProperties}
              className="animate-stagger-fade"
            >
              <div
                className={cn(
                  "flex min-h-[52px] items-center gap-3 rounded-2xl border px-3 py-2.5 sm:gap-4 sm:px-4",
                  row.isCurrentUser
                    ? "border-[rgb(var(--accent))]/50 bg-[rgb(var(--accent))]/[0.08] shadow-sm shadow-[rgb(var(--accent))]/10"
                    : "border-black/[0.06] bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.04]"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums sm:h-10 sm:w-10",
                    rankStyle(row.globalRank)
                  )}
                  aria-hidden
                >
                  {row.globalRank}
                </div>
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    row.isCurrentUser
                      ? "bg-[rgb(var(--accent))]/25 text-[rgb(var(--accent))]"
                      : "bg-black/10 text-[rgb(var(--fg))] dark:bg-white/15"
                  )}
                >
                  {avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-tight">
                    {row.isCurrentUser ? (
                      <>
                        <span className="text-[rgb(var(--accent))]">Ти</span>
                        <span className="text-[rgb(var(--muted))]"> · </span>
                        <span>{label}</span>
                      </>
                    ) : (
                      label
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-[rgb(var(--fg))]">
                    {row.totalXP} XP
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {totalPlayers > entries.length ? (
        <p className="mt-4 text-center text-xs text-[rgb(var(--muted))]">
          Показано {entries.length} з {totalPlayers} — гравці зі схожим рівнем XP поруч із тобою.
        </p>
      ) : null}
    </section>
  );
}
