import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyProofImage, verifyProofText } from "@/lib/openai";
import { USER_COOKIE } from "@/lib/constants";
import { levelFromTotalXp } from "@/lib/utils";

const CONFIDENCE_THRESHOLD = 70;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = cookies().get(USER_COOKIE)?.value;
  if (!userId) {
    return NextResponse.json({ error: "Сесію не знайдено" }, { status: 401 });
  }

  const achievementId = params.id;

  const achievement = await prisma.achievement.findFirst({
    where: { id: achievementId, userId },
    include: { user: true },
  });

  if (!achievement) {
    return NextResponse.json({ error: "Досягнення не знайдено" }, { status: 404 });
  }

  if (achievement.archived) {
    return NextResponse.json(
      { error: "Це завдання вже в архіві" },
      { status: 400 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  let outcome: Awaited<ReturnType<typeof verifyProofText>>;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("image");
      if (!(file instanceof Blob) || file.size === 0) {
        return NextResponse.json(
          { error: "Для завантаження потрібне зображення" },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || "image/png";
      const b64 = buf.toString("base64");
      // buf cleared from scope after; proof not persisted
      outcome = await verifyProofImage({
        achievementTitle: achievement.title,
        achievementDescription: achievement.description,
        imageBase64: b64,
        mimeType,
      });
    } else {
      const body = (await request.json()) as { textProof?: string };
      const textProof = String(body.textProof ?? "").trim();
      if (!textProof) {
        return NextResponse.json({ error: "Потрібен текст доказу" }, { status: 400 });
      }
      outcome = await verifyProofText({
        achievementTitle: achievement.title,
        achievementDescription: achievement.description,
        proofText: textProof,
      });
    }
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Перевірка не вдалася";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const passed = outcome.confidence >= CONFIDENCE_THRESHOLD;

  const previousTotalXP = achievement.user.totalXP;
  const previousLevel = levelFromTotalXp(previousTotalXP);
  const willComplete = passed && !achievement.completed;
  const xpGained = willComplete ? achievement.xp : 0;
  const newTotalXP = previousTotalXP + xpGained;
  const newLevel = levelFromTotalXp(newTotalXP);
  const levelUp = willComplete && newLevel > previousLevel;

  await prisma.$transaction(async (tx) => {
    await tx.verificationLog.create({
      data: {
        userId,
        achievementId,
        result: passed,
        confidence: outcome.confidence,
      },
    });

    if (passed && !achievement.completed) {
      await tx.achievement.update({
        where: { id: achievementId },
        data: {
          completed: true,
          completedAt: new Date(),
          archived: true,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { totalXP: { increment: achievement.xp } },
      });
    }
  });

  return NextResponse.json({
    completed: passed,
    confidence: outcome.confidence,
    reason: outcome.reason,
    achievementCompleted: willComplete,
    xpGained,
    totalXP: newTotalXP,
    level: newLevel,
    previousLevel,
    levelUp,
  });
}
