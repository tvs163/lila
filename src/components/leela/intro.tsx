import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Gate, LilaLogo } from "@/components/leela/shell";
import { primeOm } from "@/lib/leela/om";
import { useGame } from "@/lib/game-store";

const DUST = [8, 22, 37, 51, 66, 78, 14, 44, 61, 86, 29, 72];

const ABOUT = [
  "Лила — древняя игра самопознания. Её первое имя — Джняна-чаупада, «игра мудрости»: джняна — мудрость, чаупада — игра в кости.",
  "Она нужна, когда один внутренний вопрос не даёт покоя. Не чтобы получить чужой ответ, а чтобы вопрос дошёл до своей правды и стал фундаментом гармонии и умиротворения.",
  "Ею пользовались там, где было время смотреть на себя честно. В Индии поле хранили семьи знатоков и учителей. В XX веке философ Хариш Джохари передал его как практику наблюдения за внутренними состояниями. Детская «змейка» — только упрощённый след этой игры.",
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

function Ink({ children, at }: { children: ReactNode; at: number }) {
  return (
    <div className="ink" style={{ animationDelay: `${Math.min(at, 8) * 0.14}s` }}>
      {children}
    </div>
  );
}

export function Intro() {
  const begin = useGame((state) => state.begin);
  const guide = useGame((state) => state.guide);
  const [slide, setSlide] = useState(0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-y-auto px-5 py-10 pb-24">
      <div className="my-auto flex flex-col gap-8">
        <header className="relative">
          <Gate className="pointer-events-none absolute -top-6 left-1/2 h-40 w-full -translate-x-1/2 text-gold opacity-40" />
          <div className="relative pt-8 text-center">
            <LilaLogo large />
            <p className="ink mt-4 text-sm tracking-widest text-gold uppercase" style={{ animationDelay: "0.05s" }}>
              {slide === 0 ? "Об игре" : "Как играть и что от тебя нужно"}
            </p>
          </div>
        </header>

        <div key={slide} className="ink-sheet relative flex flex-col gap-4">
          {DUST.map((left, index) => (
            <span
              key={`${slide}-${left}`}
              className="ink-mote"
              style={{ left: `${left}%`, animationDelay: `${(index % 6) * 0.18}s` }}
              aria-hidden
            />
          ))}

          {slide === 0 ? (
            ABOUT.map((line, index) => (
              <Ink key={line} at={index + 1}>
                <p className={index === 0 ? "text-fg" : "text-muted"}>{line}</p>
              </Ink>
            ))
          ) : (
            <>
              <Ink at={1}>
                <p className="text-fg">
                  Игра может занять до 60 минут. Её можно закрыть и вернуться. Лучше играть в уединенном состоянии наедине с собой.
                </p>
              </Ink>
              <Ink at={2}>
                <p className="text-gold">Итак, как будет проходить игра:</p>
              </Ink>
              <ol className="flex flex-col gap-3">
                {STEPS.map((step, index) => (
                  <Ink key={step} at={index + 3}>
                    {index === 5 ? <p className="mb-3 text-fg">Самая важная часть игры:</p> : null}
                    <li className="flex gap-3 text-muted">
                      <span className="mt-0.5 w-5 shrink-0 text-gold tabular-nums">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  </Ink>
                ))}
              </ol>
            </>
          )}

          <Ink at={slide === 0 ? 6 : 12}>
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
        </div>
      </div>
    </main>
  );
}
