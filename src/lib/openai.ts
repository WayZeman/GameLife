import OpenAI from "openai";

export type UserProfileForAi = {
  name: string;
  age: number;
  category: string;
  interests: string;
  mainGoal: string;
  horizons: ("day" | "week" | "month")[];
  conversationSummary?: string;
};

/** Щоденні / щотижневі / щомісячні завдання (оновлюються у своєму циклі) */
export type Period = "day" | "week" | "month";

export type GeneratedAchievement = {
  title: string;
  description: string;
  category: "health" | "learning" | "discipline" | "finance" | "social";
  difficulty: "easy" | "medium" | "hard";
  xp: number;
  period: Period;
};

export type VerificationOutcome = {
  completed: boolean;
  confidence: number;
  reason: string;
};

export type OnboardingProfilePayload = {
  name: string;
  age: number;
  category: "student" | "worker" | "military" | "creative" | "business";
  interests: string;
  mainGoal: string;
  horizons: Period[];
};

export type OnboardingStepResult = {
  phase: "question" | "ready";
  assistantMessage: string;
  profile: OnboardingProfilePayload | null;
};

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY не налаштовано. Додай ключ у файл .env");
  }
  return new OpenAI({ apiKey: key });
}

const ONBOARDING_SYSTEM = `Ти ведеш теплу розмову українською в застосунку «гра життєвих досягнень».

Обов'язково в кожній відповіді (phase "question"):
- assistantMessage НІКОЛИ не порожній і не зводиться до «чекаю», мовчання чи натяку, що треба щось написати без конкретного питання.
- Завжди є або тепла реакція на сказане, або одне чітке наступне питання (краще — і те, і те стисло).

Порядок знайомства (дотримуйся по черзі, поки не збереш дані):
1) Як звати (ім'я).
2) Вік.
3) Чим займається / чим живе зараз (навчання, робота, служба, творчість тощо — звичайними словами).
4) Хобі, інтереси, що подобається.
5) До чого прагне, що важливо зараз (мотивація, цілі — навіть загально).

Питання про «день / тиждень / місяць» планування НЕ став окремим шаблоном і не на початку. Якщо людина сама не сказала про «темп» кроків — підбери поле horizons у profile з контексту (наприклад активні короткі кроки → day; більші цілі → month) або лиши розумний дефолт month. Окреме довге питання про зручність планування лише якщо без нього зовсім ніяк — одним коротким реченням і своїми словами, не як опитувальник. Якщо горизонти можна вивести з контексту — не розпитуй окремо.

Заборонені штампи та порожні вступи (не використовуй):
- «Так, я тут», «я на зв'язку», «чекаю на твою відповідь» без змісту.
- Подяка «за мету» / «що поділилася», якщо людина ще не розповідала про мету.
- Фраза на кшталт «Як тобі зручніше планувати кроки: на кожен день, тиждень чи місяць?» як готовий блок — заборонено.

Загалом: коротко, по-людськи, без англійських службових слів (student, day, week, month тощо) у тексті для користувача.

Коли є ім'я, вік, хоч щось про життя/інтереси і хоч загальна мотивація — можеш перейти до phase "ready" і заповнити profile. Коди category та horizons у JSON підстав сам; користувач їх не бачить.

Відповідай ЛИШЕ валідним JSON без markdown:
{
  "phase": "question" | "ready",
  "assistantMessage": "текст для користувача українською",
  "profile": null | {
    "name": "string",
    "age": number,
    "category": "student" | "worker" | "military" | "creative" | "business",
    "interests": "string",
    "mainGoal": "string",
    "horizons": ["day" | "week" | "month", ...]
  }
}

Якщо phase "ready", profile обов'язковий і horizons не порожній (хоча б один елемент).`;

