import { create } from "zustand";
import { persist } from "zustand/middleware";
import { resetQuiet } from "@/lib/leela/quiet-id";
import { applyRoll, canRollNow, rollDie, rollsForTurn, SIX_BONUS, type RollOutcome } from "@/lib/leela/rules";
import { mirrorReply } from "@/lib/leela/conductor";
import type { PathLetter } from "@/lib/leela/letter";

export type EchoWhere = "body" | "thought" | "feeling";
export type GuideId = "agni" | "soma";
export type Gender = "woman" | "man" | "open";
export type Phase = "intro" | "arrival" | "birth" | "breath" | "intention" | "play";

export type BirthProfile = {
  date: string;
  time: string;
  placeLabel: string;
  lat: number;
  lon: number;
  timeZone: string;
};

export type JournalEntry = {
  id: string;
  at: number;
  square: number;
  text: string;
  turnAt?: number;
};

export type LogEntry = RollOutcome & { at: number };
export type GuideVoice = { speech: string; question: string };
export type TurnVoice = { at: number; arrive?: GuideVoice; reply?: GuideVoice };

type PathState = {
  intention: string;
  position: number;
  visited: number[];
  lastTurnAt: number | null;
  extraLeft: number;
  log: LogEntry[];
  readingId: number;
  won: boolean;
  answeredAt: number | null;
  probeFor: number | null;
};

type Game = PathState & {
  phase: Phase;
  nickname: string;
  gender: Gender | null;
  guide: GuideId | null;
  birth: BirthProfile | null;
  journal: JournalEntry[];
  sound: boolean;
  seenIntro: boolean;
  lastBreathAt: number | null;
  voices: TurnVoice[];
  listeningAt: number | null;
  innerBrief: string;
  briefKey: string;
  briefStatus: "idle" | "reading" | "ready" | "quiet";
  letter: PathLetter | null;
  markAt: number | null;
  markWhere: EchoWhere | null;
  begin: () => void;
  setSound: (sound: boolean) => void;
  setArrival: (nickname: string, gender: Gender, guide: GuideId) => void;
  setBirth: (birth: BirthProfile) => void;
  finishBreath: () => void;
  setIntention: (intention: string) => void;
  throwDie: () => RollOutcome;
  planThrow: () => RollOutcome;
  commitThrow: (outcome: RollOutcome) => number;
  markBreath: () => void;
  setReading: (id: number) => void;
  addJournal: (square: number, text: string) => void;
  replyToTurn: (text: string) => { opened: boolean; mirror: string | null };
  noteReply: (text: string, open: boolean) => void;
  saveVoice: (at: number, kind: "arrive" | "reply", line: GuideVoice) => void;
  setListening: (at: number | null) => void;
  setBriefStatus: (status: "idle" | "reading" | "ready" | "quiet") => void;
  saveBrief: (key: string, speech: string) => void;
  saveLetter: (letter: PathLetter) => void;
  setMark: (at: number, where: EchoWhere) => void;
  permitTurn: () => void;
  newPath: () => void;
  editBirth: () => void;
  forget: () => void;
};

const emptyPath: PathState = {
  intention: "",
  position: 0,
  visited: [],
  lastTurnAt: null,
  extraLeft: 0,
  log: [],
  readingId: 0,
  won: false,
  answeredAt: null,
  probeFor: null,
};

const initial = {
  phase: "intro" as Phase,
  nickname: "",
  gender: null as Gender | null,
  guide: null as GuideId | null,
  birth: null as BirthProfile | null,
  journal: [] as JournalEntry[],
  sound: true,
  seenIntro: false,
  lastBreathAt: null,
  voices: [] as TurnVoice[],
  listeningAt: null,
  innerBrief: "",
  briefKey: "",
  briefStatus: "idle" as const,
  letter: null as PathLetter | null,
  markAt: null as number | null,
  markWhere: null as EchoWhere | null,
  ...emptyPath,
};

