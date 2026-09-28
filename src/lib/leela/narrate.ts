import { squareById } from "@/lib/leela/board";
import type { RollOutcome } from "@/lib/leela/rules";

export function narrate(outcome: RollOutcome): string {
  if (outcome.kind === "unborn") {
    return `Выпало ${outcome.roll}. Порог не открылся. Это не отказ и не час ожидания: останься и ответь себе. Следующая попытка — сразу.`;
  }
  if (outcome.kind === "stay") {
    const more = outcome.extra ? " Шестёрка всё же открывает ещё два броска в этом ходу." : "";
    return `Выпало ${outcome.roll}. Число больше, чем остаток поля. Шаг не засчитан — ждёшь точного.${more}`;
  }
  const landed = outcome.landed ? squareById(outcome.landed) : null;
  const dest = squareById(outcome.to);
  if (outcome.kind === "birth") {
    const base = `Шестёрка рождает тебя на клетке «${dest.name}». И сразу открывает ещё два броска.`;
    return outcome.via ? `${base} ${viaLine(outcome)}` : base;
  }
  const moved = landed
    ? `Выпало ${outcome.roll}. Ты приходишь на «${landed.name}».`
    : `Выпало ${outcome.roll}.`;
  if (outcome.via && landed && landed.id !== dest.id) {
    const leap =
      outcome.via === "arrow"
        ? `Стрела «${landed.name}» поднимает тебя к «${dest.name}». Это не награда, а опора, которая уже была.`
        : `Змея на «${landed.name}» возвращает к «${dest.name}». Не наказание — место, где урок ещё живой.`;
    if (outcome.kind === "win") {
      return `${moved} ${leap} Клетка 68. Космическое сознание — не приз. Побудь здесь.`;
    }
    if (dest.id === 69) {
      return `${moved} ${leap} Космическое сознание осталось позади: отсюда к нему не возвращаются шагом назад. Дальше только точный ход к инерции, а она снова опустит на землю.`;
    }
    const tail = outcome.extra ? " Шестёрка открывает ещё два броска, пока ход не закрыт." : "";
    return `${moved} ${leap}${tail}`;
  }
  if (outcome.kind === "win") {
    return `${moved} Клетка 68. Космическое сознание — не приз, а пауза, в которой нечего доказывать.`;
  }
  if (outcome.to >= 69) {
    const tail = outcome.extra ? " Шестёрка открывает ещё два броска в этом ходу." : "";
    return `${moved} Ты прошёл мимо 68-й. Назад к ней ходом не вернуться. Нужен точный шаг до 72-й: инерция вернёт путь на землю.${tail}`;
  }
  if (outcome.extra) return `${moved} Шестёрка открывает ещё два броска, пока ход не закрыт.`;
  return moved;
}

function viaLine(outcome: RollOutcome): string {
  if (!outcome.via || !outcome.landed) return "";
  const landed = squareById(outcome.landed);
  const dest = squareById(outcome.to);
  if (landed.id === dest.id) return "";
  return outcome.via === "arrow"
    ? `Стрела поднимает к «${dest.name}».`
    : `Змея возвращает к «${dest.name}».`;
}
