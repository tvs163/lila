import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { squareById } from "@/lib/leela/board";
import { birthPortrait } from "@/lib/vedic/portrait";

export type PathLetter = {
  fold: string;
  strength: string;
  shadow: string;
  emotions: string;
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
});

const SYSTEM = `Ты проводник игры самопознания «Лила». Письмо человеку после третьего хода, по-русски. Если проводник Агни — мужской род. Если Сома — женский. Тон спокойный, тёплый и прямой, без театра и без сюсюканья.

Внутри у тебя есть посчитанный рисунок: ведическая карта и цифровая психология (психоматрица). Персонализируй ими склад, силу, слабину, чувства и практики под его запрос. Человеку источник не показывай. Запрещены слова: астрология, гороскоп, планета, знак зодиака, накшатра, лагна, дом, психоматрица, цифра, дата рождения, карта, матрица, натальная. Не называй пол. Не предсказывай будущее. Не перечисляй клетки и не объясняй правила игры.

fold: общими чертами, какой он именно в этом запросе. 4–6 коротких предложений. Узнаваемо, без диагноза и без лести.
strength: сильные психологические стороны, которые уже служат этому запросу. 2–3 предложения.
shadow: слабые психологические стороны, где он себе мешает в этом запросе. 2–3 предложения, прямо и без ярлыка.
emotions: как ему работать со своими эмоциями в этом вопросе. 3–4 предложения, конкретно: что замечать, что не глушить, куда девать чувство.
tools: ровно 4 практики под этот запрос. Каждая — одно предложение, что делать в ближайшие дни. Тело, запись, разговор или пауза. Без ритуалов.
heart: слова, которые подбодрят и напомнят, что нужное у него уже есть, его надо найти внутри, а не добыть снаружи. 3–4 предложения. Без лозунга и без «вселенная».

Верни только JSON: {"fold":"...","strength":"...","shadow":"...","emotions":"...","tools":["...","...","...","..."],"heart":"..."}`;

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
      emotions?: unknown;
      tools?: unknown;
      heart?: unknown;
    };
    const text = (value: unknown, min: number, max: number) => (typeof value === "string" && value.trim().length >= min ? value.trim().slice(0, max) : "");
    const fold = text(json.fold, 40, 900);
    const strength = text(json.strength, 20, 500);
    const shadow = text(json.shadow, 20, 500);
    const emotions = text(json.emotions, 20, 700);
    const heart = text(json.heart, 20, 700);
    const tools = Array.isArray(json.tools)
      ? json.tools.filter((item): item is string => typeof item === "string" && item.trim().length > 8).map((item) => item.trim().slice(0, 220)).slice(0, 4)
      : [];
    if (!fold || !strength || !shadow || !emotions || !heart || tools.length < 3) return null;
    const whole = [fold, strength, shadow, emotions, heart, ...tools].join(" ");
    if (forbidden.test(whole)) return null;
    return { fold, strength, shadow, emotions, tools, heart };
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
            max_tokens: 1200,
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
