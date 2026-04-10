import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function levelFromTotalXp(totalXp: number): number {
  return Math.floor(totalXp / 500);
}

export function xpProgressInLevel(totalXp: number): { current: number; next: number; pct: number } {
  const level = levelFromTotalXp(totalXp);
  const start = level * 500;
  const next = (level + 1) * 500;
  const span = next - start;
  const current = totalXp - start;
  const pct =
    span <= 0 ? 0 : Math.min(100, Math.floor((current / span) * 100));
  return {
    current,
    next: span,
    pct,
  };
}
