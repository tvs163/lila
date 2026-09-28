import { useCallback, useEffect } from "react";
import { Arrival } from "@/components/leela/arrival";
import { Birth } from "@/components/leela/birth";
import { BreathRitual } from "@/components/leela/breath";
import { Intention } from "@/components/leela/intention";
import { Intro } from "@/components/leela/intro";
import { Play } from "@/components/leela/play";
import { QuietPulse } from "@/components/leela/quiet-pulse";
import { Shell } from "@/components/leela/shell";
import { ensureBrief } from "@/lib/leela/prepare";
import { useGame } from "@/lib/game-store";

export function LilaApp() {
  const phase = useGame((state) => state.phase);
  const seenIntro = useGame((state) => state.seenIntro);
  const birth = useGame((state) => state.birth);
  const intention = useGame((state) => state.intention);
  const finishBreath = useGame((state) => state.finishBreath);

  useEffect(() => {
    const state = useGame.getState();
    if (state.phase !== "arrival" && state.phase !== "intro" && !state.guide) useGame.setState({ phase: "arrival" });
    if ((state.phase === "play" || state.phase === "intention" || state.phase === "breath") && !state.birth) {
      useGame.setState({ phase: state.guide ? "birth" : "arrival" });
    }
  }, []);

  useEffect(() => {
    if (birth && intention.trim().length >= 4) ensureBrief();
  }, [birth, intention]);

  const onBreath = useCallback(() => finishBreath(), [finishBreath]);

  return (
    <Shell>
      <QuietPulse />
      {phase === "intro" || !seenIntro ? <Intro /> : null}
      {phase === "arrival" && seenIntro ? <Arrival /> : null}
      {phase === "birth" && seenIntro ? <Birth /> : null}
      {phase === "breath" && seenIntro ? (
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-12">
          <BreathRitual
            cycles={2}
            inMs={4000}
            outMs={4000}
            kicker="Пранаяма"
            title="Сама-вритти"
            body="Ровное дыхание из индийской науки о дыхании — пранаямы. В традиции хатха-йоги вдох и выдох делают одной длины, чтобы ум не убегал раньше тела. Два круга по четыре счёта выравнивают пульс и возвращают внимание внутрь. Тогда первый ход слышишь ты, а не спешка. Пока тело дышит, проводник уже читает дату и место."
            note="Четыре счёта внутрь, четыре наружу. Всего два круга."
            onComplete={onBreath}
          />
        </div>
      ) : null}
      {phase === "intention" && seenIntro ? <Intention /> : null}
      {phase === "play" && seenIntro ? <Play /> : null}
    </Shell>
  );
}