export const useGame = create<Game>()(
  persist(
    (set, get) => ({
      ...initial,
      begin: () =>
        set((state) => ({
          seenIntro: true,
          phase: state.phase === "intro" || !state.guide ? "arrival" : state.phase,
        })),
      setSound: (sound) => set({ sound }),
      setArrival: (nickname, gender, guide) => set({ nickname, gender, guide, phase: "birth" }),
      setBirth: (birth) =>
        set((state) => ({
          birth,
          phase: state.intention ? "play" : "breath",
        })),
      finishBreath: () => set({ phase: "intention", lastBreathAt: Date.now() }),
      markBreath: () => set({ lastBreathAt: Date.now() }),
      setIntention: (intention) =>
        set((state) => ({ intention, phase: "play", readingId: state.position })),
      planThrow: () => {
        const state = get();
        const now = Date.now();
        if (!canRollNow(state.lastTurnAt, true, state.won, now)) throw new Error("Ещё не время");
        const priorMisses =
          state.position <= 0 ? state.log.filter((entry) => entry.kind === "unborn").length : 0;
        const rolls = rollsForTurn(state.position, priorMisses, rollDie);
        const outcome = applyRoll(state.position, rolls[rolls.length - 1] ?? 1);
        return { ...outcome, rolls };
      },
      commitThrow: (outcome) => {
        const state = get();
        const now = Date.now();
        const spending = state.extraLeft > 0;
        const visited = new Set(state.visited);
        if (outcome.landed) visited.add(outcome.landed);
        if (outcome.to > 0) visited.add(outcome.to);
        const entry: LogEntry = { ...outcome, at: now };
        let extraLeft = 0;
        if (outcome.kind !== "win" && outcome.extra) extraLeft = SIX_BONUS;
        else if (outcome.kind !== "win" && spending) extraLeft = state.extraLeft - 1;
        const stillUnborn = outcome.kind === "unborn";
        set({
          position: outcome.to,
          readingId: outcome.to,
          visited: [...visited],
          extraLeft,
          won: outcome.kind === "win",
          lastTurnAt: stillUnborn ? null : extraLeft > 0 ? state.lastTurnAt : now,
          log: [...state.log, entry].slice(-40),
          probeFor: null,
        });
        return now;
      },
      throwDie: () => {
        const outcome = get().planThrow();
        get().commitThrow(outcome);
        return outcome;
      },
      setReading: (id) => set({ readingId: id }),
      addJournal: (square, text) =>
        set((state) => ({
          journal: [
            { id: `${Date.now()}`, at: Date.now(), square, text },
            ...state.journal,
          ].slice(0, 80),
        })),
      noteReply: (text, open) => {
        const state = get();
        const last = state.log[state.log.length - 1];
        const clean = text.trim();
        if (!last || clean.length < 2) return;
        set({
          journal: [
            { id: `${Date.now()}`, at: Date.now(), square: Math.max(0, last.to), text: clean, turnAt: last.at },
            ...state.journal,
          ].slice(0, 80),
          probeFor: open ? null : last.at,
          answeredAt: open ? last.at : state.answeredAt,
        });
      },
      saveVoice: (at, kind, line) =>
        set((state) => {
          const voices = state.voices.filter((item) => item.at !== at);
          const current = state.voices.find((item) => item.at === at) ?? { at };
          const next = { ...current, [kind]: line };
          return { voices: [next, ...voices].slice(0, 16), listeningAt: null };
        }),
      setListening: (at) => set({ listeningAt: at }),
      setBriefStatus: (briefStatus) => set({ briefStatus }),
      saveBrief: (key, speech) =>
        set({ briefKey: key, innerBrief: speech, briefStatus: speech ? "ready" : "quiet" }),
      saveLetter: (letter) => set({ letter }),
      setMark: (at, where) => set({ markAt: at, markWhere: where }),
      replyToTurn: (text) => {
        const state = get();
        const last = state.log[state.log.length - 1];
        const clean = text.trim();
        if (!last || clean.length < 2) return { opened: false, mirror: null };
        const mirror = last.kind === "unborn" || last.kind === "win" ? null : mirrorReply(clean);
        const firstProbe = Boolean(mirror) && state.probeFor !== last.at;
        set({
          journal: [
            { id: `${Date.now()}`, at: Date.now(), square: Math.max(0, last.to), text: clean, turnAt: last.at },
            ...state.journal,
          ].slice(0, 80),
          probeFor: firstProbe ? last.at : null,
          answeredAt: firstProbe ? state.answeredAt : last.at,
        });
        return { opened: !firstProbe, mirror: firstProbe ? mirror : null };
      },
      permitTurn: () => {
        const last = get().log[get().log.length - 1];
        if (!last || last.kind !== "unborn") return;
        set({ answeredAt: last.at, probeFor: null });
      },
      newPath: () => set({ ...emptyPath, phase: "breath", journal: get().journal, voices: [], letter: null, markAt: null, markWhere: null }),
      editBirth: () => set({ phase: "birth" }),
      forget: () => {
        resetQuiet();
        set({ ...initial });
      },
    }),
    {
      name: "lila-journey",
      skipHydration: true,
      version: 9,
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== "object") return persisted;
        const state = persisted as {
          extraRoll?: boolean;
          extraLeft?: number;
          position?: number;
          lastTurnAt?: number | null;
          answeredAt?: number | null;
          probeFor?: number | null;
          log?: Array<{ at: number }>;
          sound?: boolean;
          seenIntro?: boolean;
          lastBreathAt?: number | null;
          voices?: TurnVoice[];
          innerBrief?: string;
          briefKey?: string;
          letter?: PathLetter | null;
          markAt?: number | null;
          markWhere?: EchoWhere | null;
        };
        if (version < 2) {
          if (typeof state.extraLeft !== "number") state.extraLeft = state.extraRoll ? SIX_BONUS : 0;
          delete state.extraRoll;
          if ((state.position ?? 0) <= 0) state.lastTurnAt = null;
        }
        if (version < 3) {
          const last = state.log?.[state.log.length - 1];
          if (typeof state.answeredAt !== "number") state.answeredAt = last ? last.at : null;
          state.probeFor = null;
        }
        if (version < 4) {
          if (typeof state.sound !== "boolean") state.sound = true;
          state.seenIntro = false;
        }
        if (version < 5 && typeof state.lastBreathAt !== "number") state.lastBreathAt = null;
        if (version < 6 && !Array.isArray(state.voices)) state.voices = [];
        if (version < 7) {
          if (typeof state.innerBrief !== "string") state.innerBrief = "";
          if (typeof state.briefKey !== "string") state.briefKey = "";
        }
        if (version < 8 && state.letter == null) state.letter = null;
        if (version < 9) {
          state.markAt = null;
          state.markWhere = null;
        }
        return state;
      },
      partialize: (state) => ({
        phase: state.phase,
        nickname: state.nickname,
        gender: state.gender,
        guide: state.guide,
        birth: state.birth,
        journal: state.journal,
        sound: state.sound,
        seenIntro: state.seenIntro,
        lastBreathAt: state.lastBreathAt,
        voices: state.voices,
        innerBrief: state.innerBrief,
        briefKey: state.briefKey,
        letter: state.letter,
        markAt: state.markAt,
        markWhere: state.markWhere,
        intention: state.intention,
        position: state.position,
        visited: state.visited,
        lastTurnAt: state.lastTurnAt,
        extraLeft: state.extraLeft,
        log: state.log,
        readingId: state.readingId,
        won: state.won,
        answeredAt: state.answeredAt,
        probeFor: state.probeFor,
      }),
    },
  ),
);
