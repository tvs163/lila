import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { letterSeed } from "@/lib/vedic/portrait";

export type PathLetter = {
  temperament: string;
  prism: string;
  strength: string;
  shadow: string;
  tools: string[];
  heart: string;
};

const Input = z.object({
  guide: z.enum(["agni", "soma"]),
  player: z.enum(["woman", "man"]),
  nickname: z.string().trim().max(40),
  intention: z.string().trim().min(4).max(300),
  birth: z.object({
    date: z.string().max(20),
    time: z.string().max(12),
    placeLabel: z.string().max(80),
    lat: z.number(),
    lon: z.number(),
    timeZone: z.string().max(64),
  }),
  cells: z.array(z.number().int().min(1).max(72)).max(24),
  notes: z.array(z.string().trim().max(240)).max(4),
  seeing: z.string().trim().max(220).default(""),
  part: z.enum(["reading", "steps"]),
  prior: z.string().trim().max(500).default(""),
});

export type PieceResult =
  | { ok: true; part: "reading"; temperament: string; prism: string }
  | { ok: true; part: "steps"; strength: string; shadow: string; tools: string[]; heart: string }
  | { ok: false; error: string };

const BANNED = /астролог|гороскоп|планет|зодиак|накшатр|лагн|психоматриц|дата рождения|натальн/i;

const RULES = `Пиши по-русски, живо, без списка и без театра. Агни — мужской род, Сома — женский. Основу не называй источником и не перечисляй. Нельзя слова: астрология, гороскоп, планета, знак, накшатра, лагна, психоматрица, цифра, дата рождения, карта, матрица. Не называй пол. Не предсказывай. Только JSON.`;

function cleanJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function textOf(value: unknown, min: number, max: number) {
  return typeof value === "string" && value.trim().length >= min ? value.trim().slice(0, max) : "";
}

function parseReading(raw: string): { temperament: string; prism: string } | null {
  const json = cleanJson(raw);
  if (!json) return null;
  const temperament = textOf(json.temperament, 50, 900);
  const prism = textOf(json.prism, 40, 800);
  if (!temperament || !prism || BANNED.test(`${temperament} ${prism}`)) return null;
  return { temperament, prism };
}

function parseSteps(raw: string): { strength: string; shadow: string; tools: string[]; heart: string } | null {
  const json = cleanJson(raw);
  if (!json) return null;
  const strength = textOf(json.strength, 24, 600);
  const shadow = textOf(json.shadow, 24, 600);
  const heart = textOf(json.heart, 24, 600);
  const tools = Array.isArray(json.tools)
    ? json.tools.filter((item): item is string => typeof item === "string" && item.trim().length > 8).map((item) => item.trim().slice(0, 220)).slice(0, 4)
    : [];
  if (!strength || !shadow || !heart || tools.length < 3 || BANNED.test([strength, shadow, heart, ...tools].join(" "))) return null;
  return { strength, shadow, tools, heart };
}

export const composeLetter = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<PieceResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Проводник сейчас молчит" };
    const seed = letterSeed(data.birth).slice(0, 700);
    if (seed.length < 12) return { ok: false, error: "Проводник сейчас молчит" };
    const voice = data.guide === "soma" ? "Сома" : "Агни";
    const who = data.player === "man" ? "мужчина" : "женщина";
    const shared = [
      `проводник: ${voice}`,
      `игрок: ${who}`,
      data.nickname ? `имя: ${data.nickname}` : "",
      `вопрос: ${data.intention}`,
      data.seeing ? `отвечает: ${data.seeing}` : "",
      `основа: ${seed}`,
    ]
      .filter(Boolean)
      .join("\n");
    const system =
      data.part === "reading"
        ? `${RULES} temperament — 4 предложения про внутренний уклад. prism — 3 предложения, как этот уклад становится призмой именно его вопроса. JSON: {"temperament":"...","prism":"..."}`
        : `${RULES} Уклад уже есть, не повторяй его. strength — 2 предложения, сильная сторона в этом вопросе. shadow — 2 предложения, где сам себе мешает. tools — ровно 4 коротких шага. heart — 2 предложения: нужное уже внутри. JSON: {"strength":"...","shadow":"...","tools":["...","...","...","..."],"heart":"..."}`;
    const user = data.part === "steps" && data.prior ? `${shared}\nуже сказано: ${data.prior}` : shared;
    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(12000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.4,
          max_tokens: data.part === "reading" ? 420 : 380,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!response.ok) return { ok: false, error: "Проводник сейчас молчит" };
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const raw = body.choices?.[0]?.message?.content ?? "";
      if (data.part === "reading") {
        const parsed = parseReading(raw);
        if (!parsed) return { ok: false, error: "Проводник сейчас молчит" };
        return { ok: true, part: "reading", ...parsed };
      }
      const parsed = parseSteps(raw);
      if (!parsed) return { ok: false, error: "Проводник сейчас молчит" };
      return { ok: true, part: "steps", ...parsed };
    } catch {
      return { ok: false, error: "Проводник сейчас молчит" };
    }
  });

