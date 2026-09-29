import { useEffect, useRef } from "react";

type Grain = {
  t: number;
  speed: number;
  lane: number;
  size: number;
  alpha: number;
};

function makeSprite() {
  const sprite = document.createElement("canvas");
  sprite.width = 32;
  sprite.height = 32;
  const pen = sprite.getContext("2d");
  if (!pen) return sprite;
  const glow = pen.createRadialGradient(16, 16, 0, 16, 16, 16);
  glow.addColorStop(0, "rgba(255, 244, 214, 1)");
  glow.addColorStop(0.3, "rgba(226, 184, 98, 0.55)");
  glow.addColorStop(1, "rgba(226, 184, 98, 0)");
  pen.fillStyle = glow;
  pen.fillRect(0, 0, 32, 32);
  return sprite;
}

export function LilaMark({ play }: { play: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const gust = useRef(0);

  useEffect(() => {
    gust.current = performance.now();
  }, [play]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sprite = makeSprite();
    const grains: Grain[] = [];
    for (let lane = 0; lane < 5; lane += 1) {
      for (let i = 0; i < 70; i += 1) {
        grains.push({
          t: Math.random(),
          speed: 0.00007 + Math.random() * 0.00006,
          lane,
          size: 10 + Math.random() * 22,
          alpha: 0.18 + Math.random() * 0.45,
        });
      }
    }
    let frame = 0;
    let last = performance.now();
    const paint = (now: number) => {
      const width = canvas.clientWidth || 320;
      const height = canvas.clientHeight || 640;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.floor(width * dpr);
      const nextH = Math.floor(height * dpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const gustLeft = Math.max(0, 1 - (now - gust.current) / 1600);
      const wind = 1 + gustLeft * 1.8;
      const dt = Math.min(32, now - last);
      last = now;
      for (const grain of grains) {
        grain.t = (grain.t + grain.speed * wind * dt) % 1;
        const u = grain.t;
        const wave = Math.sin(u * Math.PI * 2.2 + grain.lane * 1.15 + now * 0.00018);
        const curl = Math.sin(u * Math.PI * 6 - now * 0.00012 + grain.lane * 0.7);
        const x = (u * 1.25 - 0.12) * width + curl * 18;
        const y = height * (0.08 + grain.lane * 0.18) + wave * height * 0.11;
        ctx.globalAlpha = grain.alpha * (0.7 + gustLeft * 0.3);
        ctx.drawImage(sprite, x - grain.size / 2, y - grain.size / 2, grain.size, grain.size);
      }
      ctx.globalAlpha = 1;
      frame = window.requestAnimationFrame(paint);
    };
    frame = window.requestAnimationFrame(paint);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-20 h-dvh w-full" aria-hidden />;
}
