import { useEffect, useState } from "react";
import { omHeard, primeOm, setOmActive, subscribeOm } from "@/lib/leela/om";
import { useGame } from "@/lib/game-store";

export function SoundToggle() {
  const phase = useGame((state) => state.phase);
  const seenIntro = useGame((state) => state.seenIntro);
  const sound = useGame((state) => state.sound);
  const setSound = useGame((state) => state.setSound);
  const [heard, setHeard] = useState(false);

  useEffect(() => subscribeOm(() => setHeard(omHeard())), []);

  useEffect(() => {
    setOmActive(sound && seenIntro && phase !== "intro");
  }, [sound, phase, seenIntro]);

  if (phase === "intro" || !seenIntro) return null;

  const playing = sound && heard;
  const label = !sound ? "Звук выключен" : playing ? "Звук тихий" : "Тихий звук";

  return (
    <button
      type="button"
      aria-pressed={playing}
      onClick={() => {
        if (!playing) {
          setSound(true);
          primeOm();
          return;
        }
        setSound(false);
      }}
      className="fixed right-4 bottom-4 z-30 min-h-11 rounded-full border border-line bg-surface/80 px-4 text-sm text-muted backdrop-blur hover:border-gold-dim hover:text-fg"
    >
      {label}
    </button>
  );
}
