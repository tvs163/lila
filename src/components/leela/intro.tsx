import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Gate, LilaLogo } from "@/components/leela/shell";
import { primeOm } from "@/lib/leela/om";
import { useGame } from "@/lib/game-store";

const ABOUT = [
  "Лила — древняя игра самопознания. Её первое имя — Джняна-чаупада, «игра мудрости»: джняна — мудрость, чаупада — игра в кости.",
  "Она нужна, когда один внутренний вопрос не даёт покоя. Не чтобы получить чужой ответ, а чтобы вопрос дошёл до своей правды и стал фундаментом гармонии и умиротворения.",
  "В психологии Лила работает как зеркало, не как диагноз. Клетка показывает, в каком состоянии сейчас живёт твой вопрос: гнев, иллюзия, страх пустоты, желание казаться сильнее. Это тот же приём, которым пользуются в глубинной беседе и в работе с собой: не советовать, а дать увидеть свой ход. Поэтому к ней возвращаются люди, которым мало общих советов. Им нужна ясность о собственном вопросе.",
];

const STEPS = [
  "Введи дату и время рождения, проводник будет учитывать персонализированную натальную карту.",
  "Игра начинается с древней дыхательной практики, для объединения тела, разума и состояния.",
  "Пишешь один вопрос о себе или о своём отношении к чему-то. Сконцентрируйся на том, чтобы правильно его сформулировать.",
  "Перед тобой появляется поле с клетками состояний — тебе нужно бросать кубик.",
  "Проводник думает и отвечает тебе, рассказывая, что означает выпавшая клетка.",
  "Проводник задает вопрос, он абстрактный но очень глубокий. Поразмышляй над ответом в глубине себя, а лучше запиши.",
  "Перед следующим броском отмечаешь, где вопрос отразился ярче: в теле, в мыслях или в эмоциях. Пока не отметишь, ход закрыт.",
  "Так ход за ходом пока не дойдешь до конца. Пройдя игру, ты откроешь внутри себя точки опоры и гармонии. Это механика самопознания, которой тысячи лет.",
];

function readMs(text: string) {
  const count = text.trim().split(/\s+/).filter(Boolean).length;
  if (count < 6) return 1500;
  return Math.min(9000, Math.max(2400, (count / 3.6) * 1000));
}

function Ink({ children }: { children: ReactNode }) {
  return <div className="ink">{children}</div>;
}

export function Intro() {
  const begin = useGame((state) => state.begin);
  const guide = useGame((state) => state.guide);
  const [slide, setSlide] = useState(0);
  const [shown, setShown] = useState(0);

  const blocks =
    slide === 0
      ? ABOUT
      : [
          "Игра может занять до 60 минут. Её можно закрыть и вернуться. Лучше играть в уединенном состоянии наедине с собой.",
          "Итак, как будет проходить игра:",
          ...STEPS.slice(0, 5),
          "Самая важная часть игры:",
          ...STEPS.slice(5),
        ];

  useEffect(() => {
    setShown(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(blocks.length + 1);
      return;
    }
    let index = 0;
    let timer = 0;
    const next = () => {
      index += 1;
      setShown(index);
      if (index > blocks.length) return;
      timer = window.setTimeout(next, readMs(blocks[index - 1] ?? ""));
    };
    timer = window.setTimeout(next, 700);
    return () => window.clearTimeout(timer);
  }, [slide]);

  const visible = blocks.slice(0, shown);
  const ready = shown > blocks.length;

  return (
    <main className="relative z-10 mx-auto -mt-14 flex min-h-dvh w-full max-w-lg flex-col overflow-y-auto px-5 pt-2 pb-24">
      <div className="flex flex-col gap-6">
        <header className="relative">
          <Gate className="pointer-events-none absolute -top-6 left-1/2 h-40 w-full -translate-x-1/2 text-gold opacity-40" />
          <div className="relative pt-1 text-center">
            <LilaLogo large />
            <p className="mt-4 text-sm tracking-widest text-gold uppercase">
              {slide === 0 ? "Об игре" : "Как играть и что от тебя нужно"}
            </p>
          </div>
        </header>

        <div key={slide} className="relative flex flex-col gap-4">
          {slide === 0
            ? visible.map((line, index) => (
                <Ink key={line}>
                  <p className={index === 0 ? "text-fg" : "text-muted"}>{line}</p>
                </Ink>
              ))
            : visible.map((line) => {
                const step = STEPS.indexOf(line);
                if (step >= 0) {
                  return (
                    <Ink key={line}>
                      <li className="flex list-none gap-3 text-muted">
                        <span className="mt-0.5 w-5 shrink-0 text-gold tabular-nums">{step + 1}.</span>
                        <span>{line}</span>
                      </li>
                    </Ink>
                  );
                }
                return (
                  <Ink key={line}>
                    <p className={line.startsWith("Итак") || line.startsWith("Самая") ? "text-gold" : "text-fg"}>{line}</p>
                  </Ink>
                );
              })}

          {ready ? (
            <Ink>
              {slide === 0 ? (
                <Button className="mt-2 w-full" variant="glow" onClick={() => setSlide(1)}>
                  Дальше
                </Button>
              ) : (
                <Button
                  className="mt-2 w-full"
                  variant="glow"
                  onClick={() => {
                    primeOm();
                    begin();
                  }}
                >
                  {guide ? "Продолжить путь" : "Войти в игру"}
                </Button>
              )}
            </Ink>
          ) : null}
        </div>
      </div>
    </main>
  );
}
