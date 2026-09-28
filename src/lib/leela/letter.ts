import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { squareById } from "@/lib/leela/board";
import { birthPortrait } from "@/lib/vedic/portrait";

export type PathLetter = {
  fold: string;
  strength: string;
  shadow: string;
  tools: string[];
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
});

const SYSTEM = `Ты проводник игры самопознания «Лила». Письмо в конце пути, по-русски. Если проводник Агни — мужской род. Если Сома — женский. Тон спокойный и прямой, без театра и без сюсюканья.

Внутри у тебя есть посчитанный рисунок человека: ведическая карта и психоматрица. Опирайся на него и на пройденные состояния, но человеку этого не показывай. Запрещены слова и темы: астрология, гороскоп, планета, знак зодиака, накшатра, лагна, дом, психоматрица, цифра, дата рождения, карта, матрица. Не называй пол. Не предсказывай будущее.

Письмо — про его запрос, не про игру. Не перечисляй клетки и не объясняй правила.

fold: какой он в этом вопросе. Узнаваемый склад, 4–6 коротких предложений. Не диагноз и не комплимент.
strength: на что ему реально опираться. 2–3 предложения, конкретно.
shadow: где он себе мешает в этом запросе. 2–3 предложения, прямо, без ярлыка.
tools: ровно 4 инструмента под этот запрос. Каждый — одно предложение: что делать в ближайшие дни. Тело, запись, разговор или пауза. Без ритуалов и без общих слов «полюби себя».

Верни только JSON: {"fold":"...","strength":"...","shadow":"...","tools":["...","...","...","..."]}`;

const forbidden = /астролог|гороскоп|планет|зодиак|накшатр|лагн|психоматриц|дата рождения|натальн/i;

function parseLetter(raw: string): PathLetter | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const json = JSON.parse(cleaned.slice(start, end + 1)) as {
      fold?: unknown;
      strength?: unknown;
      shadow?: unknown;
      tools?: unknown;
    };
    const fold = typeof json.fold === "string" ? json.fold.trim() : "";
    const strength = typeof json.strength === "string" ? json.strength.trim() : "";
    const shadow = typeof json.shadow === "string" ? json.shadow.trim() : "";
    const tools = Array.isArray(json.tools)
      ? json.tools.filter((item): item is string => typeof item === "string" && item.trim().length > 8).map((item) => item.trim().slice(0, 220)).slice(0, 4)
      : [];
    if (fold.length < 40 || strength.length < 20 || shadow.length < 20 || tools.length < 3) return null;
    const whole = [fold, strength, shadow, ...tools].join(" ");
    if (forbidden.test(whole)) return null;
    return { fold: fold.slice(0, 900), strength: strength.slice(0, 500), shadow: shadow.slice(0, 500), tools };
  } catch {
    return null;
  }
}

export const composeLetter = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<LetterResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Проводник сейчас молчит" };
    const portrait = birthPortrait(data.birth);
    if (portrait.length < 20) return { ok: false, error: "Проводник сейчас молчит" };
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
      trail.length ? `состояния, через которые он прошёл, не перечисляй их: ${trail.join(", ")}` : "",
      data.notes.length ? `его заметки себе, не цитируй длинно:\n- ${data.notes.join("\n- ")}` : "",
      `внутренний рисунок, не зачитывай:\n${portrait}`,
    ]
      .filter(Boolean)
      .join("\n");

    let lastError = "Проводник сейчас молчит";
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          signal: AbortSignal.timeout(28000),
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
        lastError = "Проводник сейчас молчит";
      }
    }
    return { ok: false, error: lastError };
  });