export async function onboardingStep(
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<OnboardingStepResult> {
  const client = getClient();
  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: ONBOARDING_SYSTEM },
  ];

  if (messages.length === 0) {
    apiMessages.push({
      role: "user",
      content:
        "Користувач щойно відкрив діалог — ти перший пишеш. Дай одне повідомлення: коротке привітання і ОДНЕ перше питання (почни з імені — як звертатися / як звати). Заборонено: порожній текст, «я тут», «чекаю», подяка за неіснуючу розповідь. Без англійських слів.",
    });
  } else {
    for (const m of messages) {
      apiMessages.push({ role: m.role, content: m.content });
    }
  }

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.65,
    response_format: { type: "json_object" },
    messages: apiMessages,
  });

  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Порожня відповідь від OpenAI");

  const parsed = JSON.parse(raw) as {
    phase?: string;
    assistantMessage?: string;
    profile?: OnboardingProfilePayload | null;
  };

  const phase = parsed.phase === "ready" ? "ready" : "question";
  let assistantMessage = String(parsed.assistantMessage ?? "").trim();
  if (assistantMessage.length < 3) {
    assistantMessage =
      "Привіт! Радію, що ти тут. Як тебе звати й скільки тобі років?";
  }

  if (phase === "ready" && parsed.profile) {
    const p = normalizeProfile(parsed.profile);
    return { phase: "ready", assistantMessage, profile: p };
  }

  return { phase: "question", assistantMessage, profile: null };
}

function normalizeProfile(p: OnboardingProfilePayload): OnboardingProfilePayload {
  const age = Math.max(1, Math.min(120, Math.floor(Number(p.age) || 25)));
  const cat = parseCategory(String(p.category));
  const horizons = normalizeHorizons(p.horizons);
  return {
    name: String(p.name ?? "").trim() || "Гравець",
    age,
    category: cat,
    interests: String(p.interests ?? "").trim() || "—",
    mainGoal: String(p.mainGoal ?? "").trim() || "—",
    horizons,
  };
}

function parseCategory(
  v: string
): OnboardingProfilePayload["category"] {
  const c = String(v).toLowerCase();
  if (
    c === "student" ||
    c === "worker" ||
    c === "military" ||
    c === "creative" ||
    c === "business"
  ) {
    return c;
  }
  return "creative";
}

function normalizeHorizons(h: unknown): Period[] {
  if (!Array.isArray(h) || h.length === 0) return ["month"];
  const legacy = (x: string): string =>
    x === "year" ? "month" : x;
  const allowed = new Set<Period>(["day", "week", "month"]);
  const out = h
    .map((x) => legacy(String(x).toLowerCase()))
    .filter((x): x is Period => allowed.has(x as Period));
  const uniq = Array.from(new Set(out));
  return uniq.length ? uniq : ["month"];
}

