-- migrations/000_schema.sql — שיעורים: הסכימה החיה

-- ── שיעורים ──

create table if not exists public.s_settings (
  key text not null,
  value text,
  updated_at bigint not null,
  client_id text,
  deleted boolean not null default false,
  deleted_at timestamp with time zone,
  deleted_by text,
  constraint s_settings_pkey PRIMARY KEY (key),
  constraint s_settings_value_json CHECK (((value IS NULL) OR ((value)::jsonb IS NOT NULL)))
);

-- revoke לפני grant — GRANT מוסיף ואינו מחליף, וטבלה חדשה ב-Supabase נולדת עם DELETE ו-TRUNCATE ל-anon.
revoke all on table public.s_settings from anon, authenticated;
grant select, insert, update on table public.s_settings to anon, authenticated;
grant all on table public.s_settings to service_role;

alter table public.s_settings enable row level security;
drop policy if exists s_settings_all on public.s_settings;
create policy s_settings_all on public.s_settings as permissive for all to anon, authenticated using (true) with check (true);
