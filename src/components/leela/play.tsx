import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, Hourglass, Menu } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { BoardMap } from "@/components/leela/board-map";
import { BreathRitual } from "@/components/leela/breath";
import { ConductorTurn } from "@/components/leela/conductor-turn";
import { LetterCard, LetterKeeper } from "@/components/leela/letter-card";
import { DiceThrow } from "@/components/leela/dice";
import { LilaLogo } from "@/components/leela/shell";
import { WisdomFloat } from "@/components/leela/wisdom";
import { Button, fieldClass } from "@/components/ui/button";
import { squareById } from "@/lib/leela/board";
import { listenArrive } from "@/lib/leela/listen";
import { briefKeyOf } from "@/lib/leela/prepare";
import { BREATH_FRESH_MS, HOUR_MS, canRollNow, type RollOutcome } from "@/lib/leela/rules";
import { useGame } from "@/lib/game-store";

export function Play() {
  const nickname = useGame((state) => state.nickname);
  const guide = useGame((state) => state.guide);
  const gender = useGame((state) => state.gender);
  const birth = useGame((state) => state.birth);
  const intention = useGame((state) => state.intention);
  const position = useGame((state) => state.position);
  const readingId = useGame((state) => state.readingId);
  const visited = useGame((state) => state.visited);
  const lastTurnAt = useGame((state) => state.lastTurnAt);
  const extraLeft = useGame((state) => state.extraLeft);
  const lastBreathAt = useGame((state) => state.lastBreathAt);
  const log = useGame((state) => state.log);
  const won = useGame((state) => state.won);
  const letterOpen = won || log.filter((entry) => entry.kind !== "unborn").length >= 3;
  const journal = useGame((state) => state.journal);
  const innerBrief = useGame((state) => state.innerBrief);
  const briefKey = useGame((state) => state.briefKey);
  const briefStatus = useGame((state) => state.briefStatus);
  const listeningAt = useGame((state) => state.listeningAt);
  const planThrow = useGame((state) => state.planThrow);
  const commitThrow = useGame((state) => state.commitThrow);
  const markBreath = useGame((state) => state.markBreath);
  const saveVoice = useGame((state) => state.saveVoice);
  const setListening = useGame((state) => state.setListening);
  const setReading = useGame((state) => state.setReading);
  const addJournal = useGame((state) => state.addJournal);
  const newPath = useGame((state) => state.newPath);
  const editBirth = useGame((state) => state.editBirth);
  const forget = useGame((state) => state.forget);

  const [now, setNow] = useState(() => Date.now());
  const [breathOpen, setBreathOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [rollError, setRollError] = useState("");
  const [spin, setSpin] = useState<RollOutcome | null>(null);
  const [pane, setPane] = useState<"field" | "word" | "note">("field");
  const [turnAt, setTurnAt] = useState<number | null>(null);
  const throwing = useRef(false);
  const spinRef = useRef<RollOutcome | null>(null);
  const openedBrief = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setDraft("");
    setNoteSaved(false);
  }, [readingId]);

  const square = readingId > 0 ? squareById(readingId) : null;
  const latest = log[log.length - 1];
  const markAt = useGame((state) => state.markAt);
  const needsEcho = Boolean(latest) && !won && markAt !== latest.at;
  const wantedKey = birth && intention.trim().length >= 4 ? briefKeyOf(birth, intention) : "";
  const briefReady = Boolean(wantedKey) && briefKey === wantedKey && (Boolean(innerBrief) || briefStatus === "quiet");
  const briefPending = Boolean(wantedKey) && !briefReady;
  const ready = canRollNow(lastTurnAt, true, won, now) && !spin && !briefPending;
  const waitMs = lastTurnAt == null ? 0 : Math.max(0, HOUR_MS - (now - lastTurnAt));
  const breathFresh = lastBreathAt != null && now - lastBreathAt < BREATH_FRESH_MS;
  const skipBreath = extraLeft > 0 || breathFresh;
  const shown = log.find((entry) => entry.at === turnAt) ?? latest;
  const shownIndex = shown ? log.findIndex((entry) => entry.at === shown.at) : -1;

  useEffect(() => {
    if (!latest) return;
    setTurnAt(latest.at);
    setPane("word");
  }, [latest?.at]);

  useEffect(() => {
    if (!latest && innerBrief && !openedBrief.current) {
      openedBrief.current = true;
      setPane("word");
    }
  }, [innerBrief, latest]);

  const launch = useCallback(() => {
    if (throwing.current) return;
    throwing.current = true;
    try {
      const outcome = planThrow();
      spinRef.current = outcome;
      setSpin(outcome);
      setRollError("");
    } catch (error) {
      setRollError(error instanceof Error ? error.message : "Бросок не вышел");
      throwing.current = false;
    }
  }, [planThrow]);

  const onBreathDone = useCallback(() => {
    markBreath();
    setBreathOpen(false);
    launch();
  }, [launch, markBreath]);

  const finishSpin = useCallback(() => {
    const current = spinRef.current;
    if (!current) return;
    spinRef.current = null;
    const snap = useGame.getState();
    const names = { body: "ощущениях тела", thought: "мыслях", feeling: "эмоциях" } as const;
    const recent = snap.echoes;
    const last = recent[recent.length - 1];
    const earlier = recent.slice(0, -1).slice(-4);
    const echo = last
      ? `сейчас ярче в ${names[last]}${earlier.length ? `; до этого в ${earlier.map((item) => names[item]).join(", ")}` : ""}`
      : "";
    const at = commitThrow(current);
    setSpin(null);
    throwing.current = false;
    setListening(at);
    void listenArrive({ guide, gender, intention, journal, birth, outcome: current, brief: snap.innerBrief, echo }).then((result) => {
      if (result.ok) saveVoice(at, "arrive", { speech: result.speech, question: result.question });
      else setListening(null);
    });
  }, [birth, commitThrow, gender, guide, intention, journal, saveVoice, setListening]);

  function saveJournal(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    const squareId = square?.id ?? (position <= 0 ? 0 : null);
    if (squareId == null || text.length < 2) return;
    addJournal(squareId, text);
    setDraft("");
    setNoteSaved(true);
  }

  function openCell(id: number) {
    setReading(id);
    const hit = [...log].reverse().find((entry) => entry.to === id || entry.landed === id);
    if (hit) {
      setTurnAt(hit.at);
      setPane("word");
    }
  }

  const panes = [
    ["field", "Поле"],
    ["word", "Слово"],
    ["note", "Заметка"],
  ] as const;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-6">
      {spin ? <DiceThrow outcome={spin} onDone={finishSpin} /> : null}
      <LetterKeeper />
      <WisdomFloat open={briefPending || listeningAt != null} guide={guide} />
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LilaLogo />
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl">{nickname}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <About />
          <PathMenu onEditBirth={editBirth} onNewPath={newPath} onForget={forget} />
        </div>
      </header>

      {breathOpen ? (
        <div data-breath className="mt-6">
          <BreathRitual
            cycles={2}
            kicker="Перед броском"
            title="Два круга дыхания"
            body="Коротко вернись в тело. Потом откроется слово проводника."
            note="Вдох на четыре счёта, выдох на шесть."
            onComplete={onBreathDone}
          />
        </div>
      ) : (
        <>
          <div className="mt-5 flex gap-2" role="tablist" aria-label="Экраны хода">
            {panes.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={pane === id}
                onClick={() => setPane(id)}
                className={`min-h-11 flex-1 rounded-full border text-sm ${pane === id ? "border-gold text-gold" : "border-line text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {pane === "field" ? (
              <div className="flex flex-col gap-4">
                <BoardMap position={position} readingId={readingId} visited={visited} move={shown ?? null} onPick={openCell} />
                {letterOpen && !won ? (
                  <button type="button" className="text-left text-sm text-gold" onClick={() => setPane("word")}>
                    Письмо о тебе уже можно забрать — оно во вкладке «Слово».
                  </button>
                ) : null}
                {won ? (
                  <div className="rounded-3xl border border-gold-dim bg-bg-raise p-5">
                    <h3 className="font-display text-3xl">Ты на 68-й</h3>
                    <p className="mt-2 text-muted">Путь по этому вопросу пройден. Письмо — во вкладке «Слово».</p>
                    <Button className="mt-4 w-full" variant="glow" onClick={() => setPane("word")}>
                      Открыть письмо
                    </Button>
                    <Button className="mt-2" variant="quiet" onClick={newPath}>
                      Новый путь
                    </Button>
                  </div>
                ) : briefPending ? (
                  <p className="rounded-3xl border border-line bg-bg-raise px-4 py-4 text-sm text-muted">
                    Проводник собирает вопрос, карту и матрицу. Первый ход откроется, когда это будет готово.
                  </p>
                ) : needsEcho && latest ? (
                  <EchoChoice at={latest.at} />
                ) : ready ? (
                  <div className="flex flex-col gap-2">
                    <Button className="w-full tracking-wide" variant="glow" onClick={() => (skipBreath ? launch() : setBreathOpen(true))}>
                      {extraLeft > 0 ? "Ещё бросок" : position === 0 ? "Начать игру" : skipBreath ? "Ход" : "Дыхательная практика"}
                    </Button>
                    {extraLeft > 0 ? (
                      <p className="text-center text-sm text-muted">
                        {extraLeft === 1 ? "В этом ходу открыт ещё один бросок." : "В этом ходу открыты ещё два броска."}
                      </p>
                    ) : null}
                    {rollError ? <p className="text-sm text-gold">{rollError}</p> : null}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-3xl border border-line bg-bg-raise px-4 py-4">
                    <Hourglass className="size-5 text-gold" aria-hidden />
                    <p>
                      Следующий бросок через <span className="tabular-nums">{formatRemain(waitMs)}</span>
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {pane === "word" ? (
              <div className="panel rounded-3xl border border-line bg-surface/80 p-5">
                {briefPending && !shown ? (
                  <p>Проводник читает твой вопрос вместе с рисунком рождения. Карту он не показывает.</p>
                ) : shown ? (
                  <>
                    <ConductorTurn at={shown.at} />
                    {needsEcho && latest ? <EchoChoice at={latest.at} /> : null}
                    {won ? null : (
                      <Button className="mt-6 w-full" variant="glow" disabled={needsEcho} onClick={() => setPane("field")}>
                        Следующий ход
                      </Button>
                    )}
                    {letterOpen ? <LetterCard /> : null}
                    {log.length > 1 ? (
                      <div className="mt-5 flex gap-2">
                        <Button
                          type="button"
                          variant="quiet"
                          disabled={shownIndex <= 0}
                          onClick={() => {
                            const prev = log[shownIndex - 1];
                            if (prev) setTurnAt(prev.at);
                          }}
                        >
                          Раньше
                        </Button>
                        <Button
                          type="button"
                          variant="quiet"
                          disabled={shownIndex < 0 || shownIndex >= log.length - 1}
                          onClick={() => {
                            const next = log[shownIndex + 1];
                            if (next) setTurnAt(next.at);
                          }}
                        >
                          Дальше
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : innerBrief ? (
                  <>
                    <p className="mt-3">{innerBrief}</p>
                    <Button className="mt-5 w-full" variant="glow" onClick={() => setPane("field")}>
                      Следующий ход
                    </Button>
                  </>
                ) : (
                  <p className="text-muted">Слова проводника появятся после первого хода.</p>
                )}
              </div>
            ) : null}

            {pane === "note" ? (
              <form onSubmit={saveJournal} className="rounded-3xl border border-line bg-bg-raise p-5">
                <h2 className="font-display text-3xl">Личные заметки</h2>
                <p className="mt-2 text-sm text-muted">По желанию. Проводник не ждёт записи.</p>
                <label className="mt-4 block">
                  <span className="sr-only">Запись</span>
                  <textarea
                    className={`${fieldClass} min-h-28 py-3`}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={600}
                    placeholder="Пара честных слов себе"
                  />
                </label>
                <Button className="mt-3" type="submit" variant="quiet" disabled={draft.trim().length < 2}>
                  Оставить запись
                </Button>
                {noteSaved ? <p className="mt-2 text-sm text-gold">Запись осталась на этом устройстве.</p> : null}
                <ul className="mt-4 flex flex-col gap-2">
                  {journal.slice(0, 6).map((entry) => (
                    <li key={entry.id} className="text-sm text-muted">
                      {entry.text}
                    </li>
                  ))}
                </ul>
              </form>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function formatRemain(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes} мин ${seconds.toString().padStart(2, "0")} с`;
}

function About() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line px-4 text-sm hover:border-gold-dim"
        >
          <BookOpen className="size-4" aria-hidden />
          Об игре
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-bg/80" />
        <Dialog.Content className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-surface p-6">
            <Dialog.Title className="font-display text-3xl">Как устроена игра</Dialog.Title>
            <Dialog.Description className="mt-3 text-fg">LILA — это игровой формат самопознания.</Dialog.Description>
            <div className="mt-4 flex flex-col gap-3 text-muted">
              <p>У каждого из нас есть вопросы, которые отделяют от гармонии и умиротворенности. Ответы на них скрыты под многими слоями эго и неосознанных установок.</p>
              <p>Вопросы проводника — это карта, куда нужно идти, а твои ответы — сама тропинка к состоянию умиротворенности.</p>
              <p>Не бросай игру и отвечай честно.</p>
            </div>
            <h3 className="mt-5 font-display text-2xl text-fg">Правила просты</h3>
            <div className="mt-3 flex flex-col gap-3 text-muted">
              <p>Ты кидаешь кость. Открывается состояние, в котором этот вопрос сейчас живёт. Перед следующим ходом отмечаешь, где вопрос отразился ярче: в ощущениях тела, в мыслях или в эмоциях.</p>
              <p>Проводник задаёт один вопрос. Твоя часть — быть честным с собой. Отвечать вслух не нужно.</p>
              <p>Если захочешь, оставишь заметку только себе. Чем прямее смотришь, тем понятнее, что с этим вопросом делать.</p>
              <p>Игра может занять до 60 минут. Её всегда можно закрыть и вернуться: поле помнит клетку и прогресс. После третьего хода откроется письмо о тебе: сила, слабина и чем опираться в своём вопросе.</p>
            </div>
            <Dialog.Close asChild>
              <Button className="mt-6 w-full">Закрыть</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PathMenu({
  onEditBirth,
  onNewPath,
  onForget,
}: {
  onEditBirth: () => void;
  onNewPath: () => void;
  onForget: () => void;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line px-4 text-sm hover:border-gold-dim"
          aria-label="Меню"
        >
          <Menu className="size-4" aria-hidden />
          Меню
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-bg/80" />
        <Dialog.Content className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-surface p-6">
            <Dialog.Title className="font-display text-3xl">Меню</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">Заметки при новом пути остаются. «Забыть» стирает всё на этом устройстве.</Dialog.Description>
            <div className="mt-6 flex flex-col gap-2">
              <Dialog.Close asChild>
                <Button onClick={onNewPath}>Начать игру заново</Button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Button variant="quiet" onClick={onEditBirth}>
                  Изменить дату рождения
                </Button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Button variant="quiet" onClick={onForget}>
                  Забыть на этом устройстве
                </Button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <Button variant="quiet">Закрыть</Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EchoChoice({ at }: { at: number }) {
  const setMark = useGame((state) => state.setMark);
  const choices = [
    ["body", "В ощущениях тела"],
    ["thought", "В мыслях"],
    ["feeling", "В эмоциях"],
  ] as const;

  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="text-sm text-muted">Услышав вопрос проводника, где он в тебе отражается ярче всего? Следующий ход откроется после выбора.</p>
      <div className="mt-3 flex flex-col gap-2">
        {choices.map(([where, label]) => (
          <Button key={where} variant="quiet" onClick={() => setMark(at, where)}>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