export async function generateAchievementsAndWelcome(
  profile: UserProfileForAi
): Promise<{ achievements: GeneratedAchievement[]; welcomeMessage: string }> {
  const br = DEFAULT_ONBOARDING_BREAKDOWN;
  const d = br.day;
  const w = br.week;
  const m = br.month;
  const n = d + w + m;
  const conv = profile.conversationSummary
    ? `\nКонтекст розмови з користувачем:\n${profile.conversationSummary.slice(0, 3000)}`
    : "";

  const specLines: string[] = [
    `- рівно ${d} штук з "period": "day" (щоденні)`,
    `- рівно ${w} штук з "period": "week" (щотижневі)`,
    `- рівно ${m} штук з "period": "month" (щомісячні)`,
  ];

  const userContent = [
    `Це ПЕРШИЙ список досягнень для нового користувача. Усього рівно ${n} завдань — не менше й не більше.`,
    `Профіль:`,
    `Ім'я: ${profile.name}`,
    `Вік: ${profile.age}`,
    `Категорія життя: ${profile.category}`,
    `Інтереси: ${profile.interests}`,
    `Головна ціль / прагнення: ${profile.mainGoal}`,
    `Горизонти (для контексту): ${profile.horizons.join(", ")}`,
    conv,
    "",
    "Суворо дотримуйся кількості за періодом (не змішуй зайві в інший період):",
    specLines.join("\n"),
    "",
    "Нагорода xp (цілі числа): для period day — 25–120; для week — 130–280; для month — 290–500. Щомісячні завжди більші за щотижневі, щотижневі більші за щоденні.",
    "",
    `Відповідай ЛИШЕ JSON:`,
    `{`,
    `  "welcomeMessage": "короткий теплий текст українською: вітаєш, нагадуєш мотивацію, пояснюєш що є щоденні, щотижневі й щомісячні кроки (2–4 речення)",`,
    `  "achievements": [ ... рівно ${n} об'єктів з полями title, description, category, difficulty, xp, period ]`,
    `}`,
    `Рівно ${n} елементів у achievements. Тексти українською.`,
  ].join("\n");

  const client = getClient();
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.65,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Ти коуч гейміфікації життя. Створюєш перший набір досягнень з ТОЧНИМ дотриманням кількості для day/week/month. XP: щоденні найменші, щотижневі більші, щомісячні найбільші (див. діапазони в запиті). Лише JSON.",
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Порожня відповідь від OpenAI");

  const parsed = JSON.parse(raw) as {
    welcomeMessage?: string;
    achievements?: GeneratedAchievement[];
  };

  const welcomeMessage = String(parsed.welcomeMessage ?? "").trim() ||
    `Вітаю, ${profile.name}! У тебе 3 щоденні, 5 щотижневих і 7 щомісячних кроків — обирай з чого почати.`;

  const list = parsed.achievements;
  if (!Array.isArray(list)) {
    throw new Error("Некоректні дані досягнень від моделі");
  }

  const mapped = list.map((a) => mapGeneratedAchievementRow(a));

  const achievements = padAchievementsToBreakdown(
    mapped,
    br,
    profile.name
  );

  return { achievements, welcomeMessage };
}

function mapGeneratedAchievementRow(a: unknown): GeneratedAchievement {
  const row = a as GeneratedAchievement;
  const period = normalizePeriod(row.period);
  return {
    title: String(row.title ?? "").trim() || "Крок уперед",
    description: String(row.description ?? "").trim() || "Невеликий осмислений крок до твоєї мети.",
    category: normalizeCategory(String(row.category)),
    difficulty: normalizeDifficulty(String(row.difficulty)),
    xp: clampXpForPeriod(period, Number(row.xp)),
    period,
  };
}

/** Якщо модель повернула не ту кількість або перекіс по періодах — добираємо до breakdown без падіння реєстрації. */
function padAchievementsToBreakdown(
  mapped: GeneratedAchievement[],
  br: AchievementPeriodBreakdown,
  displayName: string
): GeneratedAchievement[] {
  const targets: Record<Period, number> = {
    day: br.day,
    week: br.week,
    month: br.month,
  };
  const buckets: Record<Period, GeneratedAchievement[]> = {
    day: [],
    week: [],
    month: [],
  };

  for (const a of mapped) {
    const p = a.period;
    if (buckets[p].length < targets[p]) {
      buckets[p].push(a);
    }
  }

  const name = displayName.trim() || "друг";
  for (const p of ["day", "week", "month"] as Period[]) {
    let i = buckets[p].length;
    while (buckets[p].length < targets[p]) {
      buckets[p].push(makePlaceholderAchievement(p, i, name));
      i += 1;
    }
  }

  return [...buckets.day, ...buckets.week, ...buckets.month];
}

