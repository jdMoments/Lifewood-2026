-- ==========================================
-- Lifewood Supabase Setup (Clean)
-- Goal:
-- 1) Every new non-admin account is saved to profiles as pending approval.
-- 2) Admin can see/update/delete all profiles for Accept/Decline.
-- 3) Existing auth.users are backfilled into profiles.
-- ==========================================

create extension if not exists "pgcrypto";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  profile_code text unique,
  email text,
  updated_at timestamptz default timezone('utc'::text, now()),
  username text unique,
  full_name text,
  nick_name text,
  avatar_url text,
  phone text,
  position text,
  dob text,
  gender text default 'Male',
  role text default 'applicant',
  level integer default 1,
  efficiency integer default 0,
  is_approved boolean default false,
  is_declined boolean default false,
  evaluation_result text default 'pending',
  evaluation_comment text,
  last_evaluated_at timestamptz,
  country text,
  language text default 'English',
  time_zone text default 'Asia/Taipei',
  grade text default 'N/A',
  current_course text default 'Introduction to AI Solutions',
  completion integer default 0,
  hours_spent integer default 0,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists profile_code text;
alter table public.profiles add column if not exists updated_at timestamptz default timezone('utc'::text, now());
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists nick_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists position text;
alter table public.profiles add column if not exists dob text;
alter table public.profiles add column if not exists gender text default 'Male';
alter table public.profiles add column if not exists role text default 'applicant';
alter table public.profiles add column if not exists level integer default 1;
alter table public.profiles add column if not exists efficiency integer default 0;
alter table public.profiles add column if not exists is_approved boolean default false;
alter table public.profiles add column if not exists is_declined boolean default false;
alter table public.profiles add column if not exists evaluation_result text default 'pending';
alter table public.profiles add column if not exists evaluation_comment text;
alter table public.profiles add column if not exists last_evaluated_at timestamptz;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists language text default 'English';
alter table public.profiles add column if not exists time_zone text default 'Asia/Taipei';
alter table public.profiles add column if not exists grade text default 'N/A';
alter table public.profiles add column if not exists current_course text default 'Introduction to AI Solutions';
alter table public.profiles add column if not exists completion integer default 0;
alter table public.profiles add column if not exists hours_spent integer default 0;
alter table public.profiles add column if not exists created_at timestamptz default timezone('utc'::text, now());
create unique index if not exists profiles_profile_code_key on public.profiles (profile_code) where profile_code is not null;

create sequence if not exists public.profile_code_ph_seq;
create sequence if not exists public.profile_code_emp_seq;

select setval(
  'public.profile_code_ph_seq',
  coalesce(
    (
      select max((substring(profile_code from 3))::integer)
      from public.profiles
      where profile_code ~ '^PH[0-9]+$'
        and coalesce(is_approved, false) = true
        and lower(coalesce(role, 'applicant')) not in ('employee', 'admin')
    ),
    0
  ) + 1,
  false
);

select setval(
  'public.profile_code_emp_seq',
  coalesce(
    (
      select max((substring(profile_code from 4))::integer)
      from public.profiles
      where profile_code ~ '^EMP[0-9]+$'
        and (
          lower(coalesce(role, 'applicant')) = 'admin'
          or (
            lower(coalesce(role, 'applicant')) = 'employee'
            and coalesce(is_approved, false) = true
          )
        )
    ),
    0
  ) + 1,
  false
);

create or replace function public.assign_profile_code_for_role()
returns trigger
language plpgsql
as $$
declare
  normalized_role text := lower(coalesce(new.role, 'applicant'));
  is_approved_now boolean := coalesce(new.is_approved, false);
  was_approved boolean := case when tg_op = 'UPDATE' then coalesce(old.is_approved, false) else false end;
