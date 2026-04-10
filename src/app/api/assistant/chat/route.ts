import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assistantChatTurn } from "@/lib/openai";
import { USER_COOKIE } from "@/lib/constants";

type ChatMsg = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const userId = cookies().get(USER_COOKIE)?.value;
  if (!userId) {
    return NextResponse.json({ error: "Сесію не знайдено" }, { status: 401 });
  }

  let body: { messages?: ChatMsg[] };
  try {
    body = (await request.json()) as { messages?: ChatMsg[] };
  } catch {
    return NextResponse.json({ error: "Некоректний JSON" }, { status: 400 });
  }

  const raw = body.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "Потрібні повідомлення" }, { status: 400 });
  }

  const messages = raw
    .filter(
      (m): m is ChatMsg =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0
    )
    .slice(-30)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 8000),
    }));

  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "Останнє повідомлення має бути від користувача" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: {
        where: { archived: false },
        orderBy: { id: "asc" },
        select: { title: true, period: true, completed: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Користувача не знайдено" }, { status: 401 });
  }

  try {
    const result = await assistantChatTurn({
      userName: user.name,
      age: user.age,
      category: user.category,
      interests: user.interests,
      mainGoal: user.mainGoal,
      totalXP: user.totalXP,
      achievements: user.achievements.map((a) => ({
        title: a.title,
        period: a.period,
        completed: a.completed,
      })),
      messages,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Помилка помічника";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