function makePlaceholderAchievement(
  period: Period,
  index: number,
  name: string
): GeneratedAchievement {
  const dayPool: { title: string; description: string }[] = [
    {
      title: "Щоденна хвилина ясності",
      description: `Коротко запиши одну дію на сьогодні, яка наближає тебе до мети, ${name}.`,
    },
    {
      title: "Маленький крок сьогодні",
      description:
        "Зроби одну дрібну справу (5–15 хв), яку ти відкладав — без ідеалу, лише старт.",
    },
    {
      title: "Ритуал фокусу",
      description:
        "Обери один короткий ритуал на сьогодні: розтяжка, прогулянка або тиша без екрана 10 хв.",
    },
  ];
  const weekPool: { title: string; description: string }[] = [
    {
      title: "Підсумок тижня",
      description: `Раз на тиждень коротко: що вийшло, що змінити — один абзац для ${name}.`,
    },
    {
      title: "Тижневий експеримент",
      description:
        "Один тиждень спробуй нову звичку в малій дозі — щодня мінімум, але без перерви.",
    },
    {
      title: "Глибока година",
      description:
        "Виділи цього тижня одну годину без відволікань на важливу справу чи навчання.",
    },
    {
      title: "Крок до людей",
      description:
        "Заплануй одну зустріч або відкрите повідомлення людині, з якою хочеш бути на зв’язку.",
    },
    {
      title: "Фінансовий огляд",
      description:
        "Переглянь витрати й один пункт, де можна зменшити випадкові витрати цього тижня.",
    },
  ];
  const monthPool: { title: string; description: string }[] = [
    {
      title: "Місячна опорна ціль",
      description: `Сформулюй одну головну ціль на місяць і перший проміжний крок для ${name}.`,
    },
    {
      title: "Огляд прогресу",
      description:
        "Наприкінці місяця оціни 1–10 три сфери: здоров’я, навчання/робота, стосунки — і один фокус на наступний місяць.",
    },
    {
      title: "Проєкт «довше за тиждень»",
      description:
        "Обери справу, яку не закінчити за тиждень — розбий на 3 етапи й зроби перший цього місяця.",
    },
    {
      title: "День без виправдань",
      description:
        "Заплануй один день місяця, коли виконуєш заздалегідь обіцяне собі — без переносів.",
    },
    {
      title: "Ресурс для росту",
      description:
        "Виділи бюджет або час на одну книгу, курс чи інструмент, що підсилює твою мету.",
    },
    {
      title: "Подяка собі",
      description:
        "Запиши три речі, якими пишаєшся за місяць — навіть якщо це здається дрібницями.",
    },
    {
      title: "Чистий старт наступного циклу",
      description:
        "Перед новим місяцем прибери одне фізичне або цифрове місце, щоб легше дихалося.",
    },
  ];

  const pool =
    period === "day" ? dayPool : period === "week" ? weekPool : monthPool;
  const pick = pool[index % pool.length];
  const midXp =
    period === "day" ? 72 : period === "week" ? 205 : 395;
  return {
    title: pick.title,
    description: pick.description,
    category: "discipline",
    difficulty: "easy",
    xp: clampXpForPeriod(period, midXp),
    period,
  };
}

function normalizePeriod(p: unknown): Period {
  const v = String(p ?? "month").toLowerCase();
  if (v === "year") return "month";
  if (v === "day" || v === "week" || v === "month") return v;
  return "month";
}

function normalizeCategory(
  c: string
): "health" | "learning" | "discipline" | "finance" | "social" {
  const v = String(c).toLowerCase();
  if (
    v === "health" ||
    v === "learning" ||
    v === "discipline" ||
    v === "finance" ||
    v === "social"
  ) {
    return v;
  }
  return "learning";
}

function normalizeDifficulty(c: string): "easy" | "medium" | "hard" {
  const v = String(c).toLowerCase();
  if (v === "easy" || v === "medium" || v === "hard") return v;
  return "medium";
}

/** Діапазони XP: щоденні < щотижневі < щомісячні (місячні завжди найбільші). */
const XP_BAND: Record<Period, readonly [number, number]> = {
  day: [25, 120],
  week: [130, 280],
  month: [290, 500],
};

function clampXpForPeriod(period: Period, raw: number): number {
  const [min, max] = XP_BAND[period] ?? XP_BAND.month;
  const n = Math.round(Number(raw));
  const base = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, base));
}

