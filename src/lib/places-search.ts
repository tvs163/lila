import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type RemotePlace = { label: string; lat: number; lon: number };

const Query = z.object({
  query: z.string().trim().min(2).max(80),
});

export const searchPlaces = createServerFn({ method: "POST" })
  .validator((input: unknown) => Query.parse(input))
  .handler(async ({ data }): Promise<RemotePlace[]> => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("q", data.query);
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "application/json",
          "Accept-Language": "ru",
          "User-Agent": "LilaSelfKnowledge/1.0",
        },
      });
      if (!response.ok) return [];
      const json: unknown = await response.json();
      if (!Array.isArray(json)) return [];
      const places: RemotePlace[] = [];
      for (const item of json) {
        if (!item || typeof item !== "object") continue;
        const row = item as { display_name?: unknown; lat?: unknown; lon?: unknown };
        const lat = Number(row.lat);
        const lon = Number(row.lon);
        const label = typeof row.display_name === "string" ? row.display_name : "";
        if (!label || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
        places.push({ label, lat, lon });
      }
      return places;
    } catch {
      return [];
    }
  });
