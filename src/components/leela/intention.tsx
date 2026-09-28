import { useState, type FormEvent } from "react";
import { Button, fieldClass } from "@/components/ui/button";
import { LilaLogo } from "@/components/leela/shell";
import { useGame } from "@/lib/game-store";

export function Intention() {
  const guide = useGame((state) => state.guide);
  const nickname = useGame((state) => state.nickname);
  const setIntention = useGame((state) => state.setIntention);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const glad = guide === "soma" ? "Я рада, что ты не спешишь." : "Я рад, что ты не спешишь.";

  function submit(event: FormEvent) {
    event.preventDefault();
    const intention = text.trim().replace(/\s+/g, " ");
    if (intention.length < 4) {
      setError("Нужен вопрос, хотя бы в несколько слов.");
      return;
    }
    setIntention(intention);
  }

  return (
    <form onSubmit={submit} className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-5 py-12">
      <header>
        <LilaLogo />
        <h1 className="mt-4 font-display text-5xl">{nickname}, с чем ты входишь</h1>
        <p className="mt-4 text-muted">
          {glad} Не план на год, а вопрос, который уже не отпускает. Он уйдёт проводнику вместе с твоим рисунком — до первого хода.
        </p>
      </header>
      <label className="block">
        <span className="mb-2 block text-sm text-muted">Намерение</span>
        <textarea
          className={`${fieldClass} min-h-32 py-3`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={280}
          placeholder="Например: почему я снова откладываю своё"
        />
      </label>
      {error ? <p className="text-sm text-gold">{error}</p> : null}
      <Button type="submit">Войти на поле</Button>
    </form>
  );
}
