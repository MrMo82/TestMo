-- Phase 3: project ownership, membership, and environments.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_key text not null unique check (project_key ~ '^[A-Z][A-Z0-9_-]{1,31}$'),
  name text not null check (length(trim(name)) between 1 and 160),
  description text not null default '',
  goal text not null default '',
  test_object text not null default '',
  release text not null default '',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('Project Owner', 'Test Designer', 'Tester', 'Reviewer', 'Viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id)
);

create table public.project_environments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  base_url text not null default '',
  description text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, name)
);

create index projects_owner_id_idx on public.projects(owner_id);
create index project_members_user_id_idx on public.project_members(user_id);
create index project_environments_project_id_idx on public.project_environments(project_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  );
$$;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.project_members
    where project_id = target_project_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_project_role(target_project_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.project_members
    where project_id = target_project_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.add_project_owner_membership()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'Project Owner');
  return new;
end;
$$;

create trigger projects_add_owner_membership
  after insert on public.projects
  for each row execute procedure public.add_project_owner_membership();

create or replace function public.set_project_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger projects_set_updated_at before update on public.projects
  for each row execute procedure public.set_project_updated_at();
create trigger project_members_set_updated_at before update on public.project_members
  for each row execute procedure public.set_project_updated_at();
create trigger project_environments_set_updated_at before update on public.project_environments
  for each row execute procedure public.set_project_updated_at();

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_environments enable row level security;

create policy "Members can read projects"
  on public.projects for select to authenticated
  using (public.is_project_member(id));
create policy "Users can create owned projects"
  on public.projects for insert to authenticated
  with check (auth.uid() = owner_id);
create policy "Owners can update projects"
  on public.projects for update to authenticated
  using (public.has_project_role(id, array['Project Owner']))
  with check (public.has_project_role(id, array['Project Owner']));

create policy "Members can read project memberships"
  on public.project_members for select to authenticated
  using (public.is_project_member(project_id));
create policy "Owners can manage project memberships"
  on public.project_members for insert to authenticated
  with check (public.has_project_role(project_id, array['Project Owner']));
create policy "Owners can update project memberships"
  on public.project_members for update to authenticated
  using (public.has_project_role(project_id, array['Project Owner']))
  with check (public.has_project_role(project_id, array['Project Owner']));
create policy "Owners can remove project memberships"
  on public.project_members for delete to authenticated
  using (public.has_project_role(project_id, array['Project Owner']));

create policy "Members can read environments"
  on public.project_environments for select to authenticated
  using (public.is_project_member(project_id));
create policy "Designers can create environments"
  on public.project_environments for insert to authenticated
  with check (public.has_project_role(project_id, array['Project Owner', 'Test Designer']));
create policy "Designers can update environments"
  on public.project_environments for update to authenticated
  using (public.has_project_role(project_id, array['Project Owner', 'Test Designer']))
  with check (public.has_project_role(project_id, array['Project Owner', 'Test Designer']));
create policy "Owners can delete environments"
  on public.project_environments for delete to authenticated
  using (public.has_project_role(project_id, array['Project Owner']));

comment on table public.project_members is 'Project-scoped roles; access is enforced by membership RLS, not client metadata.';
