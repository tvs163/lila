import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gate, LilaLogo } from "@/components/leela/shell";
import { primeOm } from "@/lib/leela/om";
import { useGame } from "@/lib/game-store";

export function Intro() {
  const begin = useGame((state) => state.begin);
  const guide = useGame((state) => state.guide);
  const [slide, setSlide] = useState(0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-y-auto px-5 py-10">
      <div className="my-auto flex flex-col gap-8">
      <header className="relative">
        <Gate className="pointer-events-none absolute -top-6 left-1/2 h-40 w-full -translate-x-1/2 text-gold opacity-40" />
        <div className="relative pt-8 text-center">
          <LilaLogo large />
          <p className="mt-4 text-sm tracking-widest text-gold uppercase">{slide === 0 ? "Перед началом" : "Как это устроено"}</p>
          {slide === 0 ? null : <h1 className="mt-2 font-display text-5xl">Ничего не нужно</h1>}
        </div>
      </header>

      {slide === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-fg">
            Лила — древняя игра самопознания. Её первое имя — Джняна-чаупада, «игра мудрости»: джняна — мудрость, чаупада — игра в кости.
          </p>
          <p className="text-muted">
            Она нужна, когда один внутренний вопрос не даёт покоя. Не чтобы получить чужой ответ, а чтобы вопрос дошёл до своей правды и стал фундаментом гармонии и умиротворения.
          </p>
          <div className="flex flex-col gap-3 text-muted">
            <p className="text-fg">Правила простые.</p>
            <p>Сначала дыхательная практика: прийти в состояние «сейчас».</p>
            <p>Потом один вопрос — о себе или о своём отношении к чему-то.</p>
            <p>Дальше бросаешь кость и говоришь с проводником. Он спрашивает туда, куда сам обычно не смотришь. Первые ощущения, мысли или чувства и есть путь к главному.</p>
          </div>
          <p className="text-muted">
            Отвечать вслух не нужно. Нужно честно заметить, где вопрос отразился ярче: в ощущениях тела, в мыслях или в эмоциях. Игра работает, только если оставаться в ней внимательно.
          </p>
          <p className="text-muted">
            Обычно это около часа. Можно закрыть и вернуться: поле помнит клетку. К концу видно, что в этом вопросе действительно твоё, где ты себе мешаешь и что уже можно сделать. Вопрос, который раньше истощал, начинает давать силу и уверенность.
          </p>
          <Button className="w-full" variant="glow" onClick={() => setSlide(1)}>
            Дальше
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-fg">Игра бесплатная. Аккаунт не нужен, платить не за что, настоящее имя можно не называть.</p>
          <p className="text-muted">Записи остаются на этом телефоне. От тебя ничего не требуется, кроме желания узнать себя.</p>
          <Button
            className="w-full"
            variant="glow"
            onClick={() => {
              primeOm();
              begin();
            }}
          >
            {guide ? "Продолжить путь" : "Войти в игру"}
          </Button>
        </div>
      )}
      </div>
    </main>
  );
}