begin
  if normalized_role = 'admin' then
    if coalesce(new.profile_code, '') !~ '^EMP[0-9]+$' then
      new.profile_code := 'EMP' || lpad(nextval('public.profile_code_emp_seq')::text, 4, '0');
    end if;
    return new;
  end if;

  if not is_approved_now then
    -- Keep pending users without permanent PH/EMP code until approval.
    new.profile_code := null;
    return new;
  end if;

  if normalized_role = 'employee' then
    if coalesce(new.profile_code, '') !~ '^EMP[0-9]+$'
      or (tg_op = 'UPDATE' and was_approved = false) then
      new.profile_code := 'EMP' || lpad(nextval('public.profile_code_emp_seq')::text, 4, '0');
    end if;
  else
    if coalesce(new.profile_code, '') !~ '^PH[0-9]+$'
      or (tg_op = 'UPDATE' and was_approved = false) then
      new.profile_code := 'PH' || lpad(nextval('public.profile_code_ph_seq')::text, 4, '0');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_assign_code on public.profiles;
create trigger trg_profiles_assign_code
before insert or update of role, profile_code, is_approved on public.profiles
for each row
execute procedure public.assign_profile_code_for_role();

do $$
declare
  rec record;
begin
  update public.profiles
  set profile_code = null
  where coalesce(is_approved, false) = false
    and lower(coalesce(role, 'applicant')) <> 'admin'
    and profile_code is not null;

  for rec in
    select id
    from public.profiles
    where lower(coalesce(role, 'applicant')) in ('employee', 'admin')
      and (
        lower(coalesce(role, 'applicant')) = 'admin'
        or coalesce(is_approved, false) = true
      )
      and coalesce(profile_code, '') !~ '^EMP[0-9]+$'
    order by created_at asc nulls last, id asc
  loop
    update public.profiles
    set profile_code = 'EMP' || lpad(nextval('public.profile_code_emp_seq')::text, 4, '0')
    where id = rec.id;
  end loop;

  for rec in
    select id
    from public.profiles
    where lower(coalesce(role, 'applicant')) not in ('employee', 'admin')
      and coalesce(is_approved, false) = true
      and coalesce(profile_code, '') !~ '^PH[0-9]+$'
    order by created_at asc nulls last, id asc
  loop
    update public.profiles
    set profile_code = 'PH' || lpad(nextval('public.profile_code_ph_seq')::text, 4, '0')
    where id = rec.id;
  end loop;
end $$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'intern', 'employee', 'applicant', 'User', 'Intern', 'Employee'));

alter table public.profiles drop constraint if exists profiles_evaluation_result_check;
alter table public.profiles
  add constraint profiles_evaluation_result_check
  check (evaluation_result in ('pending', 'pass', 'fail'));

alter table public.profiles enable row level security;

-- ==========================================
-- 2. PROFILE POLICIES
-- ==========================================
create or replace function public.is_admin_request()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
    in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com');
$$;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
for select using (
  public.is_admin_request()
);

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles" on public.profiles
for update using (
  public.is_admin_request()
)
with check (
  public.is_admin_request()
);

drop policy if exists "Admins can delete all profiles" on public.profiles;
create policy "Admins can delete all profiles" on public.profiles
for delete using (
  public.is_admin_request()
);

-- ==========================================
-- 3. APPLICATIONS TABLE + RLS
-- ==========================================
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  age integer,
  degree text,
  project_applied text not null,
  experience text,
  phone text,
  portfolio_url text,
  cv_url text,
  interview_at timestamptz,
  status text default 'pending' not null
);

alter table public.applications add column if not exists created_at timestamptz default timezone('utc'::text, now());
alter table public.applications add column if not exists first_name text;
alter table public.applications add column if not exists last_name text;
alter table public.applications add column if not exists email text;
alter table public.applications add column if not exists age integer;
alter table public.applications add column if not exists degree text;
alter table public.applications add column if not exists project_applied text;
alter table public.applications add column if not exists experience text;
alter table public.applications add column if not exists phone text;
alter table public.applications add column if not exists portfolio_url text;
alter table public.applications add column if not exists cv_url text;
alter table public.applications add column if not exists interview_at timestamptz;
alter table public.applications add column if not exists status text default 'pending';

create or replace function public.application_email_exists(candidate_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where lower(trim(coalesce(a.email, ''))) = lower(trim(coalesce(candidate_email, '')))
  );
$$;

grant execute on function public.application_email_exists(text) to anon, authenticated;

