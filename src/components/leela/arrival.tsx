import { useState, type FormEvent, type ReactNode } from "react";
import { Button, fieldClass } from "@/components/ui/button";
import { Gate, LilaLogo } from "@/components/leela/shell";
import type { Gender } from "@/lib/game-store";
import { useGame } from "@/lib/game-store";

const NAME = /^[\p{L}][\p{L}\s'’-]{1,23}$/u;

export function Arrival() {
  const setArrival = useGame((state) => state.setArrival);
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const name = nickname.trim().replace(/\s+/g, " ");
    if (!NAME.test(name)) {
      setError("Имя — от двух букв, без цифр.");
      return;
    }
    if (gender !== "woman" && gender !== "man") {
      setError("Выбери, кто играет.");
      return;
    }
    setArrival(name, gender, gender === "woman" ? "agni" : "soma");
  }

  return (
    <form onSubmit={submit} className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-8 px-5 py-12">
      <header className="relative">
        <Gate className="pointer-events-none absolute -top-8 left-1/2 h-44 w-full -translate-x-1/2 text-gold opacity-45" />
        <div className="relative pt-10 text-center">
          <LilaLogo large />
          <p className="mt-4 text-sm tracking-widest text-gold uppercase">Игра самопознания</p>
        </div>
      </header>

      <label className="block">
        <span className="mb-2 block text-sm text-muted">Как к тебе обращаться</span>
        <input
          className={fieldClass}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={24}
          autoComplete="nickname"
          placeholder="Имя или прозвище"
        />
      </label>

      <fieldset>
        <legend className="mb-3 text-sm text-muted">Кто играет</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice pressed={gender === "woman"} onClick={() => setGender("woman")}>
            Я женщина
          </Choice>
          <Choice pressed={gender === "man"} onClick={() => setGender("man")}>
            Я мужчина
          </Choice>
        </div>
      </fieldset>

      {error ? <p className="text-sm text-gold">{error}</p> : null}
      <Button type="submit">Дальше</Button>
    </form>
  );
}

function Choice({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-12 rounded-2xl border px-4 py-3 text-left transition-colors duration-200 ${
        pressed ? "border-gold bg-surface text-fg" : "border-line bg-bg-raise text-fg hover:border-gold-dim"
      }`}
    >
      {children}
    </button>
  );
}
