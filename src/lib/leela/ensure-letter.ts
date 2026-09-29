import { useGame } from "@/lib/game-store";
import { localLetter } from "@/lib/leela/local-letter";
import { letterSeed } from "@/lib/vedic/portrait";

export function ensureLetter() {
  const state = useGame.getState();
  if (state.letter?.temperament && state.letter.prism) return Promise.resolve(true);
  const birth = state.birth;
  const intention = state.intention.trim();
  if (!birth || intention.length < 4) return Promise.resolve(false);
  const channel = state.echoes[state.echoes.length - 1] ?? "";
  const letter = localLetter(intention, letterSeed(birth), channel);
  if (!letter) return Promise.resolve(false);
  useGame.getState().saveLetter(letter);
  return Promise.resolve(true);
}