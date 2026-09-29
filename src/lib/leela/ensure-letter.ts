import { useGame } from "@/lib/game-store";
import { composeLetter } from "@/lib/leela/letter";
import { playerOf } from "@/lib/leela/listen";

let pending: Promise<boolean> | null = null;

export function ensureLetter() {
  const ready = useGame.getState().letter?.temperament;
  if (ready) return Promise.resolve(true);
  if (pending) return pending;
  pending = writeLetter().finally(() => {
    pending = null;
  });
  return pending;
}

async function writeLetter() {
  const state = useGame.getState();
  const birth = state.birth;
  const intention = state.intention.trim();
  if (!birth || intention.length < 4) return false;
  const names = { body: "ощущениях тела", thought: "мыслях", feeling: "эмоциях" } as const;
  const seeing = state.echoes.length
    ? `чаще в ${names[state.echoes[state.echoes.length - 1]]}; ответы: ${state.echoes
        .slice(-6)
        .map((item) => names[item])
        .join(", ")}`
    : "";
  try {
    const result = await composeLetter({
      data: {
        guide: state.guide === "soma" ? "soma" : "agni",
        player: playerOf(state.gender, state.guide),
        nickname: state.nickname.trim().slice(0, 40),
        intention: intention.slice(0, 280),
        birth: {
          date: (birth.date || "").slice(0, 20),
          time: (birth.time || "").slice(0, 12),
          placeLabel: (birth.placeLabel || "").slice(0, 80),
          lat: Number(birth.lat) || 0,
          lon: Number(birth.lon) || 0,
          timeZone: (birth.timeZone || "UTC").slice(0, 64),
        },
        cells: state.log
          .map((entry) => entry.to)
          .filter((id) => Number.isInteger(id) && id > 0 && id <= 72)
          .slice(-12),
        notes: state.journal
          .slice(0, 3)
          .map((entry) => entry.text.trim().slice(0, 180))
          .filter((text) => text.length > 1),
        seeing: seeing.slice(0, 220),
      },
    });
    if (!result.ok) return false;
    useGame.getState().saveLetter(result.letter);
    return true;
  } catch {
    return false;
  }
}
