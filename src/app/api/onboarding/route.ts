import { NextResponse } from "next/server";
import { onboardingStep } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: { role: string; content: string }[];
    };
    const messages = (body.messages ?? [])
      .filter(
        (m): m is { role: "user" | "assistant"; content: string } =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .map((m) => ({ ...m, content: m.content.slice(0, 4000) }));

    const result = await onboardingStep(messages);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Помилка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
