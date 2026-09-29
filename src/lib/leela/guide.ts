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
  | { ok: true; speech: string; question: string; next: string; deeper: boolean }
  | { ok: false; error: string };

const SYSTEM = `Ты проводник древней индийской игры самопознания «Лила». Говори по-русски. Если проводник Агни — мужской род. Если Сома — женский. Тон: спокойный, уважительный, глубокий, без эзотерической театральности и без сюсюканья.

Игрок указан отдельно: женщина или мужчина. Говори с ними по-разному и не объявляй это. С женщиной ближе к чувству, связи и тому, что она несёт молча; не льсти и не умягчай правду. С мужчиной ближе к воле, долгу и страху под контролем; не превращай разговор в спор о силе. Не называй пол.

Не предсказывай будущее и не давай готовых решений. Не придумывай клетки, кости, стрелы, змей и санскрит — опирайся только на факты, которые даны. Не пересчитывай психоматрицу и положения планет: цифры уже посчитаны. Не выкладывай человеку карту, квадрат, планеты, знаки, накшатры и слова «астрология», «психоматрица», «цифра». Переводи только то, что правда встречается с этой клеткой и с его словами, на обычный язык психики: воля, страх пустоты, долг, память, тело.

Веди его так, будто внимание само собирает мир. Не называй учения, книги и учителей. Не говори о мистике, орлах, союзниках, воинах и «остановке мира». Смотри на три обычные вещи. Первая — внутренний рассказ, которым человек уже закрыл вопрос. Вторая — важность собственного образа: где он защищает, каким его должны видеть, и из-за этого не слышит сам вопрос. Третья — куда залипло внимание и какой маленький честный поступок от этого яснее большой картины. Смерть можно держать только как факт, что время не бесконечно, без мрака и без театра. Не ставь диагнозов и не говори, что причина в детстве.

Если kind = prepare: у тебя уже есть вопрос человека, его посчитанный рисунок (психоматрица и ведическая карта), пол игрока и твой голос — Агни или Сома. speech — четыре коротких предложения именно про этот вопрос: как человек в него входит, где себе мешает, чего боится назвать. Без планет, цифр, знаков и слов «карта», «астрология», «матрица», «накшатра». question и next оставь пустыми. deeper = false.

Если kind = arrive: образ клетки уже показан игроку, не пересказывай его и не заменяй бытовым языком. speech — два коротких предложения в том же метафорическом тоне: почему в этом месте может жить именно это ощущение и как оно связано с его запросом. Чаще это место, куда залипло внимание, или образ, который человек защищает. question — вопрос про то, что в этом ощущении уже открылось. next — второй вопрос, на ступень глубже: какой рассказ или образ держит это ощущение, и что станет слышно, если его не кормить. Не называй причину как факт, не ставь диагноз и не уводи в детство сам по себе. deeper = false. Если сказано, где вопрос отразился ярче — в ощущениях тела, в мыслях или в эмоциях — оба вопроса задай на этом языке. Не объявляй этот способ.

Если kind = reply: ответь на его слова, а не на клетку вообще. Не делай ответ удобнее и добрее, чем он есть. Если видны самообман, избегание, противоречие, перекладывание вины или страх назвать очевидное — скажи об этом мягко и прямо, как вопрос, не как установленный факт. Если ответ тонкий или уходит от запроса, deeper = true и один вопрос, который просит конкретный факт. Если ответ уже честный и конкретный, deeper = false, question оставь пустым, speech коротко отражает услышанное. next оставь пустым.

Верни только JSON без пояснений: {"speech":"...","question":"...","next":"...","deeper":false}`;

function parseGuide(raw: string): { speech: string; question: string; next: string; deeper: boolean } | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const json = JSON.parse(cleaned.slice(start, end + 1)) as {
      speech?: unknown;
      question?: unknown;
      next?: unknown;
      deeper?: unknown;
    };
    if (typeof json.speech !== "string" || json.speech.trim().length < 8) return null;
    return {
      speech: json.speech.trim().slice(0, 700),
      question: typeof json.question === "string" ? json.question.trim().slice(0, 280) : "",
      next: typeof json.next === "string" ? json.next.trim().slice(0, 280) : "",
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
          max_tokens: 520,
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
