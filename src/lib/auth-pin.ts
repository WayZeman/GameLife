import { createHash } from "crypto";

/** 6 цифр, без пробілів */
export function isValidLoginPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{6}$/.test(pin);
}

/**
 * Порядок: AUTH_PIN_PEPPER (рекомендовано на проді) → dev-строка → стабільний
 * варіант з DATABASE_URL (щоб Vercel працював без окремої змінної).
 */
function resolvePepper(): string {
  const explicit = process.env.AUTH_PIN_PEPPER?.trim();
  if (explicit) return explicit;

  if (process.env.NODE_ENV === "development") {
    return "gam_elife_dev_pepper_not_for_production";
  }

  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl) {
    return createHash("sha256")
      .update(`GameLife:v1:pin-pepper:${dbUrl}`, "utf8")
      .digest("hex");
  }

  throw new Error(
    "Задай AUTH_PIN_PEPPER або DATABASE_URL у змінних оточення (наприклад Vercel → Environment Variables)."
  );
}

export function hashLoginPin(pin: string): string {
  if (!isValidLoginPin(pin)) {
    throw new Error("Код має складатися з 6 цифр");
  }
  const pepper = resolvePepper();
  return createHash("sha256").update(`${pepper}:${pin}`, "utf8").digest("hex");
}
