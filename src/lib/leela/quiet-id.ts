const ACCOUNT_KEY = "lila-quiet";
const SECONDS_KEY = "lila-seconds";
const VISIT_KEY = "lila-visit";

export function accountId(): string {
  const existing = localStorage.getItem(ACCOUNT_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(ACCOUNT_KEY, id);
  return id;
}

export function readSeconds(): number {
  const value = Number(localStorage.getItem(SECONDS_KEY) ?? "0");
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function writeSeconds(seconds: number) {
  localStorage.setItem(SECONDS_KEY, String(Math.max(0, Math.floor(seconds))));
}

export function visitPending(): boolean {
  return sessionStorage.getItem(VISIT_KEY) !== "1";
}

export function markVisit() {
  sessionStorage.setItem(VISIT_KEY, "1");
}

export function resetQuiet() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCOUNT_KEY);
  localStorage.removeItem(SECONDS_KEY);
  sessionStorage.removeItem(VISIT_KEY);
}
