create table if not exists play_accounts (
  id text primary key,
  nickname text not null default '',
  visits integer not null default 0,
  moves integer not null default 0,
  cell integer not null default 0,
  seconds integer not null default 0,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
