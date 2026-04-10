import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE } from "@/lib/constants";
import { hashLoginPin, isValidLoginPin } from "@/lib/auth-pin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };
    const pin = body.pin;

    if (!isValidLoginPin(pin)) {
      return NextResponse.json(
        { error: "Введи код з 6 цифр" },
        { status: 400 }
      );
    }

    let loginPinHash: string;
    try {
      loginPinHash = hashLoginPin(pin);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Помилка сервера";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { loginPinHash },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Невірний код. Перевір цифри або зареєструйся через «Почати»." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true, userId: user.id });
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
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
  }
}