create or replace function public.prevent_duplicate_application_email()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(new.email, '')));
begin
  if normalized_email = '' then
    return new;
  end if;

  if exists (
    select 1
    from public.applications a
    where lower(trim(coalesce(a.email, ''))) = normalized_email
      and (tg_op = 'INSERT' or a.id <> new.id)
  ) then
    raise exception 'Email is Already Exist' using errcode = '23505';
  end if;

  new.email := normalized_email;
  return new;
end;
$$;

drop trigger if exists trg_applications_prevent_duplicate_email on public.applications;
create trigger trg_applications_prevent_duplicate_email
before insert or update of email on public.applications
for each row
execute function public.prevent_duplicate_application_email();

alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications
  add constraint applications_status_check
  check (status in ('pending', 'accepted', 'declined', 'hired', 'archived'));

alter table public.applications enable row level security;

drop policy if exists "Public can submit applications" on public.applications;
create policy "Public can submit applications" on public.applications
for insert
with check (true);

drop policy if exists "Admins can view applications" on public.applications;
create policy "Admins can view applications" on public.applications
for select
using (public.is_admin_request());

drop policy if exists "Admins can update applications" on public.applications;
create policy "Admins can update applications" on public.applications
for update
using (public.is_admin_request())
with check (public.is_admin_request());

drop policy if exists "Admins can delete applications" on public.applications;
create policy "Admins can delete applications" on public.applications
for delete
using (public.is_admin_request());

-- ==========================================
-- 4. PROJECT SUBMISSIONS TABLE + RLS
-- ==========================================
do $$
begin
  if to_regclass('public.project_submissions') is null
     and to_regclass('public.project_submission') is not null then
    execute 'alter table public.project_submission rename to project_submissions';
  end if;
end $$;

create table if not exists public.project_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete set null,
  full_name text not null,
  email text not null,
  contact_number text not null,
  project_name text not null,
  description text not null,
  project_link text,
  resource_link text,
  uploaded_file_name text,
  main_ai_need text not null,
  status text default 'pending' not null
);

alter table public.project_submissions add column if not exists created_at timestamptz default timezone('utc'::text, now());
alter table public.project_submissions add column if not exists user_id uuid references auth.users on delete set null;
alter table public.project_submissions add column if not exists full_name text;
alter table public.project_submissions add column if not exists email text;
alter table public.project_submissions add column if not exists contact_number text;
alter table public.project_submissions add column if not exists project_name text;
alter table public.project_submissions add column if not exists description text;
alter table public.project_submissions add column if not exists project_link text;
alter table public.project_submissions add column if not exists resource_link text;
alter table public.project_submissions add column if not exists uploaded_file_name text;
alter table public.project_submissions add column if not exists main_ai_need text;
alter table public.project_submissions add column if not exists status text default 'pending';

alter table public.project_submissions drop constraint if exists project_submissions_status_check;
alter table public.project_submissions
  add constraint project_submissions_status_check
  check (status in ('pending', 'accepted', 'declined'));

alter table public.project_submissions enable row level security;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.project_submissions';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end $$;

drop policy if exists "Public can submit project submissions" on public.project_submissions;
create policy "Public can submit project submissions" on public.project_submissions
for insert
with check (true);

drop policy if exists "Admins can view project submissions" on public.project_submissions;
create policy "Admins can view project submissions" on public.project_submissions
for select
using (public.is_admin_request());

drop policy if exists "Admins can update project submissions" on public.project_submissions;
create policy "Admins can update project submissions" on public.project_submissions
for update
using (public.is_admin_request())
with check (public.is_admin_request());

drop policy if exists "Admins can delete project submissions" on public.project_submissions;
create policy "Admins can delete project submissions" on public.project_submissions
for delete
using (public.is_admin_request());

-- ==========================================
-- 5. CONTACT MESSAGES TABLES + RLS (INBOX)
-- ==========================================
create table if not exists public.inbox_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  name text,
  email text,
  message text,
  source_table text default 'contact_us',
  source_id text
);

alter table public.inbox_messages add column if not exists created_at timestamptz default timezone('utc'::text, now());
alter table public.inbox_messages add column if not exists name text;
alter table public.inbox_messages add column if not exists email text;
alter table public.inbox_messages add column if not exists message text;
alter table public.inbox_messages add column if not exists source_table text default 'contact_us';
alter table public.inbox_messages add column if not exists source_id text;
alter table public.inbox_messages enable row level security;

