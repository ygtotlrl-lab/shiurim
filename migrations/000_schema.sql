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

create table if not exists public.s_users (
  client_id text not null,
  login text not null,
  full_name text not null,
  role text not null,
  active boolean not null default true,
  notify boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at bigint not null,
  constraint s_users_pkey PRIMARY KEY (client_id),
  constraint s_users_login_key UNIQUE (login),
  constraint s_users_login_check CHECK ((login = lower(login))),
  constraint s_users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'manager'::text, 'junior'::text])))
);

CREATE OR REPLACE FUNCTION public.s_is_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists (select 1 from public.s_users u where u.login = lower(auth.jwt() ->> 'email') and u.active) $function$;
revoke all on function public.s_is_user() from public, anon, authenticated, service_role;
grant execute on function public.s_is_user() to authenticated, service_role;

-- revoke לפני grant — GRANT מוסיף ואינו מחליף, וטבלה חדשה ב-Supabase נולדת עם DELETE ו-TRUNCATE ל-anon.
revoke all on table public.s_settings from anon, authenticated;
grant select, insert, update on table public.s_settings to anon, authenticated;
grant all on table public.s_settings to service_role;
revoke all on table public.s_users from anon, authenticated;
grant select on table public.s_users to authenticated;
grant all on table public.s_users to service_role;

alter table public.s_settings enable row level security;
drop policy if exists s_settings_users on public.s_settings;
create policy s_settings_users on public.s_settings as permissive for all to authenticated using (s_is_user()) with check (s_is_user());
alter table public.s_users enable row level security;
drop policy if exists s_users_select on public.s_users;
create policy s_users_select on public.s_users as permissive for select to authenticated using (s_is_user());

drop trigger if exists s_settings_history on public.s_settings;
create trigger s_settings_history AFTER INSERT OR DELETE OR UPDATE ON public.s_settings FOR EACH ROW EXECUTE FUNCTION sh_history_log('key');
drop trigger if exists s_users_history on public.s_users;
create trigger s_users_history AFTER INSERT OR DELETE OR UPDATE ON public.s_users FOR EACH ROW EXECUTE FUNCTION sh_history_log('client_id');
