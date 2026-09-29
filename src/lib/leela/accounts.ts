import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dbSource, getSql } from "@/lib/db";

const NoteInput = z.object({
  id: z.string().uuid(),
  nickname: z.string().trim().max(40),
  visit: z.boolean(),
  moves: z.number().int().min(0).max(500),
  cell: z.number().int().min(0).max(72),
  seconds: z.number().int().min(0).max(60 * 60 * 24 * 60),
});

export type PlayAccount = {
  id: string;
  nickname: string;
  visits: number;
  moves: number;
  cell: number;
  seconds: number;
  firstSeen: string;
  lastSeen: string;
};

function expectedKey() {
  const value = process.env["STATS_KEY"];
  return typeof value === "string" ? value.trim() : "";
}

function gate(key: string): "ok" | "missing" | "mismatch" {
  const expected = expectedKey();
  if (!expected) return dbSource === "pglite" ? "ok" : "missing";
  return key === expected ? "ok" : "mismatch";
}

export const noteAccount = createServerFn({ method: "POST" })
  .validator((input: unknown) => NoteInput.parse(input))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const visit = data.visit ? 1 : 0;
    await sql`
      insert into play_accounts (id, nickname, visits, moves, cell, seconds)
      values (${data.id}, ${data.nickname}, ${visit}, ${data.moves}, ${data.cell}, ${data.seconds})
      on conflict (id) do update set
        nickname = case
          when excluded.nickname <> '' then excluded.nickname
          else play_accounts.nickname
        end,
        visits = play_accounts.visits + ${visit},
        moves = greatest(play_accounts.moves, excluded.moves),
        cell = excluded.cell,
        seconds = greatest(play_accounts.seconds, excluded.seconds),
        last_seen = now()
    `;
    return { ok: true as const };
  });

export const readAccounts = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ key: z.string().max(200) }).parse(input))
  .handler(async ({ data }): Promise<{ ok: true; rows: PlayAccount[] } | { ok: false; reason: "missing" | "mismatch" | "db" }> => {
    const allowed = gate(data.key.trim());
    if (allowed !== "ok") return { ok: false, reason: allowed };
    try {
      const sql = await getSql();
    const rows = await sql<{
      id: string;
      nickname: string;
      visits: number;
      moves: number;
      cell: number;
      seconds: number;
      first_seen: string | Date;
      last_seen: string | Date;
    }>`
      select id, nickname, visits, moves, cell, seconds, first_seen, last_seen
      from play_accounts
      order by last_seen desc
      limit 200
    `;
    return {
      ok: true,
      rows: rows.map((row) => ({
        id: row.id,
        nickname: row.nickname,
        visits: Number(row.visits),
        moves: Number(row.moves),
        cell: Number(row.cell),
        seconds: Number(row.seconds),
        firstSeen: new Date(row.first_seen).toISOString(),
        lastSeen: new Date(row.last_seen).toISOString(),
      })),
    };
    } catch {
      return { ok: false, reason: "db" };
    }
  });