/** Скільки нових досягнень у кожному періоді (сума = загальна кількість). */
export type AchievementPeriodBreakdown = {
  day: number;
  week: number;
  month: number;
};

/** Базовий стартовий набір при реєстрації: щоденні / щотижневі / щомісячні. */
export const DEFAULT_ONBOARDING_BREAKDOWN: AchievementPeriodBreakdown = {
  day: 3,
  week: 5,
  month: 7,
};

export type AssistantPlannedAction = {
  type: "add_achievements";
  breakdown: AchievementPeriodBreakdown;
};

export type AssistantChatStatus = "continue" | "await_consent" | "cannot_help";

export type AssistantChatResult = {
  reply: string;
  status: AssistantChatStatus;
  consentSummary: string;
  action: AssistantPlannedAction | null;
};

const ASSISTANT_CHAT_SCHEMA = `Відповідай ЛИШЕ валідним JSON (без markdown):
{
  "reply": "текст для користувача українською — твоя репліка в діалозі",
  "status": "continue" | "await_consent" | "cannot_help",
  "consentSummary": "якщо status await_consent — стисло (1–3 речення) що саме буде зроблено; інакше порожній рядок",
  "action": null | {
    "type": "add_achievements",
    "breakdown": { "day": число, "week": число, "month": число }
  }
}

Кожне число в breakdown — скільки НОВИХ досягнень саме цього типу: day=щоденні, week=щотижневі, month=щомісячні. Нулі дозволені (наприклад лише month: 10 — тоді day:0, week:0, month:10).

Критично важливо:
- Якщо користувач просить «N місячних / щоденних / щотижневих» — увесь N став ТІЛЬКИ в відповідне поле breakdown; НЕ розподіляй частину на інші періоди без його явних слів.
- Якщо з запиту НЕОДНОЗНАЧНО: скільки всього, або як поділити між днем/тижнем/місяцем — status ЗАВЖДИ continue: постав ОДНЕ чітке уточнююче питання в reply. НЕ переходь до await_consent, поки користувач явно не погодить розклад (або сам чітко не сформулює одну суму в одному періоді).
- Загальна сума (day+week+month) від 1 до 20 за один раз; кожне поле 0–15.

Правила статусів:
- continue — уточнення, порада, або розмова; якщо треба — питай, не вгадуй розподіл.
- cannot_help — поза межами застосунку; action null.
- await_consent — лише коли розклад breakdown повністю ясний і збігається з тим, про що домовилися. У reply підсумуй числа по періодах і запитай згоду.`;

