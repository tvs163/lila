import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadLetter } from "@/lib/leela/letter-pdf";
import { ensureLetter } from "@/lib/leela/ensure-letter";
import type { PathLetter } from "@/lib/leela/letter";
import { useGame } from "@/lib/game-store";

export function LetterKeeper() {
  const letter = useGame((state) => state.letter);
  const moves = useGame((state) => state.log.filter((entry) => entry.kind !== "unborn").length);
  useEffect(() => {
    if (moves < 5 || (letter?.temperament && letter.prism)) return;
    void ensureLetter();
  }, [moves, letter]);
  return null;
}

export function LetterCard() {
  const nickname = useGame((state) => state.nickname);
  const birth = useGame((state) => state.birth);
  const intention = useGame((state) => state.intention);
  const log = useGame((state) => state.log);
  const letter = useGame((state) => state.letter);
  const ready = Boolean(letter?.temperament && letter.prism && letter.strength && letter.shadow && letter.heart && letter.tools?.length);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function gather() {
    if (!birth || intention.trim().length < 4 || busy) return;
    setBusy(true);
    setError("");
    try {
      const ok = await ensureLetter();
      const current = useGame.getState().letter;
      if (!ok || !current?.temperament || !current.prism) {
        setError("Письмо ещё не собралось. Нажми ещё раз через несколько секунд.");
        return;
      }
      try {
        await downloadLetter(current, nickname, intention, early);
      } catch {
        setError("Письмо собрано. Если файл не открылся, нажми «Скачать PDF».");
      }
    } catch {
      setError("Письмо ещё не собралось. Нажми ещё раз через несколько секунд.");
    } finally {
      setBusy(false);
    }
  }

  const early = log.filter((entry) => entry.kind !== "unborn").length < 20;

  async function save(current: PathLetter) {
    setError("");
    try {
      await downloadLetter(current, nickname, intention, early);
    } catch {
      setError("Файл не открылся. Текст письма остаётся здесь.");
    }
  }

  if (!open) {
    return (
      <div className="mt-6 border-t border-line pt-5">
        <Button className="w-full" variant="quiet" onClick={() => setOpen(true)}>
          Письмо о тебе
        </Button>
      </div>
    );
  }

  if (!ready || !letter) {
    return (
      <div className="mt-6 border-t border-line pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl">Письмо о тебе</h3>
          <Button variant="quiet" onClick={() => setOpen(false)}>
            Свернуть
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Под твой вопрос: темперамент, сильная и слабая сторона и четыре шага к гармонии.
        </p>
        <LetterFine early={early} />
        <Button className="mt-3 w-full" variant="glow" disabled={busy} onClick={() => void gather()}>
          {busy ? "Письмо пишется…" : "Собрать и скачать"}
        </Button>
        {error ? <p className="mt-2 text-sm text-gold">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 text-left">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl">Письмо проводника</h3>
        <Button variant="quiet" onClick={() => setOpen(false)}>
          Свернуть
        </Button>
      </div>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Твой вопрос</h4>
        <p className="mt-2">{intention}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Внутренний уклад</h4>
        <p className="mt-2">{letter.temperament}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Как ты видишь этот вопрос</h4>
        <p className="mt-2">{letter.prism}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Сильная сторона темперамента</h4>
        <p className="mt-2">{letter.strength}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Слабая сторона темперамента</h4>
        <p className="mt-2">{letter.shadow}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Что делать</h4>
        <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
          {letter.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ol>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Опора</h4>
        <p className="mt-2">{letter.heart}</p>
      </section>
      <LetterFine early={early} />
      <Button className="w-full" variant="glow" onClick={() => void save(letter)}>
        Скачать PDF
      </Button>
      {error ? <p className="text-sm text-gold">{error}</p> : null}
    </div>
  );
}

function LetterFine({ early }: { early: boolean }) {
  return (
    <div className="mt-3 flex flex-col gap-1 text-[11px] leading-snug text-muted">
      {early ? <p>Чем больше игры пройдено, тем точнее форма личности в файле.</p> : null}
      <p>* Заключение не является рекомендациями. Игра носит развлекательный характер.</p>
    </div>
  );
}
