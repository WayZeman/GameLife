import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/constants";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });
  return res;
}
