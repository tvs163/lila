export const HOUR_MS = 60 * 60 * 1000;
export const SIX_BONUS = 2;
export const BREATH_FRESH_MS = 3 * 60 * 1000;

export const ARROWS: Record<number, number> = {
  10: 23,
  17: 69,
  20: 32,
  22: 60,
  27: 41,
  28: 50,
  37: 66,
  45: 67,
  46: 62,
  54: 68,
};

export const SNAKES: Record<number, number> = {
  12: 8,
  16: 4,
  24: 7,
  29: 6,
  44: 9,
  52: 35,
  55: 3,
  61: 13,
  63: 2,
  72: 51,
};

export type MoveKind = "unborn" | "birth" | "move" | "stay" | "win";
export type Via = "arrow" | "snake" | null;

export type RollOutcome = {
  roll: number;
  from: number;
  landed: number | null;
  to: number;
  kind: MoveKind;
  via: Via;
  extra: boolean;
  rolls?: number[];
};

export function rollDie(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return (buffer[0] % 6) + 1;
}

export function rollsForTurn(_position: number, _priorMisses: number, next: () => number): number[] {
  return [next()];
}

function resolve(cell: number): { to: number; via: Via } {
  if (ARROWS[cell]) return { to: ARROWS[cell], via: "arrow" };
  if (SNAKES[cell]) return { to: SNAKES[cell], via: "snake" };
  return { to: cell, via: null };
}

export function applyRoll(position: number, roll: number): RollOutcome {
  if (position <= 0) {
    const cell = Math.min(6, Math.max(1, roll));
    const next = resolve(cell);
    const win = next.to === 68;
    return {
      roll,
      from: 0,
      landed: cell,
      to: next.to,
      kind: win ? "win" : "birth",
      via: next.via,
      extra: win ? false : roll === 6,
    };
  }

  const dest = position + roll;
  if (dest > 72) {
    return { roll, from: position, landed: null, to: position, kind: "stay", via: null, extra: roll === 6 };
  }
  const next = resolve(dest);
  const win = next.to === 68;
  return {
    roll,
    from: position,
    landed: dest,
    to: next.to,
    kind: win ? "win" : "move",
    via: next.via,
    extra: win ? false : roll === 6,
  };
}

export function canRollNow(lastTurnAt: number | null, openTurn: boolean, won: boolean, now: number): boolean {
  if (won) return false;
  if (openTurn) return true;
  if (lastTurnAt == null) return true;
  return now - lastTurnAt >= HOUR_MS;
}
