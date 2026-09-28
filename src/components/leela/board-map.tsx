import { useEffect, useState } from "react";
import { planeOf, squareById } from "@/lib/leela/board";
import { ARROWS, SNAKES, type RollOutcome } from "@/lib/leela/rules";
import { cn } from "@/lib/cn";
import { Gate } from "@/components/leela/shell";

const ROWS = Array.from({ length: 8 }, (_, fromTop) => {
  const plane = 7 - fromTop;
  const ids = Array.from({ length: 9 }, (_, col) => plane * 9 + col + 1);
  return plane % 2 === 0 ? ids : ids.reverse();
});

function travelPath(move: RollOutcome): number[] {
  if (move.kind === "unborn" || move.kind === "stay") return [];
  const path: number[] = [];
  if (move.landed) {
    const start = move.from <= 0 ? move.landed : move.from + 1;
    for (let id = start; id <= move.landed; id += 1) path.push(id);
  }
  if (move.to > 0 && path[path.length - 1] !== move.to) path.push(move.to);
  return path;
}

export function BoardMap({
  position,
  readingId,
  visited,
  move,
  onPick,
}: {
  position: number;
  readingId: number;
  visited: number[];
  move: (RollOutcome & { at: number }) | null;
  onPick: (id: number) => void;
}) {
  const seen = new Set(visited);
  const here = position > 0 ? position : readingId;
  const plane = planeOf(here > 0 ? here : 1);
  const [lit, setLit] = useState<number | null>(null);

  useEffect(() => {
    if (!move) return;
    const path = travelPath(move);
    if (path.length === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let step = 0;
    setLit(path[0] ?? null);
    const timer = window.setInterval(() => {
      step += 1;
      if (step >= path.length) {
        window.clearInterval(timer);
        setLit(null);
        return;
      }
      setLit(path[step] ?? null);
    }, 150);
    return () => window.clearInterval(timer);
  }, [move]);

  return (
    <section aria-label="Поле Лилы">
      <div className="panel relative overflow-hidden rounded-3xl border border-gold-dim/50 bg-bg-raise/75 p-3 sm:p-4">
        <Gate className="pointer-events-none absolute inset-x-4 top-0 h-32 text-gold opacity-30" />
        <div className="relative mb-3 text-center">
          <p className="text-sm tracking-widest text-gold uppercase">Поле</p>
          <h2 className="font-display text-3xl">План «{plane}»</h2>
          <p className="text-sm text-muted tabular-nums">
            {position > 0 ? `Клетка ${position} из 72` : "Ещё не рождён"}
          </p>
        </div>
        <div className="relative grid grid-cols-9 gap-1">
          {ROWS.map((row) =>
            row.map((id) => {
              const current = id === position;
              const memory = id === readingId && !current;
              const been = seen.has(id);
              const open = been || current;
              const arrow = Boolean(ARROWS[id]);
              const snake = Boolean(SNAKES[id]);
              const name = open ? squareById(id).name : "";
              const className = cn(
                "cell relative grid aspect-square place-items-center rounded-md border text-xs tabular-nums",
                "border-gold-dim/80 bg-bg text-gold",
                open && !current && "border-gold bg-surface text-fg",
                current && "cell-here border-gold bg-gold font-medium text-bg",
                lit === id && !current && "cell-travel",
                memory && "border-gold text-gold",
                id === 68 && !current && "cell-goal",
              );
              const marks = (
                <>
                  {id}
                  {arrow ? <span className="absolute top-0.5 right-0.5 size-1 rounded-full bg-gold" /> : null}
                  {snake ? <span className="absolute right-0.5 bottom-0.5 size-1 rounded-full bg-muted" /> : null}
                </>
              );
              if (!open) {
                return (
                  <div key={id} className={className} aria-hidden>
                    {marks}
                  </div>
                );
              }
              return (
                <button
                  key={id}
                  type="button"
                  className={className}
                  aria-current={current ? "location" : undefined}
                  aria-label={current ? `${id}, ${name}, вы здесь` : `${id}, ${name}`}
                  onClick={() => onPick(id)}
                >
                  {marks}
                </button>
              );
            }),
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Нажми клетку, где уже был, — откроется её вопрос. Золотая искра поднимает, тусклая возвращает. Цель — 68.
      </p>
    </section>
  );
}