create unique index if not exists inbox_messages_source_key on public.inbox_messages (source_table, source_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.inbox_messages';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end $$;

drop policy if exists "Public can submit inbox messages" on public.inbox_messages;
create policy "Public can submit inbox messages" on public.inbox_messages
for insert
with check (true);

drop policy if exists "Authenticated can view inbox messages" on public.inbox_messages;
create policy "Authenticated can view inbox messages" on public.inbox_messages
for select
using (auth.role() = 'authenticated');

drop policy if exists "Admins can update inbox messages" on public.inbox_messages;
create policy "Admins can update inbox messages" on public.inbox_messages
for update
using (public.is_admin_request())
with check (public.is_admin_request());

drop policy if exists "Admins can delete inbox messages" on public.inbox_messages;
create policy "Admins can delete inbox messages" on public.inbox_messages
for delete
using (public.is_admin_request());

grant insert on table public.inbox_messages to anon, authenticated;
grant select, update, delete on table public.inbox_messages to authenticated;

-- Legacy contact table migration and cleanup
do $$
begin
  if to_regclass('public.contact_messages') is not null then
    insert into public.inbox_messages (name, email, message, created_at, source_table, source_id)
    select
      cm.name,
      cm.email,
      cm.message,
      cm.created_at,
      'contact_messages',
      cm.id::text
    from public.contact_messages cm
    where cm.id is not null
    on conflict (source_table, source_id) do nothing;
  end if;

  if to_regclass('public.contact_message') is not null then
    insert into public.inbox_messages (name, email, message, created_at, source_table, source_id)
    select
      cm.name,
      cm.email,
      cm.message,
      cm.created_at,
      'contact_message',
      cm.id::text
    from public.contact_message cm
    where cm.id is not null
    on conflict (source_table, source_id) do nothing;
  end if;
end $$;

drop function if exists public.copy_contact_to_inbox_messages();

drop table if exists public.contact_message cascade;
drop table if exists public.contact_messages cascade;


-- ==========================================
-- 6. PROFILE SELF-HEAL RPC
-- ==========================================
create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  jwt_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  full_name text;
  first_name text;
  last_name text;
begin
  if current_user_id is null then
    return;
  end if;

  first_name := nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'first_name', '')), '');
  last_name := nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'last_name', '')), '');
  full_name := coalesce(
    nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '')), ''),
    nullif(trim(concat_ws(' ', first_name, last_name)), ''),
    nullif(split_part(jwt_email, '@', 1), ''),
    'User'
  );

  insert into public.profiles (
    id, email, full_name, phone, dob, role, is_approved, is_declined, created_at, updated_at
  )
  values (
    current_user_id,
    jwt_email,
    full_name,
    nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'phone', '')), ''),
    nullif(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'dob', '')), ''),
    case
      when jwt_email in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com') then 'admin'
      when lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) in ('intern', 'employee')
        then lower(auth.jwt() -> 'user_metadata' ->> 'role')
      else 'intern'
    end,
    case
      when jwt_email in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com') then true
      else false
    end,
    false,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated;

