/** Категорії життя — для реєстрації (onboarding / POST profile); модель у БД — довільний рядок. */
export const USER_CATEGORY_OPTIONS = [
  { value: "student", label: "Навчання / студентство" },
  { value: "worker", label: "Робота" },
  { value: "military", label: "Служба" },
  { value: "creative", label: "Творчість" },
  { value: "business", label: "Бізнес / проєкти" },
] as const;

export type UserCategoryValue = (typeof USER_CATEGORY_OPTIONS)[number]["value"];

/** Для onboarding: лише фіксовані коди категорії. */
export function parseUserCategory(value: string): UserCategoryValue | null {
  const v = String(value).toLowerCase();
  return USER_CATEGORY_OPTIONS.some((o) => o.value === v)
    ? (v as UserCategoryValue)
    : null;
}

const MAX_CATEGORY_LEN = 120;

/** Вільний текст категорії (налаштування профілю): обрізка, нормалізація пробілів. */
export function normalizeFreeformCategory(raw: string): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_CATEGORY_LEN);
}
