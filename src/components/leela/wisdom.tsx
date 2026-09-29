import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GuideId } from "@/lib/game-store";

const LINES = [
  { text: "Мы чаще мучаемся тем, что ещё не случилось, чем тем, что уже есть.", who: "Сенека", when: "Рим, I век" },
  { text: "Тревожит не само событие, а история, которую ты о нём себе рассказываешь.", who: "Эпиктет", when: "Греция, I–II век" },
  { text: "Внешнее тебе не подвластно. Подвластно только то, как ты это встречаешь.", who: "Марк Аврелий", when: "Рим, II век" },
  { text: "Ответ той же силой не кончает напряжение. Оно стихает, когда его перестают кормить.", who: "Дхаммапада", when: "Индия, около III века до н. э." },
  { text: "Какой мыслью ты живёшь день за днём, таким и становится твой день.", who: "Упанишады", when: "Индия, примерно VIII–VI век до н. э." },
  { text: "Тебе принадлежит сам шаг. Чем он кончится — шагу уже не принадлежит.", who: "Бхагавад-гита", when: "Индия, традиция вед, около II века до н. э." },
  { text: "На сегодня хватает сегодняшнего. Завтра придёт со своим.", who: "Иисус", when: "Иудея, I век" },
  { text: "Сначала реши, каким человеком ты остаёшься. Потом не делай того, что этому противоречит.", who: "Марк Аврелий", when: "Рим, II век" },
  { text: "В руке всегда только одно: как ты это встречаешь. Остальное можно отпустить.", who: "Эпиктет", when: "Греция, I–II век" },
  { text: "Богат не тот, у кого много, а тот, кому хватает того, что есть.", who: "Сенека", when: "Рим, I век" },
  { text: "Гнев длится ровно столько, сколько ты согласен его кормить.", who: "Сенека", when: "Рим, I век" },
  { text: "Не требуй, чтобы день шёл по-твоему. Встреть его таким, какой он есть.", who: "Эпиктет", when: "Греция, I–II век" },
  { text: "Этот час ещё не обещает вечер. Поэтому проживи его целиком.", who: "Марк Аврелий", when: "Рим, II век" },
  { text: "Чужая спешка не обязана становиться твоей.", who: "Сенека", when: "Рим, I век" },
  { text: "Ты страдаешь не от того, что потерял, а от того, что считал это навсегда своим.", who: "Эпиктет", when: "Греция, I–II век" },
  { text: "Спокойствие — это не пустота. Это место, где мысль перестаёт командовать.", who: "Марк Аврелий", when: "Рим, II век" },
  { text: "Боль приходит сама. Страдание начинается, когда её не отпускают.", who: "традиция Будды", when: "Индия, около V века до н. э." },
  { text: "То, чем ты кормишь внимание, тем и становится ум.", who: "Дхаммапада", when: "Индия, около III века до н. э." },
  { text: "Ненависть не кончается ненавистью. Она кончается, когда её видят.", who: "Дхаммапада", when: "Индия, около III века до н. э." },
  { text: "Будь опорой себе. Не ищи её там, где она каждый раз уходит.", who: "традиция Будды", when: "Индия, около V века до н. э." },
  { text: "Почёсывание раны не лечит её. Замечание — уже начало.", who: "традиция Будды", when: "Индия, около V века до н. э." },
  { text: "Речь, которая ранит, потом ранит и того, кто её сказал.", who: "Дхаммапада", when: "Индия, около III века до н. э." },
  { text: "Тишина не пустая. В ней слышно, чего ты на самом деле хочешь.", who: "традиция Будды", when: "Индия, около V века до н. э." },
  { text: "Не гонись за всем, что блеснуло. Блеск не равен направлению.", who: "Дхаммапада", when: "Индия, около III века до н. э." },
  { text: "То, что смотрит на мысли, само мыслью не является.", who: "Упанишады", when: "Индия, примерно VIII–VI век до н. э." },
  { text: "Делай то, что перед тобой. Исход не обязан лежать в той же руке.", who: "Бхагавад-гита", when: "Индия, традиция вед" },
  { text: "Покой не в том, чтобы ничего не хотеть. Покой в том, чтобы видеть желание и не идти у него следом.", who: "Бхагавад-гита", when: "Индия, традиция вед" },
  { text: "Малое, сделанное ровно, больше большого, сделанного в спешке.", who: "Бхагавад-гита", when: "Индия, традиция вед" },
  { text: "Ты не то, что с тобой случается. Ты то, что остаётся, когда это увидели.", who: "Упанишады", when: "Индия, примерно VIII–VI век до н. э." },
  { text: "Ум спокоен не тогда, когда замолчал мир, а когда ты перестал с ним спорить.", who: "Упанишады", when: "Индия, примерно VIII–VI век до н. э." },
  { text: "Своё дело делай без торга с результатом. Так в деле появляется ясность.", who: "Бхагавад-гита", when: "Индия, традиция вед" },
  { text: "Кто знает, что внутри него уже есть огонь, не бегает за каждым чужим светом.", who: "Упанишады", when: "Индия, примерно VIII–VI век до н. э." },
  { text: "Где твоё внимание, там и ты.", who: "Евангелие", when: "Иудея, I век" },
  { text: "Сначала увидь своё. Тогда чужое станет яснее и не таким громким.", who: "Иисус", when: "Иудея, I век" },
  { text: "Простить — значит перестать носить чужой поступок у себя внутри.", who: "традиция Евангелия", when: "Иудея, I век" },
  { text: "Кто ищет, уже в пути. Путь начинается не с готового ответа.", who: "Иисус", when: "Иудея, I век" },
  { text: "Тихий голос слышнее крика, если рядом замолчать.", who: "традиция Евангелия", when: "Иудея, I век" },
  { text: "Не копи то, что нельзя унести внутрь. Внутри помещается только живое.", who: "Иисус", when: "Иудея, I век" },
  { text: "Мир с другим начинается с того, что ты перестаёшь воевать с собой.", who: "традиция Евангелия", when: "Иудея, I век" },
  { text: "Просьба о хлебе на сегодня не отменяет заботу. Она возвращает тебя в этот день.", who: "Иисус", when: "Иудея, I век" },
  { text: "Свет не спорит с темнотой. Он просто есть, и этого довольно.", who: "Евангелие", when: "Иудея, I век" },
  { text: "То, что ты носишь в сердце, рано или поздно становится твоим шагом.", who: "традиция Евангелия", when: "Иудея, I век" },
] as const;

