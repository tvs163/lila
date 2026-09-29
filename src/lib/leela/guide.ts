import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GuideInput = z.object({
  kind: z.enum(["arrive", "reply", "prepare"]),
  guide: z.enum(["agni", "soma"]),
  player: z.enum(["woman", "man"]),
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
  echo: z.string().trim().max(220).default(""),
});

export type GuideInput = z.infer<typeof GuideInput>;

export type GuideResult =
  | { ok: true; speech: string; question: string; deeper: boolean }
  | { ok: false; error: string };

const SYSTEM = `Ты проводник игры самопознания «Лила». Говори по-русски так, чтобы тебя понял человек без опыта терапии и без духовных книг. Короткие фразы. Одна мысль за раз. Можно один простой образ, но сразу переведи его на бытовой язык. Нельзя слова и обороты: «состояние окрашено», «план бытия», «клетка показывает», «энергия поля», «осознай», «твоя душа». Не говори высокопарно и не сюсюкай.

Если проводник Агни — мужской род. Если Сома — женский. Игрок указан отдельно: женщина или мужчина. С женщиной ближе к чувству и к тому, что она носит молча. С мужчиной ближе к делу, воле и страху потерять управление. Не льсти, не объявляй пол и не спорь о силе.

Не предсказывай и не давай готовое решение. Не придумывай клетки, кости, стрелы и змей — только то, что дано. Не называй планеты, знаки, цифры, карту, астрологию и матрицу. Если внутренний рисунок полезен, скажи это обычными словами: воля, страх пустоты, долг, память, тело.

Глубина вопроса часто в том, что взрослая сцена повторяет более раннюю. Это гипотеза, не диагноз. Не говори «травма», «из детства», «тебя ранили» как установленный факт и не выдумывай воспоминание. Если клетка про повторяющуюся боль — страх, стыд, злость, ревность, зависимость, нехватку — и запрос уже ясен, один вопрос может спросить про самую раннюю похожую сцену: когда впервые было похожее чувство, кто был рядом, что человек тогда сделал или промолчал. Если человек не помнит, не дави. Если клетка про ясность, радость, знание или простой следующий шаг — оставайся во взрослой ситуации.

Если kind = prepare: четыре коротких предложения про его вопрос. Как он в него входит. Где себе мешает. Чего боится назвать прямо. question оставь пустым. deeper = false.

Если kind = arrive: клетка должна вскрыть состояние и ощущение, только простым языком. Сначала назови это состояние своими словами, без санскрита и без лекции. Потом одна метафора из сегодняшней жизни: непрочитанный чат, севший телефон, закрытая вкладка, пробка, фильтр на фото, переполненная корзина, уведомление, которое нельзя смахнуть. Метафора объясняет ощущение, а не заменяет его. Затем свяжи это состояние с его запросом. question — один вопрос про то, где это состояние сейчас живёт в нём: в теле, в настроении, в привычке. Не допрос «кто, где, что сказал». Не два вопроса. Не повторяй готовый вопрос клетки дословно. deeper = false. Если сказано, где вопрос отразился ярче — тело, мысли или чувства — спроси на этом языке. Не объявляй этот способ.

Если kind = reply: ответь на его слова. Не делай ответ удобнее, чем он есть. Если видно избегание, самообман или перекладывание вины — скажи об этом как вопрос, не как приговор. Если ответ общий, deeper = true и попроси один конкретный факт. Если ответ уже честный и конкретный, deeper = false, question оставь пустым, speech коротко отражает услышанное.

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
    `игрок: ${data.player === "man" ? "мужчина" : "женщина"}`,
    `запрос: ${data.intention || "не назван"}`,
    `факты хода: ${data.facts}`,
    data.cell ? `клетка: ${data.cell}` : "",
    data.essence ? `суть клетки: ${data.essence}` : "",
    data.stockQuestion ? `готовый вопрос клетки, не повторяй его дословно: ${data.stockQuestion}` : "",
    data.tendency ? `уклон: ${data.tendency}` : "",
    data.portrait ? `внутренний рисунок, не зачитывай его:\n${data.portrait}` : "",
    data.brief ? `разбор уже собран до хода, опирайся на него и не пересказывай:\n${data.brief}` : "",
    data.earlier.length ? `уже сказано раньше:\n- ${data.earlier.join("\n- ")}` : "",
    data.echo ? `как человек видит мир, не зачитывай ярлык: ${data.echo}` : "",
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
