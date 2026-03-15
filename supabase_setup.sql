-- ==========================================
-- 1. SETUP EXTENSIONS
-- ==========================================
create extension if not exists "pgcrypto";

-- ==========================================
-- 2. USER PROFILES
-- ==========================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  username text unique,
  full_name text,
  avatar_url text,
  role text default 'applicant' check (role in ('admin', 'intern', 'employee', 'applicant', 'User', 'Intern', 'Employee')),
  level integer default 1,
  efficiency integer default 0,
  is_approved boolean default false,
  country text,
  grade text default 'N/A',
  current_course text default 'Introduction to AI Solutions',
  completion integer default 0,
  hours_spent integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure columns exist if table was created previously
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_approved boolean default false;
alter table public.profiles add column if not exists role text default 'applicant';
alter table public.profiles add column if not exists grade text default 'N/A';
alter table public.profiles add column if not exists current_course text default 'Introduction to AI Solutions';
alter table public.profiles add column if not exists completion integer default 0;
alter table public.profiles add column if not exists hours_spent integer default 0;
alter table public.profiles add column if not exists efficiency integer default 0;
alter table public.profiles add column if not exists level integer default 1;

-- Sync existing emails from Auth to Profiles
update public.profiles
set email = auth.users.email
from auth.users
where public.profiles.id = auth.users.id
and public.profiles.email is null;

alter table public.profiles enable row level security;

-- Profile Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select 
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ==========================================
-- 3. APPLICATIONS
-- ==========================================
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  age integer,
  degree text,
  project_applied text not null,
  experience text,
  resume_url text,
  status text default 'pending' check (status in ('pending','reviewed','accepted','rejected'))
);

alter table public.applications enable row level security;

-- Public Submission Policies
drop policy if exists "Allow public to submit applications" on public.applications;
create policy "Allow public to submit applications" on public.applications for insert to public with check (true);

-- Admin View Policies
drop policy if exists "Allow admins to view applications" on public.applications;
create policy "Allow admins to view applications" on public.applications for select to authenticated 
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ==========================================
-- 4. USER GOALS
-- ==========================================
create table if not exists public.user_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  target_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_goals enable row level security;

drop policy if exists "Users can manage own goals" on public.user_goals;
create policy "Users can manage own goals" on public.user_goals for all using (auth.uid() = user_id);

-- ==========================================
-- 5. CONTACT MESSAGES
-- ==========================================
create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message" on public.contact_messages for insert with check (true);

-- ==========================================
-- 6. AUTOMATION (Trigger)
-- ==========================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, role, is_approved)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    case when new.email = 'damayojholmer@gmail.com' then 'admin' else 'applicant' end,
    case when new.email = 'damayojholmer@gmail.com' then true else false end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ==========================================
-- 7. ADMIN PERMISSIONS
-- ==========================================
update public.profiles 
set role = 'admin', is_approved = true 
where email = 'damayojholmer@gmail.com';

-- ==========================================
-- 8. DATA AUDIT (Verification)
-- ==========================================
select p.full_name, p.email, p.role, p.is_approved 
from public.profiles p
order by p.role desc;


