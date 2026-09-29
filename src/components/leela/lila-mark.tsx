import { useEffect, useRef } from "react";

type Dot = { x: number; y: number; sx: number; sy: number };

export function LilaMark({ play }: { play: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const calm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (calm) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let dead = false;
    let frame = 0;

    const drawWord = async () => {
      await document.fonts.load('italic 500 92px "Cormorant Garamond"');
      if (dead) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth || 320;
      const height = 128;
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
      const gap = width * 0.035;
      const widths = [...letters].map((letter) => pen.measureText(letter).width);
      const total = widths.reduce((sum, item) => sum + item, 0) + gap * (letters.length - 1);
      let cursor = (width - total) / 2;
      letters.split("").forEach((letter, index) => {
        pen.fillText(letter, cursor, height * 0.56);
        cursor += widths[index] + gap;
      });
      const pixels = pen.getImageData(0, 0, stamp.width, stamp.height).data;
      const dots: Dot[] = [];
      const step = 3;
      for (let y = 0; y < stamp.height; y += step) {
        for (let x = 0; x < stamp.width; x += step) {
          if (pixels[(y * stamp.width + x) * 4 + 3] < 90) continue;
          const along = dots.length * 0.017;
          dots.push({
            x,
            y,
            sx: (0.08 + (along % 1) * 0.84) * stamp.width,
            sy: stamp.height * (0.5 + Math.sin(along * 5.2) * 0.34),
          });
        }
      }
      const started = performance.now();
      const paint = (now: number) => {
        if (dead) return;
        const t = Math.min(1, (now - started) / 1700);
        const ease = 1 - (1 - t) ** 3;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < dots.length; i += 1) {
          const dot = dots[i];
          const x = dot.sx + (dot.x - dot.sx) * ease;
          const y = dot.sy + (dot.y - dot.sy) * ease;
          const spark = 0.35 + 0.65 * Math.abs(Math.sin(now / 380 + i * 0.37));
          ctx.fillStyle = i % 11 === 0 ? `rgba(255, 250, 236, ${spark})` : `rgba(232, 196, 122, ${spark})`;
          ctx.fillRect(x, y, dpr * 1.7, dpr * 1.7);
        }
        frame = window.requestAnimationFrame(paint);
      };
      frame = window.requestAnimationFrame(paint);
    };

    void drawWord();
    return () => {
      dead = true;
      window.cancelAnimationFrame(frame);
    };
  }, [play, calm]);

  if (calm) {
    return (
      <p className="lila-logo lila-logo-lg">
        <span className="lila-word">LILA</span>
      </p>
    );
  }

  return <canvas ref={ref} className="h-32 w-full" role="img" aria-label="LILA" />;
}
