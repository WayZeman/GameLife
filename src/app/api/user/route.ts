import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE } from "@/lib/constants";
import { normalizeFreeformCategory } from "@/lib/profile-fields";

export async function GET() {
  const id = cookies().get(USER_COOKIE)?.value;
  if (!id) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      achievements: { orderBy: { id: "asc" } },
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}

/** Оновлення профілю поточного користувача (нік, вік, категорія, інтереси, мета). */
export async function PATCH(request: Request) {
  try {
    const id = cookies().get(USER_COOKIE)?.value;
    if (!id) {
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      age?: number;
      category?: string;
      interests?: string;
      mainGoal?: string;
    };

    const name = String(body.name ?? "").trim();
    const age = Number(body.age);
    const category = normalizeFreeformCategory(String(body.category ?? ""));
    const interests = String(body.interests ?? "").trim() || "—";
    const mainGoal = String(body.mainGoal ?? "").trim() || "—";

    if (!name || !Number.isFinite(age) || age < 1 || age > 120 || !category) {
      return NextResponse.json(
        { error: "Вкажи ім'я, вік (1–120) і коротко, чим займаєшся (категорія)" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        age: Math.floor(age),
        category,
        interests,
        mainGoal,
      },
      select: {
        id: true,
        name: true,
        age: true,
        category: true,
        interests: true,
        mainGoal: true,
        totalXP: true,
        welcomeMessage: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Помилка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
