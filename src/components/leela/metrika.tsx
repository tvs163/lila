import { useEffect } from "react";
import { useGame } from "@/lib/game-store";

const COUNTER = String(import.meta.env.VITE_METRIKA_ID ?? "113180218").replace(/\D/g, "");

type YmFn = {
  (...args: unknown[]): void;
  a?: unknown[][];
  l?: number;
};

function reach() {
  if (!COUNTER) return;
  const id = Number(COUNTER);
  const call = (window as unknown as { ym?: YmFn }).ym;
  if (!call) return;
  const state = useGame.getState();
  call(id, "params", {
    moves: state.log.length,
    cell: state.position,
    phase: state.phase,
  });
}

export function Metrika() {
  const moves = useGame((state) => state.log.length);
  const cell = useGame((state) => state.position);
  const phase = useGame((state) => state.phase);

  useEffect(() => {
    if (!COUNTER) return;
    const w = window as unknown as { ym?: YmFn };
    w.ym =
      w.ym ||
      function stub(...args: unknown[]) {
        (w.ym!.a = w.ym!.a || []).push(args);
      };
    w.ym.l = Date.now();
    const src = `https://mc.yandex.ru/metrika/tag.js?id=${COUNTER}`;
    if (![...document.scripts].some((script) => script.src === src)) {
      const tag = document.createElement("script");
      tag.async = true;
      tag.src = src;
      document.head.appendChild(tag);
    }
    w.ym(Number(COUNTER), "init", {
      ssr: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      referrer: document.referrer,
      url: location.href,
    });
    w.ym(Number(COUNTER), "hit", window.location.href);
    reach();
  }, []);

  useEffect(() => {
    reach();
  }, [moves, cell, phase]);

  return null;
}
