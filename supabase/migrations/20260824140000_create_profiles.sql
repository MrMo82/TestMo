-- Phase 2: Auth profiles. Roles are controlled by trusted server-side workflows.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  name text not null default 'Benutzer',
  role text not null default 'Viewer' check (role in ('Admin', 'Project Owner', 'Test Designer', 'Tester', 'Reviewer', 'Viewer')),
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (username)
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, 'Benutzer'), '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

comment on table public.profiles is 'Application profile linked one-to-one to auth.users; role changes require trusted administration.';
