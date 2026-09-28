import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const LINES = [
  {
    text: "Мы чаще мучаемся тем, что ещё не случилось, чем тем, что уже есть.",
    who: "Сенека",
    when: "Рим, I век",
  },
  {
    text: "Тревожит не само событие, а история, которую ты о нём себе рассказываешь.",
    who: "Эпиктет",
    when: "Греция, I–II век",
  },
  {
    text: "Внешнее тебе не подвластно. Подвластно только то, как ты это встречаешь.",
    who: "Марк Аврелий",
    when: "Рим, II век",
  },
  {
    text: "Ответ той же силой не кончает напряжение. Оно стихает, когда его перестают кормить.",
    who: "Дхаммапада",
    when: "Индия, около III века до н. э.",
  },
  {
    text: "Какой мыслью ты живёшь день за днём, таким и становится твой день.",
    who: "Упанишады",
    when: "Индия, примерно VIII–VI век до н. э.",
  },
  {
    text: "Тебе принадлежит сам шаг. Чем он кончится — шагу уже не принадлежит.",
    who: "Бхагавад-гита",
    when: "Индия, традиция вед, около II века до н. э.",
  },
  {
    text: "На сегодня хватает сегодняшнего. Завтра придёт со своим.",
    who: "Иисус",
    when: "Иудея, I век",
  },
] as const;

const HOLD_MS = 6500;

export function WisdomFloat({ open }: { open: boolean }) {
  const [index, setIndex] = useState(0);
  const [clear, setClear] = useState(true);
  const [hold, setHold] = useState(false);
  const since = useRef(0);

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
    let fade = 0;
    const timer = window.setInterval(() => {
      setClear(false);
      fade = window.setTimeout(() => {
        setIndex((value) => (value + 1) % LINES.length);
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
      <div className="wisdom-veil absolute inset-0 backdrop-blur-[1px]" />
      <p className="wisdom-note absolute inset-x-6 top-[12%] text-center font-display text-2xl leading-snug text-fg/90 sm:text-3xl">
        Пока проводник думает — позволь показать тебе мои любимые мудрости
      </p>
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <article
          className={`wisdom-card relative w-full max-w-md px-2 py-8 text-center ${clear ? "smoke-in" : "smoke-out"}`}
          role="status"
        >
          <span className="wisdom-wisp top-2 left-6 h-16 w-24" />
          <span className="wisdom-wisp top-10 right-4 h-20 w-28 [animation-delay:-2s]" />
          <span className="wisdom-wisp bottom-0 left-1/3 h-14 w-32 [animation-delay:-4s]" />
          <p className="relative font-display text-3xl leading-snug text-fg">{line.text}</p>
          <p className="relative mt-6 text-sm text-muted">
            {line.who}
            <span className="text-gold"> · </span>
            {line.when}
          </p>
        </article>
      </div>
    </div>,
    document.body,
  );
}
