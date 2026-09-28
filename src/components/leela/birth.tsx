import { useEffect, useState, type FormEvent } from "react";
import tzLookup from "tz-lookup";
import { Button, fieldClass } from "@/components/ui/button";
import { matchCities, type City } from "@/lib/places";
import { searchPlaces, type RemotePlace } from "@/lib/places-search";
import { useGame, type BirthProfile } from "@/lib/game-store";

type Chosen = BirthProfile;

export function Birth() {
  const setBirth = useGame((state) => state.setBirth);
  const saved = useGame((state) => state.birth);
  const nickname = useGame((state) => state.nickname);
  const [date, setDate] = useState(saved?.date ?? "");
  const [time, setTime] = useState(saved?.time ?? "");
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<RemotePlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState<Chosen | null>(saved);
  const [error, setError] = useState("");

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setRemote([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchPlaces({ data: { query: needle } })
        .then((places) => setRemote(places))
        .catch(() => setRemote([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  function choose(place: { label: string; lat: number; lon: number }) {
    let timeZone = "";
    try {
      timeZone = tzLookup(place.lat, place.lon);
    } catch {
      timeZone = "";
    }
    if (!timeZone) {
      setError("Не удалось понять часовой пояс этого места. Выбери город точнее.");
      return;
    }
    setError("");
    setChosen({
      date,
      time,
      placeLabel: place.label,
      lat: place.lat,
      lon: place.lon,
      timeZone,
    });
    setQuery("");
    setRemote([]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!date || !time) {
      setError("Нужны дата и время рождения.");
      return;
    }
    const year = Number(date.slice(0, 4));
    const today = new Date().toISOString().slice(0, 10);
    if (year < 1920 || date > today) {
      setError("Проверь дату: год не раньше 1920 и не в будущем.");
      return;
    }
    if (!chosen) {
      setError("Выбери место из списка.");
      return;
    }
    setBirth({ ...chosen, date, time });
  }

  const local = matchCities(query);

  return (
    <form onSubmit={submit} className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-5 py-12">
      <header>
        <p className="text-sm tracking-widest text-gold uppercase">{nickname}</p>
        <h1 className="mt-2 font-display text-5xl">Когда ты родился</h1>
        <p className="mt-4 text-muted">
          Дата, время и город останутся только на этом устройстве. Карту я не раскладываю. Она нужна, чтобы говорить точнее — и только.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm text-muted">Дата</span>
          <input className={fieldClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-muted">Время</span>
          <input className={fieldClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
        </label>
      </div>
      <p className="text-sm text-muted">Если время примерное, поставь ближайший час. Для проводника этого достаточно.</p>

      <label className="block">
        <span className="mb-2 block text-sm text-muted">Место рождения</span>
        <input
          className={fieldClass}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Город"
          autoComplete="off"
        />
      </label>

      {chosen ? (
        <p className="rounded-2xl border border-gold-dim bg-surface px-4 py-3 text-sm">
          Выбрано: {shortPlace(chosen.placeLabel)}
          <span className="mt-1 block text-muted">{chosen.timeZone}</span>
        </p>
      ) : null}

      <div className="grid gap-2">
        {local.map((city) => (
          <PlaceButton key={city.label} place={city} onChoose={choose} />
        ))}
        {remote
          .filter((place) => !local.some((city) => city.label === place.label))
          .map((place) => (
            <PlaceButton key={`${place.lat}-${place.lon}`} place={place} onChoose={choose} />
          ))}
        {searching ? <p className="text-sm text-muted">Ищу город…</p> : null}
      </div>

      {error ? <p className="text-sm text-gold">{error}</p> : null}
      <Button type="submit">К дыханию</Button>
    </form>
  );
}

function PlaceButton({
  place,
  onChoose,
}: {
  place: City | RemotePlace;
  onChoose: (place: { label: string; lat: number; lon: number }) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChoose(place)}
      className="min-h-12 rounded-2xl border border-line bg-bg-raise px-4 py-3 text-left text-sm hover:border-gold-dim"
    >
      {shortPlace(place.label)}
    </button>
  );
}

function shortPlace(label: string): string {
  const parts = label.split(",").map((part) => part.trim());
  return parts.slice(0, 3).join(", ");
}
