export type City = {
  label: string;
  lat: number;
  lon: number;
};

export const CITIES: City[] = [
  { label: "Москва", lat: 55.7558, lon: 37.6173 },
  { label: "Санкт-Петербург", lat: 59.9343, lon: 30.3351 },
  { label: "Казань", lat: 55.7887, lon: 49.1221 },
  { label: "Нижний Новгород", lat: 56.2965, lon: 43.9361 },
  { label: "Екатеринбург", lat: 56.8389, lon: 60.6057 },
  { label: "Новосибирск", lat: 55.0084, lon: 82.9357 },
  { label: "Красноярск", lat: 56.0153, lon: 92.8932 },
  { label: "Владивосток", lat: 43.1155, lon: 131.8855 },
  { label: "Калининград", lat: 54.7104, lon: 20.4522 },
  { label: "Сочи", lat: 43.6028, lon: 39.7342 },
  { label: "Самара", lat: 53.1959, lon: 50.1002 },
  { label: "Ростов-на-Дону", lat: 47.2357, lon: 39.7015 },
  { label: "Уфа", lat: 54.7388, lon: 55.9721 },
  { label: "Краснодар", lat: 45.0355, lon: 38.9753 },
  { label: "Иркутск", lat: 52.287, lon: 104.305 },
  { label: "Киев", lat: 50.4501, lon: 30.5234 },
  { label: "Минск", lat: 53.9006, lon: 27.559 },
  { label: "Алматы", lat: 43.222, lon: 76.8512 },
  { label: "Астана", lat: 51.1694, lon: 71.4491 },
  { label: "Ташкент", lat: 41.2995, lon: 69.2401 },
  { label: "Баку", lat: 40.4093, lon: 49.8671 },
  { label: "Тбилиси", lat: 41.7151, lon: 44.8271 },
  { label: "Ереван", lat: 40.1792, lon: 44.4991 },
  { label: "Стамбул", lat: 41.0082, lon: 28.9784 },
  { label: "Берлин", lat: 52.52, lon: 13.405 },
  { label: "Париж", lat: 48.8566, lon: 2.3522 },
  { label: "Лондон", lat: 51.5074, lon: -0.1278 },
  { label: "Нью-Йорк", lat: 40.7128, lon: -74.006 },
  { label: "Рим", lat: 41.9028, lon: 12.4964 },
  { label: "Рига", lat: 56.9496, lon: 24.1052 },
  { label: "Вильнюс", lat: 54.6872, lon: 25.2797 },
  { label: "Таллин", lat: 59.437, lon: 24.7536 },
  { label: "Тель-Авив", lat: 32.0853, lon: 34.7818 },
  { label: "Дубай", lat: 25.2048, lon: 55.2708 },
];

export function matchCities(query: string): City[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 1) return CITIES.slice(0, 8);
  return CITIES.filter((city) => city.label.toLowerCase().includes(needle)).slice(0, 8);
}
