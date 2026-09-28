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
      }, 350);
    }, HOLD_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(fade);
    };
  }, [shown]);

  if (!shown || typeof document === "undefined") return null;
  const line = LINES[index] ?? LINES[0];

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-bg/55 backdrop-blur-[2px]" />
      <article
        className={`relative w-full max-w-md rounded-3xl border border-gold-dim bg-surface/80 p-6 backdrop-blur-md transition-opacity duration-300 ${clear ? "opacity-100" : "opacity-0"}`}
        role="status"
      >
        <p className="text-sm tracking-widest text-gold uppercase">Пока проводник собирает</p>
        <p className="mt-4 font-display text-3xl leading-snug text-fg">{line.text}</p>
        <p className="mt-5 text-sm text-muted">
          {line.who}
          <span className="text-gold"> · </span>
          {line.when}
        </p>
      </article>
    </div>,
    document.body,
  );
}
