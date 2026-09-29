import { useGame } from "@/lib/game-store";
import { composeLetter } from "@/lib/leela/letter";
import { playerOf } from "@/lib/leela/listen";

let pending: Promise<boolean> | null = null;

export function ensureLetter() {
  const letter = useGame.getState().letter;
  if (letter?.temperament && letter.prism) return Promise.resolve(true);
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
  const birthData = {
    date: (birth.date || "").slice(0, 20),
    time: (birth.time || "").slice(0, 12),
    placeLabel: (birth.placeLabel || "").slice(0, 80),
    lat: Number(birth.lat) || 0,
    lon: Number(birth.lon) || 0,
    timeZone: (birth.timeZone || "UTC").slice(0, 64),
  };
  const cells = state.log
    .map((entry) => entry.to)
    .filter((id) => Number.isInteger(id) && id > 0 && id <= 72)
    .slice(-8);
  const notes = state.journal
    .slice(0, 2)
    .map((entry) => entry.text.trim().slice(0, 140))
    .filter((text) => text.length > 1);

  async function ask(part: "reading" | "steps", prior = "") {
    try {
      return await composeLetter({
        data: {
          guide: state.guide === "soma" ? "soma" : "agni",
          player: playerOf(state.gender, state.guide),
          nickname: state.nickname.trim().slice(0, 40),
          intention: intention.slice(0, 280),
          birth: birthData,
          cells,
          notes,
          seeing: seeing.slice(0, 180),
          part,
          prior: prior.slice(0, 500),
        },
      });
    } catch {
      return { ok: false as const, error: "Проводник сейчас молчит" };
    }
  }

  const first = await ask("reading");
  const reading = first.ok ? first : await ask("reading");
  if (!reading.ok || reading.part !== "reading") return false;
  const prior = `${reading.temperament} ${reading.prism}`.slice(0, 500);
  const second = await ask("steps", prior);
  const steps = second.ok ? second : await ask("steps", prior);
  if (!steps.ok || steps.part !== "steps") return false;
  useGame.getState().saveLetter({
    temperament: reading.temperament,
    prism: reading.prism,
    strength: steps.strength,
    shadow: steps.shadow,
    tools: steps.tools,
    heart: steps.heart,
  });
  return true;
}
