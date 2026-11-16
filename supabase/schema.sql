-- Gîte Happens: Supabase schema (tables + RLS + RPC functions).
-- Paste the whole file into Supabase → SQL Editor → Run. Safe to re-run.
-- Then set the two passwords with supabase/seed.example.sql.
--
-- Security model (see docs/spec.md §3.3):
--   * RLS on, no policies, and no table privileges for anon/authenticated:
--     the browser can't read or write tables directly.
--   * Everything goes through the SECURITY DEFINER functions below, which
--     check the group password (or the admin password) against a bcrypt hash.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tables

create table if not exists public.settings (
  key   text primary key,
  value text not null
);

create table if not exists public.participants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
create unique index if not exists participants_name_ci on public.participants (lower(name));

create table if not exists public.responses (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  status      text check (status in ('in', 'maybe', 'out')),
  days        date[] not null default '{}',
  all_days    boolean not null default false,
  dates_note  text check (char_length(dates_note) <= 500),
  ski         text check (ski in ('oui', 'non', 'peu_importe')),
  teletravail text check (teletravail in ('oui', 'non', 'peu_importe')),
  lieu        text check (lieu in ('chambery', 'aix', 'nature', 'peu_importe')),
  voiture     text check (voiture in ('oui', 'non', 'peu_importe')),
  note        text check (char_length(note) <= 500),
  updated_at  timestamptz not null default now()
);

create table if not exists public.gites (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  url         text not null check (char_length(url) <= 500),
  photo_url   text check (char_length(photo_url) <= 500),
  price       text check (char_length(price) <= 40),
  capacity    int check (capacity between 1 and 50),
  area        text,
  description text check (char_length(description) <= 500),
  added_by    text not null check (char_length(added_by) between 1 and 40),
  created_at  timestamptz not null default now()
);

-- area is free text (was a fixed list): replace the old constraint, also on existing databases.
alter table public.gites drop constraint if exists gites_area_check;
alter table public.gites add constraint gites_area_check check (char_length(area) <= 60);

