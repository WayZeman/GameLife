import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateExtraAchievements,
  type AchievementPeriodBreakdown,
} from "@/lib/openai";
import { USER_COOKIE } from "@/lib/constants";
import { currentWindowKey } from "@/lib/period-windows";

function sanitizeBreakdown(
  raw: Partial<AchievementPeriodBreakdown> | undefined,
  legacyCount?: number
): AchievementPeriodBreakdown {
  let day = Math.max(0, Math.min(15, Math.floor(Number(raw?.day) || 0)));
  let week = Math.max(0, Math.min(15, Math.floor(Number(raw?.week) || 0)));
  let month = Math.max(0, Math.min(15, Math.floor(Number(raw?.month) || 0)));
  let sum = day + week + month;
  if (sum < 1 && legacyCount !== undefined && Number.isFinite(legacyCount)) {
    const c = Math.max(1, Math.min(20, Math.floor(legacyCount)));
    return { day: 0, week: 0, month: c };
  }
  while (sum > 20) {
    if (month > 0) month--;
    else if (week > 0) week--;
    else if (day > 0) day--;
    else break;
    sum = day + week + month;
  }
  if (sum < 1) {
    return { day: 0, week: 0, month: 2 };
  }
  return { day, week, month };
}

export async function POST(request: Request) {
  const userId = cookies().get(USER_COOKIE)?.value;
  if (!userId) {
    return NextResponse.json({ error: "Сесію не знайдено" }, { status: 401 });
  }

  let breakdown: AchievementPeriodBreakdown | undefined;
  let legacyCount: number | undefined;
  try {
    const body = (await request.json()) as {
      breakdown?: Partial<AchievementPeriodBreakdown>;
      count?: number;
    };
    if (body.breakdown && typeof body.breakdown === "object") {
      breakdown = body.breakdown as AchievementPeriodBreakdown;
    }
    if (typeof body.count === "number" && Number.isFinite(body.count)) {
      legacyCount = body.count;
    }
  } catch {
    /* empty body ok */
  }

  const br = sanitizeBreakdown(breakdown, legacyCount);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: { select: { title: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Користувача не знайдено" }, { status: 401 });
  }

  const existingTitles = user.achievements.map((a) => a.title);

  try {
    const generated = await generateExtraAchievements({
      name: user.name,
      age: user.age,
      category: user.category,
      interests: user.interests,
      mainGoal: user.mainGoal,
      existingTitles,
      breakdown: br,
    });

    await prisma.$transaction(
      generated.map((a) =>
        prisma.achievement.create({
          data: {
            userId,
            title: a.title,
            description: a.description,
            category: a.category,
            difficulty: a.difficulty,
            period: a.period,
            periodWindowKey: currentWindowKey(a.period),
            xp: a.xp,
            completed: false,
            archived: false,
          },
        })
      )
    );

    return NextResponse.json({ ok: true, added: generated.length });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Не вдалося згенерувати досягнення";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
