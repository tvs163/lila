import type { BirthProfile } from "@/lib/game-store";
import { readSky } from "@/lib/vedic/chart";

const CELLS: Array<[number, string]> = [
  [1, "характер и воля"],
  [2, "энергия"],
  [3, "познание"],
  [4, "здоровье"],
  [5, "логика"],
  [6, "труд"],
  [7, "удача"],
  [8, "долг"],
  [9, "память"],
];

function digitsOf(value: string): number[] {
  return value.replace(/\D/g, "").split("").map(Number);
}

function digitSum(value: number): number {
  return String(Math.abs(value))
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
}

function counts(digits: number[]): number[] {
  const cells = Array.from({ length: 10 }, () => 0);
  for (const digit of digits) {
    if (digit >= 1 && digit <= 9) cells[digit] += 1;
  }
  return cells;
}

function line(cells: number[]): string {
  return CELLS.map(([digit, name]) => {
    const count = cells[digit] ?? 0;
    return count === 0 ? `${digit} нет (${name})` : `${digit}×${count} (${name})`;
  }).join("; ");
}

export function birthPortrait(birth: BirthProfile, tendency = ""): string {
  const [year, month, day] = birth.date.split("-");
  if (!year || !month || !day) return "";
  const dateDigits = digitsOf(`${day}${month}${year}`);
  const first = dateDigits.reduce((sum, digit) => sum + digit, 0);
  const second = digitSum(first);
  const dayHead = Number(String(Number(day))[0] ?? "0");
  const third = first - 2 * dayHead;
  const fourth = digitSum(third);
  const working = digitsOf(`${first}${second}${third}${fourth}`);
  const byDate = counts([...dateDigits, ...working]);
  const withTime = counts([...dateDigits, ...working, ...digitsOf(birth.time)]);
  let sky = "карта не сошлась, опирайся на дату и время";
  try {
    const chart = readSky(birth);
    const planets = chart.planets.map((planet) => `${planet.name} ${planet.sign} ${planet.degree}°`).join(", ");
    sky = `лагна ${chart.lagna.sign} ${chart.lagna.degree}°, Луна в накшатре ${chart.moon.nakshatra}. ${planets}`;
  } catch {
    sky = "карта не сошлась, опирайся на дату и время";
  }
  const when = `${day}.${month}.${year}, ${birth.time}, ${birth.placeLabel}`;
  const lean = tendency ? ` Уклон этой клетки: ${tendency}` : "";
  return `Рождение: ${when}. Психоматрица по дате: ${line(byDate)}. С часом рождения: ${line(withTime)}. Ведическая карта, Лахири: ${sky}.${lean}`.slice(0, 1600);
}

const QUALITY: Record<string, string> = {
  Овен: "сразу действует и плохо переносит ожидание",
  Телец: "держит через тело, устойчивость и медленный ритм",
  Близнецы: "сначала разбирает словами и ищет, как это назвать",
  Рак: "чувствует раньше, чем понимает, и бережёт своё",
  Лев: "хочет, чтобы это было живым и заметным",
  Дева: "ищет точность и поправляет детали",
  Весы: "смотрит через отношение с другим человеком",
  Скорпион: "идёт вглубь и не отпускает, пока не дойдёт до сути",
  Стрелец: "ищет смысл шире, чем сама ситуация",
  Козерог: "держит через долг, срок и выдержку",
  Водолей: "смотрит со стороны и сверяет со своим законом",
  Рыбы: "впитывает настроение и легко теряет границу",
};

function place(sign: string | undefined) {
  return (sign && QUALITY[sign]) || "ровный, без резкого перекоса";
}

export function letterSeed(birth: BirthProfile): string {
  const [year, month, day] = birth.date.split("-");
  if (!year || !month || !day) return "";
  const dateDigits = digitsOf(`${day}${month}${year}`);
  const first = dateDigits.reduce((sum, digit) => sum + digit, 0);
  const second = digitSum(first);
  const dayHead = Number(String(Number(day))[0] ?? "0");
  const third = first - 2 * dayHead;
  const fourth = digitSum(third);
  const cells = counts([...dateDigits, ...digitsOf(`${first}${second}${third}${fourth}`), ...digitsOf(birth.time)]);
  const strong = CELLS.filter(([digit]) => (cells[digit] ?? 0) >= 2).map(([, name]) => name);
  const thin = CELLS.filter(([digit]) => (cells[digit] ?? 0) === 0).map(([, name]) => name);
  let lines = ["встречает мир ровно", "чувствует ровно", "сила ровная", "ум ровный", "действие ровное", "граница ровная"];
  try {
    const chart = readSky(birth);
    const sign = (name: string) => chart.planets.find((planet) => planet.name === name)?.sign;
    lines = [
      `как встречает мир: ${place(chart.lagna.sign)}`,
      `как чувствует: ${place(chart.moon.sign)}`,
      `куда тянется сила: ${place(sign("Солнце"))}`,
      `как думает: ${place(sign("Меркурий"))}`,
      `как действует: ${place(sign("Марс"))}`,
      `как держит границу: ${place(sign("Сатурн"))}`,
    ];
  } catch {
    lines = ["встречает мир ровно"];
  }
  return [
    ...lines,
    strong.length ? `внутренняя опора: ${strong.slice(0, 4).join(", ")}` : "",
    thin.length ? `тонкое место: ${thin.slice(0, 3).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(". ")
    .slice(0, 900);
}
