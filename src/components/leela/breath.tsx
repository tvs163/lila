import { useEffect, useRef, useState } from "react";

type MistParticle = {
  angle: number;
  orbit: number;
  size: number;
  alpha: number;
  speed: number;
  phase: number;
  drift: number;
  color: number;
  dot: boolean;
};

const MIST_COLORS: Array<[number, number, number]> = [
  [38, 62, 74],
  [42, 28, 86],
  [32, 48, 64],
  [268, 34, 76],
  [348, 26, 74],
  [43, 78, 68],
  [18, 18, 80],
  [200, 16, 82],
  [36, 14, 70],
  [50, 55, 78],
];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeParticles(): MistParticle[] {
  const rng = mulberry32(0x1e1a);
  const particles: MistParticle[] = [];
  for (let i = 0; i < 128; i += 1) {
    const dot = i < 96;
    const near = rng();
    particles.push({
      angle: rng() * Math.PI * 2,
      orbit: dot ? Math.pow(near, 0.55) : 0.08 + near * 0.55,
      size: dot ? 2.2 + rng() * 4.8 : 46 + rng() * 70,
      alpha: dot ? 0.45 + rng() * 0.55 : 0.22 + rng() * 0.28,
      speed: 0.4 + rng() * 1.1,
      phase: rng() * Math.PI * 2,
      drift: 0.015 + rng() * 0.055,
      color: Math.floor(rng() * MIST_COLORS.length),
      dot,
    });
  }
  return particles;
}

function BreathMist({ inhaling, still }: { inhaling: boolean; still: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inhalingRef = useRef(inhaling);
  const stillRef = useRef(still);
  inhalingRef.current = inhaling;
  stillRef.current = still;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = makeParticles();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprites = MIST_COLORS.map(([h, s, l]) => {
      const size = 160;
      const sprite = document.createElement("canvas");
      sprite.width = size;
      sprite.height = size;
      const g = sprite.getContext("2d");
      if (!g) return sprite;
      const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, `hsla(${h} ${s}% ${l}% / 0.85)`);
      grd.addColorStop(0.38, `hsla(${h} ${Math.round(s * 0.6)}% ${l}% / 0.28)`);
      grd.addColorStop(1, `hsla(${h} ${s}% ${l}% / 0)`);
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      return sprite;
    });

    let raf = 0;
    let breath = 0.4;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const target = stillRef.current ? 0.55 : inhalingRef.current ? 1 : 0.18;
      const tau = inhalingRef.current ? 1.05 : 1.6;
      breath = reduce ? 0.62 : breath + (target - breath) * (1 - Math.exp(-dt / tau));
      const t = reduce ? 0 : now / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * (0.28 + breath * 0.38));
      haze.addColorStop(0, `rgba(212, 176, 114, ${0.16 + breath * 0.22})`);
      haze.addColorStop(0.42, `rgba(150, 120, 170, ${0.06 + breath * 0.08})`);
      haze.addColorStop(1, "rgba(18, 16, 28, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);

      for (const particle of particles) {
        const sway = reduce ? 0 : Math.sin(t * particle.speed + particle.phase);
        const flutter = reduce ? 0 : Math.cos(t * particle.speed * 0.73 + particle.phase * 1.6);
        const spread = (0.28 + breath * 0.78) * particle.orbit;
        const x = cx + Math.cos(particle.angle + sway * 0.35) * spread * w * 0.52 + sway * particle.drift * w;
        const y = cy + Math.sin(particle.angle + flutter * 0.28) * spread * h * 0.5 + flutter * particle.drift * h;
        const twinkle = reduce ? 1 : 0.62 + 0.38 * sway;
        const alpha = Math.max(0, Math.min(1, particle.alpha * (0.5 + breath * 0.55) * twinkle));

        if (particle.dot) {
          const radius = particle.size * (0.75 + breath * 0.4);
          const [hue, sat, light] = MIST_COLORS[particle.color] ?? MIST_COLORS[0];
          ctx.fillStyle = `hsla(${hue} ${sat}% ${light}% / ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `hsla(${hue} ${Math.min(90, sat + 18)}% ${Math.min(92, light + 10)}% / ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.8, radius * 0.38), 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        const sprite = sprites[particle.color];
        if (!sprite) continue;
        const draw = particle.size * (0.85 + breath * 0.35);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, x - draw / 2, y - draw / 2, draw, draw);
        ctx.globalAlpha = 1;
      }

      if (!reduce) raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}

export function BreathRitual({
  cycles,
  kicker,
  title,
  body,
  note,
  inMs = 4000,
  outMs = 6000,
  onComplete,
}: {
  cycles: number;
  kicker: string;
  title: string;
  body: string;
  note?: string;
  inMs?: number;
  outMs?: number;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(4);
  const done = step >= cycles * 2;
  const inhaling = !done && step % 2 === 0;
  const shownCycle = Math.min(cycles, Math.floor(step / 2) + (done ? 0 : 1));
  const phaseMs = inhaling ? inMs : outMs;

  useEffect(() => {
    if (done) return;
    const total = Math.max(1, Math.round(phaseMs / 1000));
    setCount(total);
    const tick = window.setInterval(() => setCount((value) => (value > 1 ? value - 1 : 1)), 1000);
    const timer = window.setTimeout(() => setStep((value) => value + 1), phaseMs);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timer);
    };
  }, [done, phaseMs, step]);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(onComplete, 700);
    return () => window.clearTimeout(timer);
  }, [done, onComplete]);

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm tracking-widest text-gold uppercase">{kicker}</p>
      <h2 className="mt-3 max-w-md font-display text-4xl text-fg">{title}</h2>
      <p className="mt-4 max-w-md text-muted">{body}</p>
      <div className="relative mt-8 h-64 w-full max-w-md overflow-hidden sm:h-72">
        <BreathMist inhaling={inhaling} still={done} />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="font-display text-6xl text-gold tabular-nums [text-shadow:0_0_28px_rgba(18,16,28,0.95)]">
            {done ? "Тихо" : count}
          </span>
        </div>
      </div>
      <p className="mt-6 text-sm text-muted tabular-nums">
        {done ? "Можно идти дальше" : `${inhaling ? "Вдох" : "Выдох"} · ${shownCycle} из ${cycles}`}
      </p>
      <p className="mt-2 max-w-sm text-sm text-muted">{note ?? "Четыре счёта внутрь, шесть наружу."}</p>
    </div>
  );
}