const HOLD_MS = 6500;

function mix(list: number[]) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap] ?? current;
    next[swap] = current;
  }
  return next;
}

function deck() {
  const ids = LINES.map((_, index) => index);
  const first = mix(ids);
  const second = mix(ids);
  if (second[0] === first[first.length - 1] && second.length > 1) {
    const head = second[0];
    second[0] = second[1] ?? head;
    second[1] = head;
  }
  return [...first, ...second];
}

export function WisdomFloat({ open, guide }: { open: boolean; guide: GuideId | null }) {
  const [index, setIndex] = useState(0);
  const [clear, setClear] = useState(true);
  const [hold, setHold] = useState(false);
  const since = useRef(0);
  const queue = useRef<number[] | null>(null);
  const cursor = useRef(-1);

  useEffect(() => {
    if (open) {
      if (!since.current) since.current = Date.now();
      setHold(true);
      return;
    }
    if (!since.current) {
      setHold(false);
      return;
    }
    const left = Math.max(0, HOLD_MS - (Date.now() - since.current));
    const timer = window.setTimeout(() => {
      setHold(false);
      since.current = 0;
    }, left);
    return () => window.clearTimeout(timer);
  }, [open]);

  const shown = open || hold;

  useEffect(() => {
    if (!shown) return;
    if (!queue.current) queue.current = deck();
    if (cursor.current < 0) {
      cursor.current = 0;
      setIndex(queue.current[0] ?? 0);
    }
    let fade = 0;
    const timer = window.setInterval(() => {
      const list = queue.current;
      if (!list || cursor.current >= list.length - 1) return;
      setClear(false);
      fade = window.setTimeout(() => {
        cursor.current += 1;
        setIndex(list[cursor.current] ?? 0);
        setClear(true);
      }, 700);
    }, HOLD_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(fade);
    };
  }, [shown]);

  if (!shown || typeof document === "undefined") return null;
  const line = LINES[index] ?? LINES[0];

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div className="wisdom-veil absolute inset-0" />
      <p className="wisdom-note absolute inset-x-6 top-[9%] text-center font-display text-2xl leading-snug text-fg/90 sm:text-3xl">
        Пока проводник думает — позволь показать тебе мои любимые мудрости
      </p>
      <div className="absolute inset-x-5 top-[24%] bottom-40 flex items-center justify-center">
        <article
          className={`wisdom-card relative w-full max-w-md px-6 py-8 text-center ${clear ? "smoke-in" : "smoke-out"}`}
          role="status"
        >
          <span className="wisdom-wisp top-3 left-5 h-14 w-20" />
          <span className="wisdom-wisp top-8 right-4 h-16 w-24 [animation-delay:-2s]" />
          <p className="relative font-display text-3xl leading-snug text-fg">{line.text}</p>
          <p className="relative mt-6 text-sm text-muted">
            {line.who}
            <span className="text-gold"> · </span>
            {line.when}
          </p>
        </article>
      </div>
      <ThinkingGuide guide={guide === "agni" ? "agni" : "soma"} />
    </div>,
    document.body,
  );
}

function ThinkingGuide({ guide }: { guide: GuideId }) {
  const soma = guide === "soma";
  return (
    <div className={`guide-think ${soma ? "guide-soma" : "guide-agni"}`} aria-hidden>
      <span className="guide-mote guide-mote-a" />
      <span className="guide-mote guide-mote-b" />
      <span className="guide-mote guide-mote-c" />
      <span className="guide-head" />
      <span className="guide-body" />
    </div>
  );
}
