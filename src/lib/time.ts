export function zonedWallToUtc(date: string, time: string, timeZone: string): Date {
  const matchD = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const matchT = /^(\d{2}):(\d{2})$/.exec(time);
  if (!matchD || !matchT) throw new Error("Некорректные дата или время");
  const y = Number(matchD[1]);
  const m = Number(matchD[2]);
  const d = Number(matchD[3]);
  const hh = Number(matchT[1]);
  const mm = Number(matchT[2]);
  if (m < 1 || m > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) {
    throw new Error("Некорректные дата или время");
  }
  const target = Date.UTC(y, m - 1, d, hh, mm, 0);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const asUtc = (ms: number) => {
    const parts = fmt.formatToParts(new Date(ms));
    const pick = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    const hour = pick("hour");
    return Date.UTC(
      pick("year"),
      pick("month") - 1,
      pick("day"),
      hour === 24 ? 0 : hour,
      pick("minute"),
      pick("second"),
    );
  };
  let ms = target;
  for (let i = 0; i < 4; i += 1) ms += target - asUtc(ms);
  return new Date(ms);
}
