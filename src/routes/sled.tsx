import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, LilaLogo } from "@/components/leela/shell";
import { Button, fieldClass } from "@/components/ui/button";
import { readAccounts, type PlayAccount } from "@/lib/leela/accounts";

export const Route = createFileRoute("/sled")({ component: SledPage });

function minutes(seconds: number) {
  return Math.max(0, Math.round(seconds / 60));
}

function when(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function SledPage() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<PlayAccount[] | null>(null);
  const [closed, setClosed] = useState<"mismatch" | "missing" | "db" | "nodb" | null>(null);
  const [pending, setPending] = useState(false);

  async function open() {
    setPending(true);
    setClosed(null);
    try {
      const result = await readAccounts({ data: { key: key.trim() } });
      if (!result.ok) {
        setRows(null);
        setClosed(result.reason);
      } else {
        setRows(result.rows);
      }
    } catch {
      setRows(null);
      setClosed("db");
    } finally {
      setPending(false);
    }
  }

  const people = rows?.length ?? 0;
  const visits = rows?.reduce((sum, row) => sum + row.visits, 0) ?? 0;
  const deep = rows?.reduce((sum, row) => sum + row.moves, 0) ?? 0;

  return (
    <Shell>
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <header>
          <LilaLogo />
          <p className="mt-4 text-sm tracking-widest text-gold uppercase">Только для тебя</p>
          <h1 className="mt-2 font-display text-5xl">След игры</h1>
          <p className="mt-3 max-w-xl text-muted">Кто заходил, сколько раз и как глубоко прошёл. Даты рождения и заметок здесь нет.</p>
        </header>

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void open();
          }}
        >
          <label className="block flex-1">
            <span className="sr-only">Ключ</span>
            <input
              className={fieldClass}
              value={key}
              onChange={(event) => setKey(event.target.value)}
              type="password"
              autoComplete="off"
              placeholder="Ключ страницы"
            />
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Смотрю…" : "Открыть"}
          </Button>
        </form>
        {closed === "mismatch" ? <p className="text-sm text-gold">Фраза не совпала с STATS_KEY.</p> : null}
        {closed === "missing" ? (
          <p className="text-sm text-gold">На сервере нет STATS_KEY. Добавь её в проект lila-pied для Production и пересобери без старого кеша.</p>
        ) : null}
        {closed === "nodb" ? (
          <p className="text-sm text-gold">Ключ верный. Базы у проекта нет: слева Storage, затем Neon, подключи к lila-pied и сделай Redeploy.</p>
        ) : null}
        {closed === "db" ? (
          <p className="text-sm text-gold">Ключ подошёл, но список не открылся: база не ответила.</p>
        ) : null}

        {rows ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Игроки" value={String(people)} />
              <Stat label="Визиты" value={String(visits)} />
              <Stat label="Ходы" value={String(deep)} />
            </div>
            <div className="overflow-x-auto rounded-3xl border border-line">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="px-4 py-3 font-normal">Имя</th>
                    <th className="px-4 py-3 font-normal">Визиты</th>
                    <th className="px-4 py-3 font-normal">Ходы</th>
                    <th className="px-4 py-3 font-normal">Клетка</th>
                    <th className="px-4 py-3 font-normal">Минуты</th>
                    <th className="px-4 py-3 font-normal">Был</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-muted" colSpan={6}>
                        Пока никто не заходил.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-t border-line">
                        <td className="px-4 py-3">{row.nickname || "без имени"}</td>
                        <td className="px-4 py-3 tabular-nums">{row.visits}</td>
                        <td className="px-4 py-3 tabular-nums">{row.moves}</td>
                        <td className="px-4 py-3 tabular-nums">{row.cell}</td>
                        <td className="px-4 py-3 tabular-nums">{minutes(row.seconds)}</td>
                        <td className="px-4 py-3 text-muted">{when(row.lastSeen)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </main>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-surface/80 px-4 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl tabular-nums">{value}</p>
    </div>
  );
}
