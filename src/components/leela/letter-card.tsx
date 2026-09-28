import { useState } from "react";
import { Button } from "@/components/ui/button";
import { composeLetter, type PathLetter } from "@/lib/leela/letter";
import { downloadLetter } from "@/lib/leela/letter-pdf";
import { playerOf } from "@/lib/leela/listen";
import { useGame } from "@/lib/game-store";

export function LetterCard() {
  const nickname = useGame((state) => state.nickname);
  const gender = useGame((state) => state.gender);
  const guide = useGame((state) => state.guide);
  const birth = useGame((state) => state.birth);
  const intention = useGame((state) => state.intention);
  const log = useGame((state) => state.log);
  const journal = useGame((state) => state.journal);
  const letter = useGame((state) => state.letter);
  const ready = Boolean(letter?.fold && letter.emotions && letter.heart && letter.tools?.length);
  const saveLetter = useGame((state) => state.saveLetter);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function gather() {
    if (!birth || intention.trim().length < 4 || busy) return;
    setBusy(true);
    setError("");
    const cells = log
      .map((entry) => entry.to)
      .filter((id) => Number.isInteger(id) && id > 0 && id <= 72)
      .slice(-12);
    const notes = journal
      .slice(0, 3)
      .map((entry) => entry.text.trim().slice(0, 180))
      .filter((text) => text.length > 1);
    try {
      const result = await composeLetter({
        data: {
          guide: guide === "soma" ? "soma" : "agni",
          player: playerOf(gender, guide),
          nickname: nickname.trim().slice(0, 40),
          intention: intention.trim().slice(0, 280),
          birth: {
            date: (birth.date || "").slice(0, 20),
            time: (birth.time || "").slice(0, 12),
            placeLabel: (birth.placeLabel || "").slice(0, 80),
            lat: Number(birth.lat) || 0,
            lon: Number(birth.lon) || 0,
            timeZone: (birth.timeZone || "UTC").slice(0, 64),
          },
          cells,
          notes,
        },
      });
      if (!result.ok) {
        setError("Письмо не собралось. Можно попросить ещё раз.");
        return;
      }
      saveLetter(result.letter);
      try {
        await downloadLetter(result.letter, nickname, intention, early);
      } catch {
        setError("Письмо собрано. Если файл не открылся, нажми «Скачать PDF».");
      }
    } catch {
      setError("Письмо не собралось. Можно попросить ещё раз.");
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

  if (!ready || !letter) {
    return (
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-display text-2xl">Письмо о тебе</h3>
        <p className="mt-2 text-sm text-muted">
          Под твой вопрос: какой ты, где сила и где слабина, как быть с чувствами, какие практики помогут и чем себя напомнить. Файл можно скачать.
        </p>
        <LetterFine early={early} />
        <Button className="mt-3 w-full" variant="glow" disabled={busy} onClick={() => void gather()}>
          {busy ? "Проводник собирает письмо…" : "Собрать и скачать"}
        </Button>
        {error ? <p className="mt-2 text-sm text-gold">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 text-left">
      <h3 className="font-display text-2xl">Письмо проводника</h3>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Какой ты в этом вопросе</h4>
        <p className="mt-2">{letter.fold}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Сильная сторона</h4>
        <p className="mt-2">{letter.strength}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Слабая сторона</h4>
        <p className="mt-2">{letter.shadow}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Как работать с эмоциями</h4>
        <p className="mt-2">{letter.emotions}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Практики</h4>
        <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
          {letter.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ol>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">У тебя уже есть</h4>
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
