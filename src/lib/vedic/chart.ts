import { Body, Ecliptic, EclipticGeoMoon, GeoVector, MakeTime, SiderealTime, e_tilt } from "astronomy-engine";
import { zonedWallToUtc } from "@/lib/time";

export type Lens = "heat" | "grasp" | "fog" | "duty" | "body" | "heart" | "mind";
export type ElementName = "fire" | "earth" | "air" | "water";

export type BirthInput = {
  date: string;
  time: string;
  timeZone: string;
  lat: number;
  lon: number;
};

export type InnerChart = {
  moonNakshatra: number;
  elements: Record<Lens, ElementName>;
};

const ELEMENTS: ElementName[] = [
  "fire",
  "earth",
  "air",
  "water",
  "fire",
  "earth",
  "air",
  "water",
  "fire",
  "earth",
  "air",
  "water",
];

function wrap(deg: number): number {
  const value = deg % 360;
  return value < 0 ? value + 360 : value;
}

function lahiri(jd: number): number {
  const t = (jd - 2451545) / 36525;
  return 23.85306 + 1.39722 * t + 0.00018 * t * t;
}

function tropicalLongitude(body: Body, date: Date): number {
  if (body === Body.Moon) return wrap(EclipticGeoMoon(date).lon);
  return wrap(Ecliptic(GeoVector(body, date, true)).elon);
}

function tropicalAscendant(date: Date, lat: number, lon: number): number {
  const time = MakeTime(date);
  const gast = SiderealTime(date);
  const eps = (e_tilt(time).tobl * Math.PI) / 180;
  const lst = wrap(gast * 15 + lon);
  const ramc = (lst * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  let asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  asc = (asc * 180) / Math.PI;
  return wrap(asc);
}

const SIGNS = ["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"] as const;

const NAKSHATRAS = [
  "Ашвини",
  "Бхарани",
  "Криттика",
  "Рохини",
  "Мригашира",
  "Ардра",
  "Пунарвасу",
  "Пушья",
  "Ашлеша",
  "Магха",
  "Пурва-Пхалгуни",
  "Уттара-Пхалгуни",
  "Хаста",
  "Читра",
  "Свати",
  "Вишакха",
  "Анурадха",
  "Джйештха",
  "Мула",
  "Пурва-Ашадха",
  "Уттара-Ашадха",
  "Шравана",
  "Дхаништха",
  "Шатабхиша",
  "Пурва-Бхадрапада",
  "Уттара-Бхадрапада",
  "Ревати",
] as const;

export type SkyPoint = { sign: string; degree: number; nakshatra: string };
export type SkyChart = {
  lagna: SkyPoint;
  moon: SkyPoint;
  planets: Array<{ name: string; sign: string; degree: number }>;
};

function pointOf(longitude: number): SkyPoint {
  const lon = wrap(longitude);
  return {
    sign: SIGNS[Math.floor(lon / 30)] ?? "Овен",
    degree: Math.floor(lon % 30),
    nakshatra: NAKSHATRAS[Math.floor(lon / (360 / 27)) % 27] ?? "Ашвини",
  };
}

function siderealOf(birth: BirthInput) {
  const date = zonedWallToUtc(birth.date, birth.time, birth.timeZone);
  const time = MakeTime(date);
  const ayanamsa = lahiri(2451545 + time.ut);
  const sidereal = (body: Body) => wrap(tropicalLongitude(body, date) - ayanamsa);
  const lagna = wrap(tropicalAscendant(date, birth.lat, birth.lon) - ayanamsa);
  return { sidereal, lagna };
}
function elementOf(longitude: number): ElementName {
  return ELEMENTS[Math.floor(wrap(longitude) / 30)] ?? "earth";
}

export function readSky(birth: BirthInput): SkyChart {
  const { sidereal, lagna } = siderealOf(birth);
  const named: Array<[string, Body]> = [
    ["Солнце", Body.Sun],
    ["Луна", Body.Moon],
    ["Меркурий", Body.Mercury],
    ["Венера", Body.Venus],
    ["Марс", Body.Mars],
    ["Юпитер", Body.Jupiter],
    ["Сатурн", Body.Saturn],
  ];
  return {
    lagna: pointOf(lagna),
    moon: pointOf(sidereal(Body.Moon)),
    planets: named.map(([name, body]) => {
      const place = pointOf(sidereal(body));
      return { name, sign: place.sign, degree: place.degree };
    }),
  };
}

export function readInnerChart(birth: BirthInput): InnerChart {
  const { sidereal, lagna } = siderealOf(birth);
  const moon = sidereal(Body.Moon);
  const of = (body: Body) => elementOf(sidereal(body));
  return {
    moonNakshatra: Math.floor(moon / (360 / 27)) % 27,
    elements: {
      heat: of(Body.Mars),
      grasp: of(Body.Venus),
      fog: elementOf(moon),
      duty: of(Body.Jupiter),
      body: elementOf(lagna),
      heart: elementOf(moon),
      mind: of(Body.Mercury),
    },
  };
}