export async function assistantChatTurn(params: {
  userName: string;
  age: number;
  category: string;
  interests: string;
  mainGoal: string;
  totalXP: number;
  achievements: { title: string; period: string; completed: boolean }[];
  messages: { role: "user" | "assistant"; content: string }[];
}): Promise<AssistantChatResult> {
  const achLines = params.achievements
    .slice(0, 30)
    .map((a) => `- [${a.period}] ${a.completed ? "✓" : "○"} ${a.title}`)
    .join("\n");

  const contextBlock = [
    "Контекст користувача (не цитуй дослівно в reply, лише використовуй):",
    `Ім'я: ${params.userName}`,
    `Вік: ${params.age}`,
    `Категорія: ${params.category}`,
    `Інтереси: ${params.interests}`,
    `Головна ціль: ${params.mainGoal}`,
    `Всього XP: ${params.totalXP}`,
    "",
    "Активні (не в архіві) досягнення (до 30). Базовий стартовий набір: 3 щоденні, 5 щотижневі, 7 щомісячних — додаткові через помічника.",
    achLines || "(немає)",
    "",
    ASSISTANT_CHAT_SCHEMA,
  ].join("\n");

  const recent = params.messages.slice(-24).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content.slice(0, 4000),
  }));

  const systemFull = [
    "Ти помічник у застосунку «гра життєвих досягнень» українською. Допомагаєш лише в межах застосунку: згенерувати нові досягнення-квести, пояснити як користуватися, коротка мотивація в контексті гейміфікації. Не давай медичних/юридичних порад і не виконуй дії поза застосунком. Перед будь-якою зміною даних користувача (нові досягнення) обов'язково дійди до етапу явної згоди: status await_consent. Відповіді в полі reply — природні, не надто довгі. Ніколи не змішуй періоди самовільно: якщо людина хоче лише місячні завдання — у breakdown лише month; якщо не ясно — питай.",
    "",
    contextBlock,
  ].join("\n");

  const client = getClient();
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.55,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemFull },
      ...recent.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  });

  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Порожня відповідь помічника");

  const parsed = JSON.parse(raw) as {
    reply?: string;
    status?: string;
    consentSummary?: string;
    action?: {
      type?: string;
      count?: number;
      breakdown?: { day?: number; week?: number; month?: number };
    } | null;
  };

  const reply = String(parsed.reply ?? "").trim() || "…";
  let status: AssistantChatStatus = "continue";
  if (parsed.status === "await_consent") status = "await_consent";
  else if (parsed.status === "cannot_help") status = "cannot_help";

  let consentSummary = String(parsed.consentSummary ?? "").trim();
  let action: AssistantPlannedAction | null = null;

  function clampBr(n: unknown): number {
    return Math.max(0, Math.min(15, Math.floor(Number(n) || 0)));
  }

  function normalizeBreakdown(
    rawBr: { day?: number; week?: number; month?: number } | undefined,
    legacyCount: number | undefined
  ): AchievementPeriodBreakdown | null {
    if (rawBr && typeof rawBr === "object") {
      let day = clampBr(rawBr.day);
      let week = clampBr(rawBr.week);
      let month = clampBr(rawBr.month);
      let sum = day + week + month;
      if (sum < 1 && legacyCount !== undefined) {
        const c = Math.max(1, Math.min(15, Math.floor(legacyCount)));
        month = c;
        day = 0;
        week = 0;
        sum = month;
      }
      if (sum < 1) return null;
      while (day + week + month > 20) {
        if (month > 0) month--;
        else if (week > 0) week--;
        else if (day > 0) day--;
        else break;
      }
      return { day, week, month };
    }
    if (legacyCount !== undefined) {
      const c = Math.max(1, Math.min(20, Math.floor(Number(legacyCount)) || 2));
      return { day: 0, week: 0, month: c };
    }
    return null;
  }

  if (status === "await_consent") {
    const br = normalizeBreakdown(
      parsed.action?.breakdown,
      parsed.action?.count
    );
    if (!br || br.day + br.week + br.month < 1) {
      status = "continue";
      consentSummary = "";
    } else {
      action = { type: "add_achievements", breakdown: br };
      const total = br.day + br.week + br.month;
      if (!consentSummary) {
        const parts: string[] = [];
        if (br.day) parts.push(`${br.day} щоденних`);
        if (br.week) parts.push(`${br.week} щотижневих`);
        if (br.month) parts.push(`${br.month} щомісячних`);
        consentSummary = `Згенерувати ${total} нових досягнень: ${parts.join(", ")}.`;
      }
    }
  }

  return { reply, status, consentSummary, action };
}

