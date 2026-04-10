import { createHash } from "crypto";

/** 6 цифр, без пробілів */
export function isValidLoginPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{6}$/.test(pin);
}

export function hashLoginPin(pin: string): string {
  if (!isValidLoginPin(pin)) {
    throw new Error("Код має складатися з 6 цифр");
  }
  const pepper =
    process.env.AUTH_PIN_PEPPER?.trim() ||
    (process.env.NODE_ENV === "development"
      ? "gam_elife_dev_pepper_not_for_production"
      : "");
  if (!pepper) {
    throw new Error("AUTH_PIN_PEPPER не налаштовано в змінних оточення");
  }
  return createHash("sha256").update(`${pepper}:${pin}`, "utf8").digest("hex");
}
