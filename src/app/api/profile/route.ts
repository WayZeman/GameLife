import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAchievementsAndWelcome } from "@/lib/openai";
import type { Period } from "@/lib/openai";
import { currentWindowKey } from "@/lib/period-windows";
import { USER_COOKIE } from "@/lib/constants";
import { hashLoginPin, isValidLoginPin } from "@/lib/auth-pin";
import { parseUserCategory } from "@/lib/profile-fields";

function parseHorizons(raw: unknown): Period[] {
  if (!Array.isArray(raw) || raw.length === 0) return ["month"];
  const allowed = new Set<Period>(["day", "week", "month"]);
  const out = raw
    .map((x) => String(x).toLowerCase())
    .map((x) => (x === "year" ? "month" : x))
    .filter((x): x is Period => allowed.has(x as Period));
  return out.length ? Array.from(new Set(out)) : ["month"];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      age?: number;
      category?: string;
      interests?: string;
      mainGoal?: string;
      horizons?: string[];
      conversationSummary?: string;
      pin?: string;
    };

    const name = String(body.name ?? "").trim();
    const age = Number(body.age);
    const category = parseUserCategory(String(body.category ?? ""));
    const interests = String(body.interests ?? "").trim();
    const mainGoal = String(body.mainGoal ?? "").trim();
    const horizons = parseHorizons(body.horizons);
    const conversationSummary = String(body.conversationSummary ?? "").trim();
    const pinRaw = body.pin;

    if (!name || !Number.isFinite(age) || age < 1 || age > 120 || !category) {
      return NextResponse.json({ error: "Некоректні дані профілю" }, { status: 400 });
    }

    if (!isValidLoginPin(pinRaw)) {
      return NextResponse.json(
        { error: "Вкажи код доступу з 6 цифр" },
        { status: 400 }
      );
    }

    let loginPinHash: string;
    try {
      loginPinHash = hashLoginPin(pinRaw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Некоректний код";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const pinTaken = await prisma.user.findUnique({
      where: { loginPinHash },
      select: { id: true },
    });
    if (pinTaken) {
      return NextResponse.json(
        { error: "Цей код уже зайнятий. Обери інший 6-значний код." },
        { status: 409 }
      );
    }

    const { achievements: generated, welcomeMessage } =
      await generateAchievementsAndWelcome({
        name,
        age,
        category,
        interests,
        mainGoal,
        horizons,
        conversationSummary: conversationSummary || undefined,
      });

    const user = await prisma.user.create({
      data: {
        name,
        age: Math.floor(age),
        category,
        interests,
        mainGoal,
        welcomeMessage,
        loginPinHash,
        totalXP: 0,
        achievements: {
          create: generated.map((a) => ({
            title: a.title,
            description: a.description,
            category: a.category,
            difficulty: a.difficulty,
            period: a.period,
            periodWindowKey: currentWindowKey(a.period),
            xp: a.xp,
            completed: false,
            archived: false,
          })),
        },
      },
      include: { achievements: true },
    });

    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      achievementCount: user.achievements.length,
      welcomeMessage,
    });
    res.cookies.set(USER_COOKIE, user.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 400,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Помилка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