export async function generateExtraAchievements(params: {
  name: string;
  age: number;
  category: string;
  interests: string;
  mainGoal: string;
  existingTitles: string[];
  breakdown: AchievementPeriodBreakdown;
}): Promise<GeneratedAchievement[]> {
  const d = Math.max(0, Math.min(15, Math.floor(params.breakdown.day)));
  const w = Math.max(0, Math.min(15, Math.floor(params.breakdown.week)));
  const m = Math.max(0, Math.min(15, Math.floor(params.breakdown.month)));
  const n = d + w + m;
  if (n < 1 || n > 20) {
    throw new Error("Некоректна кількість досягнень (1–20 за один раз)");
  }

  const avoid = params.existingTitles.slice(0, 50).join("; ");

  const specLines: string[] = [];
  if (d > 0) specLines.push(`- рівно ${d} штук мають мати "period": "day" (щоденні)`);
  if (w > 0) specLines.push(`- рівно ${w} штук мають мати "period": "week" (щотижневі)`);
  if (m > 0) specLines.push(`- рівно ${m} штук мають мати "period": "month" (щомісячні)`);

  const userContent = [
    `Створи рівно ${n} НОВИХ досягнень. Не повторюй і не копіюй існуючі назви.`,
    `Уже є (не дублюй за змістом): ${avoid || "—"}`,
    "",
    `Профіль: ${params.name}, ${params.age} років, категорія ${params.category}`,
    `Інтереси: ${params.interests}`,
    `Головна ціль: ${params.mainGoal}`,
    "",
    "Суворо дотримуйся кількості за типом періоду:",
    specLines.join("\n"),
    "У масиві achievements має бути рівно " +
      String(n) +
      " елементів; жоден period не повинен зламати ці ліміти.",
    "",
    "xp: day — 25–120, week — 130–280, month — 290–500. За однакової складності місячна нагорода завжди вища за тижневу, тижнева — вища за щоденну.",
    "",
    "Відповідай ЛИШЕ JSON:",
    `{ "achievements": [ { "title": "string", "description": "string", "category": "health"|"learning"|"discipline"|"finance"|"social", "difficulty": "easy"|"medium"|"hard", "xp": number, "period": "day"|"week"|"month" } ] }`,
    `Тексти українською.`,
  ].join("\n");

  const client = getClient();
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.65,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Ти коуч гейміфікації. Генеруєш нові досягнення з ТОЧНИМ дотриманням кількості для кожного period. XP: щоденні 25–120, щотижневі 130–280, щомісячні 290–500 (сходинка: день < тиждень < місяць). Лише JSON.",
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("Порожня відповідь при генерації досягнень");

  const parsed = JSON.parse(raw) as { achievements?: GeneratedAchievement[] };
  const list = parsed.achievements;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Модель не повернула досягнення");
  }

  const mapped: GeneratedAchievement[] = list.map((a) => {
    const period = normalizePeriod((a as GeneratedAchievement).period);
    return {
      title: String(a.title),
      description: String(a.description),
      category: normalizeCategory(String(a.category)),
      difficulty: normalizeDifficulty(String(a.difficulty)),
      xp: clampXpForPeriod(period, Number(a.xp)),
      period,
    };
  });

  if (mapped.length < n) {
    throw new Error(`Очікувалось ${n} досягнень, модель повернула менше`);
  }

  return mapped.slice(0, n);
}

const VERIFICATION_SCHEMA = `Відповідай лише JSON:
{
  "completed": boolean,
  "confidence": number (0-100),
  "reason": "коротке пояснення українською"
}`;

