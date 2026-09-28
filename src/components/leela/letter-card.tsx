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
  const saveLetter = useGame((state) => state.saveLetter);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function gather() {
    if (!birth || intention.trim().length < 4 || busy) return;
    setBusy(true);
    setError("");
    const cells = log.map((entry) => entry.to).filter((id) => id > 0).slice(-24);
    const notes = journal.slice(0, 4).map((entry) => entry.text);
    try {
      const result = await composeLetter({
        data: {
          guide: guide === "soma" ? "soma" : "agni",
          player: playerOf(gender, guide),
          nickname: nickname.slice(0, 40),
          intention,
          birth,
          cells,
          notes,
        },
      });
      if (!result.ok) {
        setError("Письмо не собралось. Можно попросить ещё раз.");
        return;
      }
      saveLetter(result.letter);
    } catch {
      setError("Письмо не собралось. Можно попросить ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function save(current: PathLetter) {
    setError("");
    try {
      await downloadLetter(current, nickname, intention);
    } catch {
      setError("Файл не открылся. Текст письма остаётся здесь.");
    }
  }

  if (!letter) {
    return (
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-display text-2xl">Письмо в конце пути</h3>
        <p className="mt-2 text-sm text-muted">Склад, на что опираться, где себе мешаешь, и четыре инструмента под твой вопрос. Файл можно забрать себе.</p>
        <Button className="mt-4 w-full" variant="glow" disabled={busy} onClick={() => void gather()}>
          {busy ? "Проводник собирает письмо…" : "Собрать письмо"}
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
        <h4 className="text-sm tracking-widest text-gold uppercase">На что опираться</h4>
        <p className="mt-2">{letter.strength}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Где себе мешаешь</h4>
        <p className="mt-2">{letter.shadow}</p>
      </section>
      <section>
        <h4 className="text-sm tracking-widest text-gold uppercase">Чем пользоваться</h4>
        <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
          {letter.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ol>
      </section>
      <Button className="w-full" variant="glow" onClick={() => void save(letter)}>
        Скачать PDF
      </Button>
      {error ? <p className="text-sm text-gold">{error}</p> : null}
    </div>
  );
}
