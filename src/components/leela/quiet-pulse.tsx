import { useEffect } from "react";
import { noteAccount } from "@/lib/leela/accounts";
import { accountId, markVisit, readSeconds, visitPending, writeSeconds } from "@/lib/leela/quiet-id";
import { useGame } from "@/lib/game-store";

let sending = false;

export function QuietPulse() {
  const nickname = useGame((state) => state.nickname);
  const moves = useGame((state) => state.log.length);
  const cell = useGame((state) => state.position);

  useEffect(() => {
    let seconds = readSeconds();
    let last = Date.now();

    const send = () => {
      if (sending) return;
      sending = true;
      const now = Date.now();
      if (document.visibilityState === "visible") {
        seconds += Math.min(60, Math.max(0, Math.round((now - last) / 1000)));
        writeSeconds(seconds);
      }
      last = now;
      const state = useGame.getState();
      const opening = visitPending();
      void noteAccount({
        data: {
          id: accountId(),
          nickname: state.nickname.slice(0, 40),
          visit: opening,
          moves: state.log.length,
          cell: state.position,
          seconds,
        },
      })
        .then(() => {
          if (opening) markVisit();
        })
        .catch(() => undefined)
        .finally(() => {
          sending = false;
        });
    };

    send();
    const timer = window.setInterval(send, 30000);
    return () => window.clearInterval(timer);
  }, [nickname, moves, cell]);

  return null;
}
