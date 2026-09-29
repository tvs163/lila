import { squareById } from "@/lib/leela/board";
import type { RollOutcome } from "@/lib/leela/rules";

export type Speech = {
  move: string;
  title: string;
  essence: string;
  link: string;
  questions: string[];
  wait: string;
};

const SHADOW: Array<{ test: RegExp; line: string }> = [
  {
    test: /всё (будет )?хорошо|все хорошо|проблем нет|я в порядке|меня это не касается/i,
    line: "В ответе много успокоения. Я не говорю, что это неправда. Что в запросе ты этим закрываешь?",
  },
  {
    test: /они виноват|из-за них|меня заставили|не моя ответственност|это не моё дело/i,
    line: "Ответственность в тексте легко уезжает к другим. Так может быть. Какая часть всё же твой ход?",
  },
  {
    test: /потом разбер|не сейчас|когда-нибудь|нет времени/i,
    line: "Откладывание бывает заботой, а бывает уходом. Что именно ты не хочешь увидеть в этом ходе?",
  },
];

function clip(text: string, max = 90): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export function mirrorReply(text: string): string | null {
  const clean = text.trim();
  const shrug = /^(не знаю|всё хорошо|все хорошо|всё нормально|все нормально|потом|неважно|ок|да|нет)[.!?\s]*$/i.test(
    clean,
  );
  if (shrug || clean.length < 40) {
    return "Ответ пока короткий. Я не делаю из этого вывод о тебе. Если смотреть глубже — назови один конкретный страх, цену или противоречие. Не общее «нормально».";
  }
  const hit = SHADOW.find((item) => item.test.test(clean));
  return hit ? hit.line : null;
}

export function conduct(outcome: RollOutcome, intention: string): Speech {
  const wish = clip(intention || "запрос ещё не назван");
  if (outcome.kind === "unborn") {
    return {
      move: `Выпало ${outcome.roll}. На поле входят только с шестёрки. Фишка остаётся за порогом.`,
      title: "",
      essence: "Рождение здесь не оценка старания. Вход просто не случился.",
      link: `К запросу «${wish}» эта кость ничего не прибавляет и не отнимает. Не читай в ней приговор.`,
      questions: [],
      wait: "Можно просить кость снова. Если и тогда порог закрыт, она перебросится сама, чтобы путь начался.",
    };
  }
  if (outcome.kind === "stay") {
    return {
      move: `Выпало ${outcome.roll}. С клетки ${outcome.from} шаг не сделан: число больше, чем остаток поля. Фишка остаётся на ${outcome.from}.`,
      title: "",
      essence: "На этой доске лишнее не переносится через край. До клетки 68 нужен точный ход.",
      link: `Рядом с «${wish}» это может быть жест шире задачи. Я не утверждаю, что так и есть — только если узнаёшь себя.`,
      questions: [
        "Какой более точный шаг ты обходишь, пока берёшь сразу большой?",
        "Что в запросе просит меньшего числа, чем ты сейчас бросаешь?",
      ],
      wait: "Вопрос можно оставить при себе. Кость не ждёт записи.",
    };
  }

  const dest = squareById(outcome.to);
  const fromName = outcome.from > 0 ? squareById(outcome.from).name : "порога";
  let move = `Выпало ${outcome.roll}. С «${fromName}» фишка приходит на клетку ${dest.id}.`;
  if (outcome.via && outcome.landed && outcome.landed !== dest.id) {
    const touched = squareById(outcome.landed);
    move =
      outcome.via === "arrow"
        ? `Выпало ${outcome.roll}. Фишка ступает на ${touched.id}, «${touched.name}». Стрела этой клетки сама поднимает на ${dest.id}. Отдельный бросок для переноса не нужен.`
        : `Выпало ${outcome.roll}. Фишка ступает на ${touched.id}, «${touched.name}». Змея этой клетки сама опускает на ${dest.id}: урок ещё живой. Отдельный бросок для спуска не нужен.`;
  }
  if (outcome.from <= 0 && outcome.kind === "birth") {
    move = `Выпало ${outcome.roll}. Фишка встаёт на клетку ${dest.id}.`;
    if (outcome.via && outcome.landed && outcome.landed !== dest.id) {
      move +=
        outcome.via === "arrow"
          ? " Стрела этой клетки поднимает дальше без второго броска."
          : " Змея этой клетки опускает дальше без второго броска.";
    }
  }

  const questions = [dest.question];

  return {
    move,
    title: `${dest.id}. ${dest.name} — ${dest.sanskrit}`,
    essence: dest.essence,
    link: `Я не решаю «${wish}». Клетка показывает, каким состоянием запрос сейчас окрашен — не что тебе делать.`,
    questions,
    wait:
      outcome.kind === "win"
        ? "Клетка 68, Вайкунтха. По правилам этого поля партия закончена. Новый бросок не нужен."
        : "Это вопрос, не задание. Отвечать вслух не нужно. Если захочешь, оставь заметку себе.",
  };
}