create table if not exists public.votes (
  gite_id    uuid not null references public.gites(id) on delete cascade,
  voter      text not null check (char_length(voter) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (gite_id, voter)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  gite_id    uuid not null references public.gites(id) on delete cascade,
  author     text not null check (char_length(author) between 1 and 40),
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_gite on public.comments (gite_id);

alter table public.settings     enable row level security;
alter table public.participants enable row level security;
alter table public.responses    enable row level security;
alter table public.gites        enable row level security;
alter table public.votes        enable row level security;
alter table public.comments     enable row level security;

revoke all on public.settings, public.participants, public.responses,
              public.gites, public.votes, public.comments
  from anon, authenticated;

-- ---------------------------------------------------------------- private helpers
-- Errors are raised as 'code' or 'code: detail' and mapped to French messages by the frontend.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.check_pw(pw text, which text default 'group_pw_hash')
returns void language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  select value into h from public.settings where key = which;
  if h is null or pw is null or crypt(pw, h) <> h then
    raise exception 'bad_password';
  end if;
end $$;

create or replace function private.txt(v text, max_len int, field text, required boolean default false)
returns text language plpgsql immutable as $$
begin
  v := nullif(btrim(coalesce(v, '')), '');
  if v is null then
    if required then raise exception 'invalid: % obligatoire', field; end if;
    return null;
  end if;
  if char_length(v) > max_len then
    raise exception 'invalid: % : % caractères max', field, max_len;
  end if;
  return v;
end $$;

create or replace function private.enum_val(v text, allowed text[], field text)
returns text language plpgsql immutable as $$
begin
  v := nullif(v, '');
  if v is not null and not (v = any (allowed)) then
    raise exception 'invalid: %', field;
  end if;
  return v;
end $$;

create or replace function private.url(v text, field text, required boolean default false)
returns text language plpgsql immutable as $$
begin
  v := private.txt(v, 500, field, required);
  if v is not null and v !~* '^https?://\S+$' then
    raise exception 'invalid: % : doit commencer par https://', field;
  end if;
  return v;
end $$;

-- A participant name ('Invité' is reserved).
create or replace function private.person_name(v text)
returns text language plpgsql immutable as $$
begin
  v := private.txt(v, 40, 'prénom', true);
  if lower(v) = lower('Invité') then raise exception 'reserved_name'; end if;
  return v;
end $$;

-- Who votes / comments / adds a gîte: a name, or 'Invité'.
create or replace function private.actor(v text)
returns text language plpgsql immutable as $$
begin
  return private.txt(v, 40, 'nom', true);
end $$;

create or replace function private.find_or_create_participant(p_name text)
returns public.participants language plpgsql security definer set search_path = public as $$
declare p public.participants;
begin
  p_name := private.person_name(p_name);
  select * into p from public.participants where lower(name) = lower(p_name);
  if not found then
    insert into public.participants (name) values (p_name)
    on conflict (lower(name)) do nothing
    returning * into p;
    if p.id is null then
      select * into p from public.participants where lower(name) = lower(p_name);
    end if;
  end if;
  return p;
end $$;

revoke all on all functions in schema private from public, anon, authenticated;

-- ---------------------------------------------------------------- public RPCs

create or replace function public.check_password(pw text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  perform private.check_pw(pw);
  return true;
exception when others then
  return false;
end $$;

create or replace function public.get_all(pw text)
returns json language plpgsql security definer set search_path = public as $$
begin
  perform private.check_pw(pw);
  return json_build_object(
    'participants', coalesce((select json_agg(p order by p.created_at) from public.participants p), '[]'),
    'responses',    coalesce((select json_agg(r order by r.updated_at) from public.responses r), '[]'),
    'gites',        coalesce((select json_agg(g order by g.created_at) from public.gites g), '[]'),
    'votes',        coalesce((select json_agg(v order by v.created_at) from public.votes v), '[]'),
    'comments',     coalesce((select json_agg(c order by c.created_at) from public.comments c), '[]')
  );
end $$;

create or replace function public.add_participant(pw text, p_name text)
returns json language plpgsql security definer set search_path = public as $$
begin
  perform private.check_pw(pw);
  return row_to_json(private.find_or_create_participant(p_name));
end $$;

-- p_fields: {status, days[], all_days, dates_note, ski, teletravail, lieu, voiture, note}
create or replace function public.upsert_response(pw text, p_name text, p_fields jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare
  p public.participants;
  v_days date[];
  r public.responses;
begin
  perform private.check_pw(pw);
  p := private.find_or_create_participant(p_name);

  begin
    select coalesce(array_agg(distinct d::date order by d::date), '{}')
      into v_days
      from jsonb_array_elements_text(coalesce(p_fields->'days', '[]'::jsonb)) as d;
  exception when others then
    raise exception 'invalid: dates';
  end;
  if exists (select 1 from unnest(v_days) d where d < date '2026-12-26' or d > date '2027-01-03') then
    raise exception 'invalid: dates';
  end if;

  insert into public.responses as x (
    participant_id, status, days, all_days, dates_note, ski, teletravail, lieu, voiture, note, updated_at
  ) values (
    p.id,
    private.enum_val(p_fields->>'status', array['in', 'maybe', 'out'], 'statut'),
    v_days,
    coalesce((p_fields->>'all_days')::boolean, false),
    private.txt(p_fields->>'dates_note', 500, 'notes sur les dates'),
    private.enum_val(p_fields->>'ski', array['oui', 'non', 'peu_importe'], 'ski'),
    private.enum_val(p_fields->>'teletravail', array['oui', 'non', 'peu_importe'], 'télétravail'),
    private.enum_val(p_fields->>'lieu', array['chambery', 'aix', 'nature', 'peu_importe'], 'où loger'),
    private.enum_val(p_fields->>'voiture', array['oui', 'non', 'peu_importe'], 'voiture'),
    private.txt(p_fields->>'note', 500, 'un mot'),
    now()
  )
  on conflict (participant_id) do update set
    status = excluded.status, days = excluded.days, all_days = excluded.all_days,
    dates_note = excluded.dates_note, ski = excluded.ski, teletravail = excluded.teletravail,
    lieu = excluded.lieu, voiture = excluded.voiture, note = excluded.note, updated_at = now()
  returning * into r;
  return row_to_json(r);
end $$;

-- p_fields: {name, url, photo_url, price, capacity, area, description}
create or replace function public.add_gite(pw text, p_fields jsonb, p_added_by text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_capacity int;
  g public.gites;
begin
  perform private.check_pw(pw);
  if coalesce(p_fields->>'capacity', '') <> '' then
    begin
      v_capacity := (p_fields->>'capacity')::int;
    exception when others then
      raise exception 'invalid: capacité : entre 1 et 50';
    end;
    if v_capacity not between 1 and 50 then
      raise exception 'invalid: capacité : entre 1 et 50';
    end if;
  end if;

  insert into public.gites (name, url, photo_url, price, capacity, area, description, added_by)
  values (
    private.txt(p_fields->>'name', 120, 'nom', true),
    private.url(p_fields->>'url', 'lien', true),
    private.url(p_fields->>'photo_url', 'photo'),
    private.txt(p_fields->>'price', 40, 'prix'),
    v_capacity,
    private.txt(p_fields->>'area', 60, 'coin'),
    private.txt(p_fields->>'description', 500, 'description'),
    private.actor(p_added_by)
  )
  returning * into g;
  return row_to_json(g);
end $$;

create or replace function public.toggle_vote(pw text, p_gite_id uuid, p_voter text)
returns json language plpgsql security definer set search_path = public as $$
declare v_voter text;
begin
  perform private.check_pw(pw);
  v_voter := private.actor(p_voter);
  if not exists (select 1 from public.gites where id = p_gite_id) then
    raise exception 'not_found';
  end if;
  delete from public.votes where gite_id = p_gite_id and voter = v_voter;
  if found then
    return json_build_object('voted', false);
  end if;
  insert into public.votes (gite_id, voter) values (p_gite_id, v_voter) on conflict do nothing;
  return json_build_object('voted', true);
end $$;

create or replace function public.add_comment(pw text, p_gite_id uuid, p_author text, p_body text)
returns json language plpgsql security definer set search_path = public as $$
declare c public.comments;
begin
  perform private.check_pw(pw);
  if not exists (select 1 from public.gites where id = p_gite_id) then
    raise exception 'not_found';
  end if;
  insert into public.comments (gite_id, author, body)
  values (p_gite_id, private.actor(p_author), private.txt(p_body, 1000, 'commentaire', true))
  returning * into c;
  return row_to_json(c);
end $$;

-- ---------------------------------------------------------------- admin RPCs (used in phase 4)

create or replace function public.admin_check(admin_pw text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  perform private.check_pw(admin_pw, 'admin_pw_hash');
  return true;
exception when others then
  return false;
end $$;

-- p_table: 'gite' | 'comment' | 'participant' | 'response' | 'vote'
-- p_id: the row id (participant id for 'participant' and 'response'); for 'vote', p_voter is required too.
create or replace function public.admin_delete(admin_pw text, p_table text, p_id uuid, p_voter text default null)
returns json language plpgsql security definer set search_path = public as $$
begin
  perform private.check_pw(admin_pw, 'admin_pw_hash');
  case p_table
    when 'gite'        then delete from public.gites where id = p_id;
    when 'comment'     then delete from public.comments where id = p_id;
    when 'participant' then delete from public.participants where id = p_id; -- cascades to the response
    when 'response'    then delete from public.responses where participant_id = p_id;
    when 'vote'        then delete from public.votes where gite_id = p_id and voter = p_voter;
    else raise exception 'invalid: table';
  end case;
  return json_build_object('deleted', found);
end $$;

-- Only the RPCs are callable from the browser.
revoke all on function
  public.check_password(text), public.get_all(text), public.add_participant(text, text),
  public.upsert_response(text, text, jsonb), public.add_gite(text, jsonb, text),
  public.toggle_vote(text, uuid, text), public.add_comment(text, uuid, text, text),
  public.admin_check(text), public.admin_delete(text, text, uuid, text)
  from public;
grant execute on function
  public.check_password(text), public.get_all(text), public.add_participant(text, text),
  public.upsert_response(text, text, jsonb), public.add_gite(text, jsonb, text),
  public.toggle_vote(text, uuid, text), public.add_comment(text, uuid, text, text),
  public.admin_check(text), public.admin_delete(text, text, uuid, text)
  to anon, authenticated;
