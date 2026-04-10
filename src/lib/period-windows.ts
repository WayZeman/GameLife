import { prisma } from "@/lib/prisma";

const TZ = "Europe/Kyiv";

/** YYYY-MM-DD календарного дня в Kyiv */
export function kyivDateString(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Понеділок поточного тижня (Kyiv) як YYYY-MM-DD — стабільний ключ «тижневого» вікна */
export function kyivWeekWindowKey(d = new Date()): string {
  let t = new Date(d.getTime());
  for (let i = 0; i < 8; i++) {
    const wd = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      weekday: "short",
    }).format(t);
    if (wd === "Mon") {
      return t.toLocaleDateString("en-CA", { timeZone: TZ });
    }
    t = new Date(t.getTime() - 24 * 60 * 60 * 1000);
  }
  return kyivDateString(d);
}

/** YYYY-MM для поточного місяця (Kyiv) */
export function kyivMonthKey(d = new Date()): string {
  return kyivDateString(d).slice(0, 7);
}

export type WindowPeriod = "day" | "week" | "month";

export function currentWindowKey(period: string): string {
  const p =
    period === "year"
      ? "month"
      : period === "day" || period === "week" || period === "month"
        ? period
        : "month";
  if (p === "day") return kyivDateString();
  if (p === "week") return kyivWeekWindowKey();
  return kyivMonthKey();
}

/**
 * Порожній periodWindowKey: один раз проставляємо поточне вікно без скидання виконання (міграція / старі рядки).
 * Інакше при зміні вікна скидаємо completed для цього завдання.
 */
export async function rolloverAchievementsForUser(userId: string): Promise<void> {
  const achievements = await prisma.achievement.findMany({
    where: { userId, archived: false },
    select: {
      id: true,
      period: true,
      periodWindowKey: true,
    },
  });

  for (const a of achievements) {
    const key = currentWindowKey(a.period);
    if (!a.periodWindowKey) {
      await prisma.achievement.update({
        where: { id: a.id },
        data: { periodWindowKey: key },
      });
      continue;
    }
    if (a.periodWindowKey !== key) {
      await prisma.achievement.update({
        where: { id: a.id },
        data: {
          completed: false,
          completedAt: null,
          periodWindowKey: key,
        },
      });
    }
  }
}