const STRICT_PROOF_RULES = `
Спочатку визнач СУТЬ цього досягнення за назвою й описом: що саме треба підтвердити?
- лише факт виконання (зробив / відвідав / написав / відпочив);
- змістову дію без обов'язкових цифр (навичка, звичка, розмова, творчий крок);
- саме вимірювані показники (спорт із рахунком, біг, гроші, навчання з обсягом тощо).

Не застосовуй один шаблон до всіх завдань. Не вимагай часу, дати, «сьогодні», км, хвилин, сум, якщо з опису досягнення це не є його суттю. Коротка відповідь, яка по суті закриває завдання, — нормально; довгий загальний текст без відповіді на завдання — ні.

НЕ зараховуй (completed: false, confidence до 45), якщо:
- лише перефразовано назву/опис або порожні слова на кшталт «зробив», «все ок», «виконав» без жодного змісту, що стосується завдання;
- для завдання з очевидно потрібними цифрами/фактами (пробіг, бюджет, обсяг навчання) їх зовсім немає й відповідь незрозуміла;
- відповідь суперечить суті досягнення або явно уникає питання.

ЗАРАХОВУЙ (completed: true, confidence залежить від повноти), якщо відповідь по суті підтверджує саме це завдання:
- для «факт/звичка»: що саме зроблено однією-двома чесними реченнями без обов'язкового часу — достатньо, якщо зрозуміло, що дія була (наприклад, що саме прочитано, кому написано, що зроблено на проєкті);
- для «метрики»: додай вагу впевненості, якщо є релевантні цифри чи перевірювані деталі; якщо їх мало, але зміст відповідає завданню — можна completed: true з confidence 65–85;
- приклади різних типів: «присідання 3×15, планка хвилину» (спорт); «написав тітці, домовились про зустріч у суботу» (соціальне); «дописав вступ до есе, залишився задоволений структурою» (творче) — без обов'язкового «о котрій» там, де час не важливий.

У полі reason коротко українською: що саме в завданні вимагалося і чи закрив це доказ (або чого не вистачає).
`;

export async function verifyProofText(params: {
  achievementTitle: string;
  achievementDescription: string;
  proofText: string;
}): Promise<VerificationOutcome> {
  const client = getClient();
  const userContent = [
    `Назва досягнення: ${params.achievementTitle}`,
    `Опис: ${params.achievementDescription}`,
    "",
    "Доказ користувача (текст):",
    params.proofText,
    "",
    STRICT_PROOF_RULES,
    "",
    VERIFICATION_SCHEMA,
  ].join("\n");

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Ти справедливий аудитор життєвих досягнень. Оцінюєш текстовий доказ у контексті КОНКРЕТНОГО завдання (назва + опис): різні досягнення — різні очікування щодо деталей. Відхиляй порожні заяви й перефразування; не вимагай часу чи цифр там, де завдання про інше. Не цитуй увесь доказ у reason. Лише валідний JSON.",
      },
      { role: "user", content: userContent },
    ],
  });

  return parseVerification(res.choices[0]?.message?.content);
}

export async function verifyProofImage(params: {
  achievementTitle: string;
  achievementDescription: string;
  imageBase64: string;
  mimeType: string;
}): Promise<VerificationOutcome> {
  const client = getClient();
  const dataUrl = `data:${params.mimeType};base64,${params.imageBase64}`;

  const imageInstructions = [
    `Назва досягнення: ${params.achievementTitle}`,
    `Опис: ${params.achievementDescription}`,
    "",
    "Ураховуй суть завдання: для одного досягнення достатньо наочного підтвердження дії (наприклад, зал, доріжка, конспект), для іншого — важливі саме цифри на екрані. Не вимагай часу/км на фото, якщо завдання не про метрики.",
    "НЕ зараховуй випадкові фото, скріни без контексту, меми або зображення, з яких неможливо зрозуміти зв'язок із цим завданням.",
    "",
    STRICT_PROOF_RULES,
    "",
    VERIFICATION_SCHEMA,
  ].join("\n");

  const res = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Ти справедливий аудитор досягнень за фото. Підтверджуй, якщо зображення в контексті назви й опису завдання логічно доводить зроблене; різні завдання — різна потреба в деталях на знімку. Поле reason — українською. Лише JSON: completed, confidence, reason.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: imageInstructions,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  return parseVerification(res.choices[0]?.message?.content);
}

function parseVerification(raw: string | null | undefined): VerificationOutcome {
  if (!raw) throw new Error("Порожня відповідь перевірки");
  const parsed = JSON.parse(raw) as {
    completed?: boolean;
    confidence?: number;
    reason?: string;
  };
  const confidence = Math.max(
    0,
    Math.min(100, Number(parsed.confidence ?? 0))
  );
  return {
    completed: Boolean(parsed.completed),
    confidence,
    reason: String(parsed.reason ?? "").slice(0, 500),
  };
}