-- ==========================================
-- 6. SIGNUP TRIGGER
-- ==========================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, avatar_url, phone, dob, role, is_approved, is_declined, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(concat_ws(' ', new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name')), ''),
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'dob',
    case
      when lower(coalesce(new.email, '')) in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com') then 'admin'
      when lower(coalesce(new.raw_user_meta_data->>'role', '')) in ('intern', 'employee')
        then lower(new.raw_user_meta_data->>'role')
      else 'intern'
    end,
    case
      when lower(coalesce(new.email, '')) in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com') then true
      else false
    end,
    false,
    coalesce(new.created_at, timezone('utc'::text, now())),
    timezone('utc'::text, now())
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    phone = excluded.phone,
    dob = excluded.dob,
    role = case
      when public.profiles.is_approved = true then public.profiles.role
      else excluded.role
    end,
    is_approved = case
      when public.profiles.is_approved = true then true
      else excluded.is_approved
    end,
    updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

do $$
declare t record;
begin
  for t in
    select tr.tgname
    from pg_trigger tr
    join pg_proc p on p.oid = tr.tgfoid
    where tr.tgrelid = 'auth.users'::regclass
      and not tr.tgisinternal
      and p.proname = 'handle_new_user'
  loop
    execute format('drop trigger if exists %I on auth.users', t.tgname);
  end loop;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ==========================================
-- 7. BACKFILL ALL EXISTING AUTH USERS
-- ==========================================
insert into public.profiles (
  id, email, full_name, avatar_url, phone, dob, role, is_approved, is_declined, created_at, updated_at
)
select
  u.id,
  u.email,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name')), ''),
    split_part(u.email, '@', 1)
  ),
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'phone',
  u.raw_user_meta_data->>'dob',
  case
    when lower(coalesce(u.email, '')) in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com') then 'admin'
    when lower(coalesce(u.raw_user_meta_data->>'role', '')) in ('intern', 'employee')
      then lower(u.raw_user_meta_data->>'role')
    else 'intern'
  end,
  case
    when lower(coalesce(u.email, '')) in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com') then true
    else false
  end,
  false,
  coalesce(u.created_at, timezone('utc'::text, now())),
  timezone('utc'::text, now())
from auth.users u
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
  phone = coalesce(public.profiles.phone, excluded.phone),
  dob = coalesce(public.profiles.dob, excluded.dob),
  role = case
    when lower(coalesce(excluded.email, '')) in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com') then 'admin'
    when coalesce(public.profiles.is_approved, false) = true then coalesce(public.profiles.role, 'intern')
    when lower(coalesce(public.profiles.role, '')) in ('intern', 'employee') then lower(public.profiles.role)
    else excluded.role
  end,
  is_approved = case
    when lower(coalesce(excluded.email, '')) in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com') then true
    else coalesce(public.profiles.is_approved, false)
  end,
  updated_at = timezone('utc'::text, now());

-- ==========================================
-- 8. FORCE ADMIN ACCOUNT(S)
-- ==========================================
update public.profiles
set role = 'admin', is_approved = true, updated_at = timezone('utc'::text, now())
where lower(email) in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com');

-- ==========================================
-- 9. SETTINGS HISTORY + SECURITY LOG TABLES
-- ==========================================
create table if not exists public.admin_account_history (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  action text default 'deleted' not null,
  source text default 'application' not null,
  reference_id uuid,
  full_name text,
  email text,
  notes text,
  acted_by uuid references auth.users on delete set null
);

alter table public.admin_account_history add column if not exists created_at timestamptz default timezone('utc'::text, now());
alter table public.admin_account_history add column if not exists action text default 'deleted';
alter table public.admin_account_history add column if not exists source text default 'application';
alter table public.admin_account_history add column if not exists reference_id uuid;
alter table public.admin_account_history add column if not exists full_name text;
alter table public.admin_account_history add column if not exists email text;
alter table public.admin_account_history add column if not exists notes text;
alter table public.admin_account_history add column if not exists acted_by uuid references auth.users on delete set null;

alter table public.admin_account_history drop constraint if exists admin_account_history_action_check;
alter table public.admin_account_history
  add constraint admin_account_history_action_check
  check (action in ('archived', 'deleted'));

alter table public.admin_account_history enable row level security;

drop policy if exists "Admins can view account history" on public.admin_account_history;
create policy "Admins can view account history" on public.admin_account_history
for select using (public.is_admin_request());

drop policy if exists "Admins can insert account history" on public.admin_account_history;
create policy "Admins can insert account history" on public.admin_account_history
for insert with check (public.is_admin_request());

drop policy if exists "Admins can delete account history" on public.admin_account_history;
create policy "Admins can delete account history" on public.admin_account_history
for delete using (public.is_admin_request());

create table if not exists public.admin_project_history (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  action text default 'deleted' not null,
  source_table text default 'project_submissions',
  reference_id uuid,
  full_name text,
  email text,
  project_name text,
  notes text,
  acted_by uuid references auth.users on delete set null
);

alter table public.admin_project_history add column if not exists created_at timestamptz default timezone('utc'::text, now());
alter table public.admin_project_history add column if not exists action text default 'deleted';
alter table public.admin_project_history add column if not exists source_table text default 'project_submissions';
alter table public.admin_project_history add column if not exists reference_id uuid;
alter table public.admin_project_history add column if not exists full_name text;
alter table public.admin_project_history add column if not exists email text;
alter table public.admin_project_history add column if not exists project_name text;
alter table public.admin_project_history add column if not exists notes text;
alter table public.admin_project_history add column if not exists acted_by uuid references auth.users on delete set null;

alter table public.admin_project_history drop constraint if exists admin_project_history_action_check;
alter table public.admin_project_history
  add constraint admin_project_history_action_check
  check (action in ('declined', 'deleted'));

alter table public.admin_project_history enable row level security;

drop policy if exists "Admins can view project history" on public.admin_project_history;
create policy "Admins can view project history" on public.admin_project_history
for select using (public.is_admin_request());

drop policy if exists "Admins can insert project history" on public.admin_project_history;
create policy "Admins can insert project history" on public.admin_project_history
for insert with check (public.is_admin_request());

drop policy if exists "Admins can delete project history" on public.admin_project_history;
create policy "Admins can delete project history" on public.admin_project_history
for delete using (public.is_admin_request());

create table if not exists public.admin_login_activity (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete set null,
  user_email text,
  device_type text,
  browser text,
  os text,
  user_agent text,
  login_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.admin_login_activity add column if not exists created_at timestamptz default timezone('utc'::text, now());
alter table public.admin_login_activity add column if not exists user_id uuid references auth.users on delete set null;
alter table public.admin_login_activity add column if not exists user_email text;
alter table public.admin_login_activity add column if not exists device_type text;
alter table public.admin_login_activity add column if not exists browser text;
alter table public.admin_login_activity add column if not exists os text;
alter table public.admin_login_activity add column if not exists user_agent text;
alter table public.admin_login_activity add column if not exists login_at timestamptz default timezone('utc'::text, now());

alter table public.admin_login_activity enable row level security;

drop policy if exists "Admins can view login activity" on public.admin_login_activity;
create policy "Admins can view login activity" on public.admin_login_activity
for select using (public.is_admin_request());

drop policy if exists "Authenticated can insert own login activity" on public.admin_login_activity;
create policy "Authenticated can insert own login activity" on public.admin_login_activity
for insert
with check (
  auth.uid() = user_id
  or public.is_admin_request()
);

drop policy if exists "Admins can delete login activity" on public.admin_login_activity;
create policy "Admins can delete login activity" on public.admin_login_activity
for delete using (public.is_admin_request());

-- ==========================================
-- 10. VERIFICATION
-- ==========================================
select id, profile_code, email, role, is_approved, created_at
from public.profiles
order by created_at desc nulls last;

select id, first_name, last_name, email, phone, project_applied, cv_url, interview_at, status, created_at
from public.applications
order by created_at desc nulls last;

select id, full_name, email, project_name, status, created_at
from public.project_submissions
order by created_at desc nulls last;

select id, name, email, message, created_at, source_table, source_id
from public.inbox_messages
order by created_at desc nulls last;

select id, profile_code, email, role, is_approved
from public.profiles
where coalesce(is_approved, false) = false
  and coalesce(is_declined, false) = false
  and lower(coalesce(email, '')) not in ('damayojholmer@gmail.com', 'jholmerdamayo@gmail.com')
order by created_at desc nulls last;

select id, action, source, full_name, email, created_at
from public.admin_account_history
order by created_at desc nulls last;

select id, action, project_name, full_name, email, created_at
from public.admin_project_history
order by created_at desc nulls last;

select id, user_email, device_type, browser, os, login_at
from public.admin_login_activity
order by login_at desc nulls last;

-- ==========================================
-- 11. RESUME STORAGE BUCKET + POLICIES
-- ==========================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-resumes',
  'application-resumes',
  true,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can upload application resumes" on storage.objects;
create policy "Public can upload application resumes" on storage.objects
for insert
to public
with check (bucket_id = 'application-resumes');

drop policy if exists "Public can view application resumes" on storage.objects;
create policy "Public can view application resumes" on storage.objects
for select
to public
using (bucket_id = 'application-resumes');

drop policy if exists "Admins can delete application resumes" on storage.objects;
create policy "Admins can delete application resumes" on storage.objects
for delete
to authenticated
using (
  bucket_id = 'application-resumes'
  and public.is_admin_request()
);
