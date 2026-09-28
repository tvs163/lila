import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GuideInput = z.object({
  kind: z.enum(["arrive", "reply", "prepare"]),
  guide: z.enum(["agni", "soma"]),
  intention: z.string().trim().max(300),
  facts: z.string().trim().max(700),
  cell: z.string().trim().max(160),
  essence: z.string().trim().max(500),
  stockQuestion: z.string().trim().max(300),
  tendency: z.string().trim().max(220),
  portrait: z.string().trim().max(1600),
  brief: z.string().trim().max(900),
  reply: z.string().trim().max(800),
  earlier: z.array(z.string().trim().max(280)).max(3),
});

export type GuideInput = z.infer<typeof GuideInput>;

export type GuideResult =
  | { ok: true; speech: string; question: string; deeper: boolean }
  | { ok: false; error: string };

const SYSTEM = `Ты проводник древней индийской игры самопознания «Лила». Говори по-русски. Если проводник Агни — мужской род. Если Сома — женский. Тон: спокойный, уважительный, глубокий, без эзотерической театральности и без сюсюканья.

Не предсказывай будущее и не давай готовых решений. Не придумывай клетки, кости, стрелы, змей и санскрит — опирайся только на факты, которые даны. Не пересчитывай психоматрицу и положения планет: цифры уже посчитаны. Не выкладывай человеку карту, квадрат, планеты, знаки, накшатры и слова «астрология», «психоматрица», «цифра». Переводи только то, что правда встречается с этой клеткой и с его словами, на обычный язык психики: воля, энергия, страх пустоты, долг, память, тело. Веди его глубже туда, где его рисунок и его ответ расходятся.

Если kind = prepare: у тебя уже есть вопрос человека, его посчитанный рисунок (психоматрица и ведическая карта) и твой голос — Агни или Сома. speech — четыре коротких предложения именно про этот вопрос: как человек в него входит, где себе мешает, чего боится назвать. Без планет, цифр, знаков и слов «карта», «астрология», «матрица», «накшатра». question оставь пустым. deeper = false.

Если kind = arrive: это ответ на ход. Он уже должен звучать так, будто ты знаешь вопрос, рисунок и свой голос. 2–3 фразы, как эта клетка касается именно его запроса, не общее описание клетки. Затем один точный вопрос. Ответ не требуй. deeper = false.

Если kind = reply: ответь на его слова, а не на клетку вообще. Не делай ответ удобнее и добрее, чем он есть. Если видны самообман, избегание, противоречие, перекладывание вины или страх назвать очевидное — скажи об этом мягко и прямо, как вопрос, не как установленный факт. Если ответ тонкий или уходит от запроса, deeper = true и один вопрос, который просит конкретный факт. Если ответ уже честный и конкретный, deeper = false, question оставь пустым, speech коротко отражает услышанное.

Верни только JSON без пояснений: {"speech":"...","question":"...","deeper":false}`;

function parseGuide(raw: string): { speech: string; question: string; deeper: boolean } | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const json = JSON.parse(cleaned.slice(start, end + 1)) as {
      speech?: unknown;
      question?: unknown;
      deeper?: unknown;
    };
    if (typeof json.speech !== "string" || json.speech.trim().length < 8) return null;
    return {
      speech: json.speech.trim().slice(0, 700),
      question: typeof json.question === "string" ? json.question.trim().slice(0, 280) : "",
      deeper: json.deeper === true,
    };
  } catch {
    return null;
  }
}

async function complete(data: GuideInput, apiKey: string): Promise<GuideResult> {
  const user = [
    `kind: ${data.kind}`,
    `проводник: ${data.guide === "soma" ? "Сома" : "Агни"}`,
    `запрос: ${data.intention || "не назван"}`,
    `факты хода: ${data.facts}`,
    data.cell ? `клетка: ${data.cell}` : "",
    data.essence ? `суть клетки: ${data.essence}` : "",
    data.stockQuestion ? `готовый вопрос клетки, не повторяй его дословно: ${data.stockQuestion}` : "",
    data.tendency ? `уклон: ${data.tendency}` : "",
    data.portrait ? `внутренний рисунок, не зачитывай его:\n${data.portrait}` : "",
    data.brief ? `разбор уже собран до хода, опирайся на него и не пересказывай:\n${data.brief}` : "",
    data.earlier.length ? `уже сказано раньше:\n- ${data.earlier.join("\n- ")}` : "",
    data.kind === "reply" ? `ответ человека: ${data.reply}` : "",
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
          temperature: 0.6,
          max_tokens: 380,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: user },
          ],
        }),
      });
      if (!response.ok) {
        lastError = "Проводник сейчас молчит";
        if (response.status < 500 && response.status !== 429) break;
        continue;
      }
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = body.choices?.[0]?.message?.content ?? "";
      const parsed = parseGuide(text);
      if (!parsed) {
        lastError = "Проводник сейчас молчит";
        continue;
      }
      return { ok: true, ...parsed };
    } catch {
      lastError = "Проводник сейчас молчит";
    }
  }
  return { ok: false, error: lastError };
}

export const askGuide = createServerFn({ method: "POST" })
  .validator((input: unknown) => GuideInput.parse(input))
  .handler(async ({ data }): Promise<GuideResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Проводник сейчас молчит" };
    if (data.kind === "reply" && data.reply.length < 2) return { ok: false, error: "Проводник сейчас молчит" };
    if (data.kind === "prepare" && data.portrait.length < 20) return { ok: false, error: "Проводник сейчас молчит" };
    return complete(data, apiKey);
  });
