import { useEffect, useRef, useState } from "react";
import type { RollOutcome } from "@/lib/leela/rules";

const FACE: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: -90 },
  6: { x: 0, y: 180 },
};

const FACES: Array<{ n: number; transform: string }> = [
  { n: 1, transform: "rotateY(0deg) translateZ(44px)" },
  { n: 6, transform: "rotateY(180deg) translateZ(44px)" },
  { n: 5, transform: "rotateY(90deg) translateZ(44px)" },
  { n: 2, transform: "rotateY(-90deg) translateZ(44px)" },
  { n: 3, transform: "rotateX(90deg) translateZ(44px)" },
  { n: 4, transform: "rotateX(-90deg) translateZ(44px)" },
];

export function DiceThrow({
  outcome,
  onDone,
}: {
  outcome: RollOutcome;
  onDone: () => void;
}) {
  const face = FACE[outcome.roll] ?? FACE[1];
  const [pose, setPose] = useState({ x: face.x + 840, y: face.y + 1020 });
  const [settled, setSettled] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 280 : 1800;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const ease = 1 - (1 - p) ** 3;
      const left = 1 - ease;
      setPose({
        x: face.x + left * 840,
        y: face.y + left * 1020,
      });
      if (p > 0.78) setSettled(true);
      if (p < 1) frame = requestAnimationFrame(tick);
      else done.current();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [face.x, face.y, outcome.roll]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/75 px-6 backdrop-blur-sm" role="dialog" aria-label="Бросок кости">
      <div className="relative grid place-items-center">
        <div className="dice-orbit pointer-events-none absolute size-64 rounded-full border border-gold/30" aria-hidden />
        <div className="dice-orbit pointer-events-none absolute size-80 rounded-full border border-violet/30" style={{ animationDuration: "18s" }} aria-hidden />
        <span className="star pointer-events-none absolute top-6 left-10" aria-hidden />
        <span className="star pointer-events-none absolute right-6 bottom-10" aria-hidden />
        <div className="relative size-28" style={{ perspective: "760px" }} aria-hidden>
          <div
            className="absolute inset-3"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${pose.x + 30}deg) rotateY(${pose.y - 50}deg) translateZ(-36px) scale(0.72)`,
              opacity: 0.55,
            }}
          >
            {FACES.map((item) => (
              <span key={`ghost-${item.n}`} className="dice-face text-3xl text-gold" style={{ transform: item.transform }}>
                ◇
              </span>
            ))}
          </div>
          <div
            className="absolute inset-3"
            style={{ transformStyle: "preserve-3d", transform: `rotateX(${pose.x}deg) rotateY(${pose.y}deg)` }}
          >
            {FACES.map((item) => (
              <span key={item.n} className="dice-face" style={{ transform: item.transform }}>
                {item.n}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-8 text-center font-display text-6xl text-gold tabular-nums">{settled ? outcome.roll : "·"}</p>
        <p className="mt-2 text-center text-sm text-muted">Кость брошена</p>
      </div>
    </div>
  );
}
