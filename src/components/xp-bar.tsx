"use client";

import { cn } from "@/lib/utils";

export function XpBar({
  label,
  current,
  next,
  pct,
  className,
}: {
  label: string;
  current: number;
  next: number;
  pct: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex flex-col gap-0.5 text-xs font-medium text-[rgb(var(--muted))] sm:flex-row sm:justify-between sm:gap-0">
        <span className="leading-snug">{label}</span>
        <span className="tabular-nums sm:text-right">
          {current} / {next} XP
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--accent))] to-sky-400 transition-[width] duration-700 ease-out motion-reduce:duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
