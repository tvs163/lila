import { useGame, type BirthProfile } from "@/lib/game-store";
import { listenPrepare } from "@/lib/leela/listen";

let inflight = "";

export function briefKeyOf(birth: BirthProfile, intention: string) {
  return `${birth.date}|${birth.time}|${birth.lat.toFixed(3)}|${birth.lon.toFixed(3)}|${intention.trim()}`;
}

export function ensureBrief() {
  const state = useGame.getState();
  const birth = state.birth;
  const intention = state.intention.trim();
  if (!birth || intention.length < 4) return;
  const key = briefKeyOf(birth, intention);
  if (state.briefKey === key && state.innerBrief) return;
  if (state.briefKey === key && state.briefStatus === "quiet") return;
  if (inflight === key) return;
  inflight = key;
  if (state.briefKey !== key) {
    useGame.setState({ innerBrief: "", briefKey: "", briefStatus: "reading" });
  } else {
    state.setBriefStatus("reading");
  }
  void listenPrepare(birth, state.guide, intention).then((result) => {
    if (inflight === key) inflight = "";
    const current = useGame.getState();
    if (!current.birth || briefKeyOf(current.birth, current.intention) !== key) return;
    current.saveBrief(key, result.ok ? result.speech : "");
  });
}
