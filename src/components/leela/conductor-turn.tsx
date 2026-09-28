import { conduct } from "@/lib/leela/conductor";
import { useGame } from "@/lib/game-store";

export function ConductorTurn({ at }: { at?: number }) {
  const intention = useGame((state) => state.intention);
  const guide = useGame((state) => state.guide);
  const log = useGame((state) => state.log);
  const voices = useGame((state) => state.voices);
  const listeningAt = useGame((state) => state.listeningAt);
  const latest = (at ? log.find((entry) => entry.at === at) : undefined) ?? log[log.length - 1];

  if (!latest) return null;
  const speech = conduct(latest, intention);
  const heard = voices.find((item) => item.at === latest.at);
  const guideName = guide === "soma" ? "Сома" : "Агни";
  const question = heard?.arrive?.question || speech.questions[0] || "";
  const listening = listeningAt === latest.at && !heard?.arrive;

  return (
    <div className="text-left">
      <p className="text-sm tracking-widest text-gold uppercase">{guideName}</p>
      <p className="mt-2">{speech.move}</p>
      {speech.title ? <h3 className="mt-3 font-display text-2xl">{speech.title}</h3> : null}
      {speech.essence ? <p className="mt-2">{speech.essence}</p> : null}
      {heard?.arrive?.speech ? <p className="mt-3 text-fg">{heard.arrive.speech}</p> : speech.link ? <p className="mt-3 text-muted">{speech.link}</p> : null}
      {listening ? <p className="mt-3 text-sm text-gold">Проводник собирает вопрос к этой клетке…</p> : null}
      {question ? (
        <>
          <h4 className="mt-4 text-sm tracking-widest text-gold uppercase">Вопрос</h4>
          <p className="mt-2">{question}</p>
        </>
      ) : null}
      <p className="mt-3 text-sm text-muted">{speech.wait}</p>
    </div>
  );
}
