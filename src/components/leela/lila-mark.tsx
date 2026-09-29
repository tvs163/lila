import { useEffect, useRef } from "react";
import { LilaLogo } from "@/components/leela/shell";

type Dot = { x: number; y: number; seed: number; size: number };

function sprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const pen = canvas.getContext("2d");
  if (!pen) return canvas;
  const glow = pen.createRadialGradient(12, 12, 0, 12, 12, 12);
  glow.addColorStop(0, "rgba(255, 248, 230, 1)");
  glow.addColorStop(0.35, "rgba(226, 184, 98, 0.75)");
  glow.addColorStop(1, "rgba(226, 184, 98, 0)");
  pen.fillStyle = glow;
  pen.fillRect(0, 0, 24, 24);
  return canvas;
}

function wind(seed: number, time: number, width: number, height: number) {
  const u = (seed + time * 0.12) % 1;
  const x = (u * 1.35 - 0.18) * width + Math.sin(time * 1.4 + seed * 8) * width * 0.06;
  const y = height * (0.42 + Math.sin(u * Math.PI * 3.2 + time * 0.8 + seed * 4) * 0.34);
  return { x, y };
}

export function LilaMark({ play }: { play: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const playRef = useRef(play);
  playRef.current = play;
  const calm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (calm) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let dead = false;
    let frame = 0;
    const dust = sprite();

    const run = async () => {
      await document.fonts.load('italic 500 92px "Cormorant Garamond"');
      if (dead) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth || 320;
      const height = 140;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      const stamp = document.createElement("canvas");
      stamp.width = canvas.width;
      stamp.height = canvas.height;
      const pen = stamp.getContext("2d");
      if (!pen) return;
      pen.scale(dpr, dpr);
      pen.font = 'italic 500 92px "Cormorant Garamond"';
      pen.fillStyle = "#fff";
      pen.textBaseline = "middle";
      const letters = "LILA";
      const gap = width * 0.04;
      const widths = [...letters].map((letter) => pen.measureText(letter).width);
      const total = widths.reduce((sum, item) => sum + item, 0) + gap * (letters.length - 1);
      let cursor = (width - total) / 2;
      letters.split("").forEach((letter, index) => {
        pen.fillText(letter, cursor, height * 0.56);
        cursor += widths[index] + gap;
      });
      const pixels = pen.getImageData(0, 0, stamp.width, stamp.height).data;
      const dots: Dot[] = [];
      const step = 4;
      for (let y = 0; y < stamp.height; y += step) {
        for (let x = 0; x < stamp.width; x += step) {
          if (pixels[(y * stamp.width + x) * 4 + 3] < 100) continue;
          dots.push({ x: x / dpr, y: y / dpr, seed: Math.random(), size: 5 + Math.random() * 4 });
        }
      }
      let mode: "in" | "out" = "in";
      let from = performance.now();
      let seen = playRef.current;
      const paint = (now: number) => {
        if (dead) return;
        const nextPlay = playRef.current;
        if (seen !== nextPlay) {
          seen = nextPlay;
          mode = "out";
          from = now;
        }
        let t = Math.min(1, (now - from) / (mode === "out" ? 1100 : 1700));
        if (mode === "out" && t >= 1) {
          mode = "in";
          from = now;
          t = 0;
        }
        const ease = mode === "out" ? t * t : 1 - (1 - t) ** 3;
        const gather = mode === "out" ? 1 - ease : ease;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const time = now / 1000;
        for (const dot of dots) {
          const blown = wind(dot.seed, time, width, height);
          const x = blown.x + (dot.x - blown.x) * gather;
          const y = blown.y + (dot.y - blown.y) * gather;
          const spark = 0.45 + 0.55 * Math.abs(Math.sin(time * 2.2 + dot.seed * 12));
          ctx.globalAlpha = spark * (0.35 + gather * 0.65);
          ctx.drawImage(dust, x - dot.size / 2, y - dot.size / 2, dot.size, dot.size);
        }
        ctx.globalAlpha = 1;
        frame = window.requestAnimationFrame(paint);
      };
      frame = window.requestAnimationFrame(paint);
    };

    void run();
    return () => {
      dead = true;
      window.cancelAnimationFrame(frame);
    };
  }, [calm]);

  if (calm) return <LilaLogo large />;
  return <canvas ref={ref} className="h-36 w-full" role="img" aria-label="LILA" />;
}
