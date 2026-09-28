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
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-8 px-5 py-12">
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
            Ты приносишь один вопрос, который уже не отпускает. Проводник сначала узнаёт тебя — по дате, времени, месту рождения и по самому вопросу. Карту он не показывает.
          </p>
          <p className="text-muted">
            Дальше открывается клетка: состояние, в котором этот вопрос сейчас живёт. Проводник говорит, как оно связано именно с тобой, и задаёт один вопрос. Отвечать не нужно. Заметку оставишь, только если захочешь.
          </p>
          <p className="text-muted">
            Обычно путь занимает около часа. Бывает полчаса, бывает ближе к двум — кость каждый раз своя. Можно закрыть и вернуться: поле помнит клетку. В конце проводник оставит письмо: какой ты в этом вопросе и чем на него опираться.
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
    </main>
  );
}
