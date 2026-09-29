import { squareById } from "@/lib/leela/board";
import { conduct } from "@/lib/leela/conductor";
import { askGuide, type GuideResult } from "@/lib/leela/guide";
import type { RollOutcome } from "@/lib/leela/rules";
import type { BirthProfile, Gender, GuideId, JournalEntry } from "@/lib/game-store";
import { readInnerChart } from "@/lib/vedic/chart";
import { birthPortrait } from "@/lib/vedic/portrait";
import { personalNote } from "@/lib/vedic/voice";

export type GuideLine = { speech: string; question: string; next?: string };

type ListenBase = {
  guide: GuideId | null;
  gender?: Gender | null;
  intention: string;
  journal: JournalEntry[];
  birth: BirthProfile | null;
  outcome: RollOutcome;
  brief?: string;
  echo?: string;
};

export function playerOf(gender: Gender | null | undefined, guide: GuideId | null): "woman" | "man" {
  if (gender === "woman" || gender === "man") return gender;
  return guide === "soma" ? "man" : "woman";
}

function tendencyFor(birth: BirthProfile | null, squareId: number): string {
  if (!birth || squareId <= 0) return "";
  try {
    return personalNote(readInnerChart(birth), squareById(squareId).lens).note;
  } catch {
    return "";
  }
}

function payload(base: ListenBase, kind: "arrive" | "reply", reply = "") {
  const speech = conduct(base.outcome, base.intention);
  const cell = base.outcome.to > 0 ? squareById(base.outcome.to) : null;
  return {
    kind,
    guide: base.guide === "soma" ? ("soma" as const) : ("agni" as const),
    player: playerOf(base.gender, base.guide),
    intention: base.intention.slice(0, 300),
    facts: speech.move.slice(0, 700),
    cell: speech.title.slice(0, 160),
    essence: (cell?.essence ?? speech.essence).slice(0, 500),
    stockQuestion: (cell?.question ?? speech.questions[0] ?? "").slice(0, 300),
    tendency: tendencyFor(base.birth, cell?.id ?? 0).slice(0, 220),
    portrait: base.birth ? birthPortrait(base.birth, tendencyFor(base.birth, cell?.id ?? 0)).slice(0, 1600) : "",
    brief: (base.brief ?? "").slice(0, 900),
    reply: reply.slice(0, 800),
    earlier: base.journal.slice(0, 3).map((entry) => entry.text.slice(0, 280)),
    echo: (base.echo ?? "").slice(0, 220),
  };
}

export async function listenPrepare(
  birth: BirthProfile,
  guide: GuideId | null,
  intention: string,
  player: "woman" | "man",
): Promise<GuideResult> {
  try {
    return await askGuide({
      data: {
        kind: "prepare",
        guide: guide === "soma" ? "soma" : "agni",
        player,
        intention: intention.slice(0, 300),
        facts: "Разбор до первого хода. Клетки ещё нет. Собери понимание под вопрос человека, его рисунок и свой голос.",
        cell: "",
        essence: "",
        stockQuestion: "",
        tendency: "",
        portrait: birthPortrait(birth).slice(0, 1600),
        brief: "",
        reply: "",
        earlier: [],
        echo: "",
      },
    });
  } catch {
    return { ok: false, error: "Проводник сейчас молчит" };
  }
}

export async function listenArrive(base: ListenBase): Promise<GuideResult> {
  try {
    return await askGuide({ data: payload(base, "arrive") });
  } catch {
    return { ok: false, error: "Проводник сейчас молчит" };
  }
}

export async function listenReply(base: ListenBase, reply: string): Promise<GuideResult> {
  try {
    return await askGuide({ data: payload(base, "reply", reply) });
  } catch {
    return { ok: false, error: "Проводник сейчас молчит" };
  }
}
