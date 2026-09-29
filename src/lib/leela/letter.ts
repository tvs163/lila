import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { squareById } from "@/lib/leela/board";
import { letterSeed } from "@/lib/vedic/portrait";

export type PathLetter = {
  temperament: string;
  prism: string;
  strength: string;
  shadow: string;
  tools: string[];
  heart: string;
};

export type LetterResult = { ok: true; letter: PathLetter } | { ok: false; error: string };

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
});

const SYSTEM = `Ты проводник «Лилы». Письмо по-русски, его должно быть интересно читать. Агни — мужской род, Сома — женский. Спокойно, образно, без театра и без списка тезисов.
Основа уже посчитана и переведена на обычный язык: как человек встречает мир, чувствует, думает, действует и где у него опора. Это короткая основа характера. Сплети её с его вопросом. Не называй источник. Нельзя: астрология, гороскоп, планета, знак, накшатра, лагна, психоматрица, цифра, дата рождения, карта, матрица. Не называй пол. Не предсказывай. Не перечисляй клетки и не повторяй основу списком.
Если сказано, чем он отвечает — ощущениями, мыслями или эмоциями — уклад, призму и шаги пиши на этом языке.
temperament — 5 предложений: внутренний уклад личности, как эти настройки вообще устроены.
prism — 4 предложения: как именно этот уклад становится призмой, через которую он видит свой вопрос. Не общий характер, а этот вопрос.
strength — 3 предложения: сильная сторона этого уклада в его вопросе.
shadow — 3 предложения: слабая сторона этого уклада, где он сам себе мешает. Прямо, без ярлыка.
tools — ровно 4 конкретных шага под этот вопрос и этот уклад. Каждый — одно живое предложение.
heart — 3 предложения: нужное уже есть, его ищут внутри. Вопрос, который истощал, может стать источником силы.
Только JSON: {"temperament":"...","prism":"...","strength":"...","shadow":"...","tools":["...","...","...","..."],"heart":"..."}`;

const forbidden = /астролог|гороскоп|планет|зодиак|накшатр|лагн|психоматриц|дата рождения|натальн/i;

function parseLetter(raw: string): PathLetter | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const json = JSON.parse(cleaned.slice(start, end + 1)) as {
      temperament?: unknown;
      prism?: unknown;
      strength?: unknown;
      shadow?: unknown;
      tools?: unknown;
      heart?: unknown;
    };
    const text = (value: unknown, min: number, max: number) => (typeof value === "string" && value.trim().length >= min ? value.trim().slice(0, max) : "");
    const temperament = text(json.temperament, 80, 1200);
    const prism = text(json.prism, 60, 1000);
    const strength = text(json.strength, 40, 700);
    const shadow = text(json.shadow, 40, 700);
    const heart = text(json.heart, 40, 800);
    const tools = Array.isArray(json.tools)
      ? json.tools.filter((item): item is string => typeof item === "string" && item.trim().length > 8).map((item) => item.trim().slice(0, 260)).slice(0, 4)
      : [];
    if (!temperament || !prism || !strength || !shadow || !heart || tools.length < 3) return null;
    const whole = [temperament, prism, strength, shadow, heart, ...tools].join(" ");
    if (forbidden.test(whole)) return null;
    return { temperament, prism, strength, shadow, tools, heart };
  } catch {
    return null;
  }
}

export const composeLetter = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<LetterResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Проводник сейчас молчит" };
    const seed = letterSeed(data.birth);
    if (seed.length < 12) return { ok: false, error: "Проводник сейчас молчит" };
    const trail = data.cells
      .map((id) => {
        try {
          return squareById(id).name;
        } catch {
          return "";
        }
      })
      .filter(Boolean);
    const user = [
      `проводник: ${data.guide === "soma" ? "Сома" : "Агни"}`,
      `игрок: ${data.player === "man" ? "мужчина" : "женщина"}`,
      data.nickname ? `имя, каким он назвался: ${data.nickname}` : "",
      `запрос: ${data.intention}`,
      trail.length ? `пройденное, не перечисляй: ${trail.slice(0, 8).join(", ")}` : "",
      data.notes.length ? `заметки, не цитируй: ${data.notes.join(" | ")}` : "",
      data.seeing ? `чем отвечает, не зачитывай ярлык: ${data.seeing}` : "",
      `основа, не зачитывай: ${seed}`,
    ]
      .filter(Boolean)
      .join("\n");

    let lastError = "Проводник сейчас молчит";
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          signal: AbortSignal.timeout(22000),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            temperature: 0.5,
            max_tokens: 900,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: user },
            ],
          }),
        });
        if (!response.ok) {
          if (response.status < 500 && response.status !== 429) break;
          continue;
        }
        const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const parsed = parseLetter(body.choices?.[0]?.message?.content ?? "");
        if (!parsed) {
          lastError = "Проводник сейчас молчит";
          continue;
        }
        return { ok: true, letter: parsed };
      } catch {
        return { ok: false, error: "Проводник сейчас молчит" };
      }
    }
    return { ok: false, error: lastError };
  });
