import { conduct } from "@/lib/leela/conductor";
import { useGame } from "@/lib/game-store";

export function ConductorTurn({ at }: { at?: number }) {
  const intention = useGame((state) => state.intention);
  const log = useGame((state) => state.log);
  const voices = useGame((state) => state.voices);
  const listeningAt = useGame((state) => state.listeningAt);
  const latest = (at ? log.find((entry) => entry.at === at) : undefined) ?? log[log.length - 1];

  if (!latest) return null;
  const speech = conduct(latest, intention);
  const heard = voices.find((item) => item.at === latest.at);
  const question = heard?.arrive?.question || speech.questions[0] || "";
  const next = heard?.arrive?.next || speech.questions[1] || "";
  const listening = listeningAt === latest.at && !heard?.arrive;

  return (
    <div className="text-left">
      <p className="mt-2">{speech.move}</p>
      {speech.title ? <h3 className="mt-3 font-display text-2xl">{speech.title}</h3> : null}
      {speech.essence ? <p className="mt-2">{speech.essence}</p> : null}
      {heard?.arrive?.speech ? <p className="mt-3 text-fg">{heard.arrive.speech}</p> : speech.link ? <p className="mt-3 text-muted">{speech.link}</p> : null}
      {listening ? <p className="mt-3 text-sm text-gold">Проводник собирает вопрос к этой клетке…</p> : null}
      {speech.wait ? <p className="mt-3 text-sm text-muted">{speech.wait}</p> : null}
      {question ? (
        <div className="question-core mt-5 rounded-3xl border border-gold bg-bg-raise px-5 py-5">
          <p className="text-sm tracking-widest text-gold uppercase">Вопрос проводника</p>
          <p className="mt-3 font-display text-3xl leading-snug text-fg">{question}</p>
          {next ? (
            <>
              <p className="mt-5 text-sm tracking-widest text-gold uppercase">Следующая ступень</p>
              <p className="mt-3 font-display text-2xl leading-snug text-fg">{next}</p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
