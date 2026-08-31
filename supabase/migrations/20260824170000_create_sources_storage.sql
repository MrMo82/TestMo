-- Phase 4: project-scoped source metadata and private Storage bucket.
insert into storage.buckets (id, name, public)
values ('project-sources', 'project-sources', false)
on conflict (id) do update set public = false;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  original_file_name text not null check (length(trim(original_file_name)) between 1 and 255),
  mime_type text not null,
  source_type text not null check (source_type in ('docx', 'pdf', 'xlsx', 'csv', 'txt', 'json', 'openapi', 'image', 'link', 'text')),
  version integer not null default 1 check (version > 0),
  approval_status text not null default 'draft' check (approval_status in ('draft', 'in_review', 'approved', 'rejected', 'obsolete')),
  authority_level text not null default 'proposed' check (authority_level in ('proposed', 'confirmed', 'authoritative')),
  extraction_status text not null default 'not_started' check (extraction_status in ('not_started', 'queued', 'processing', 'completed', 'failed', 'not_applicable')),
  storage_path text,
  source_url text,
  checksum text,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  uploaded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, checksum)
);

create index sources_project_id_idx on public.sources(project_id);
create index sources_project_status_idx on public.sources(project_id, approval_status, extraction_status);
create index sources_checksum_idx on public.sources(checksum);

alter table public.sources enable row level security;

create policy "Members can read project sources"
  on public.sources for select to authenticated
  using (public.is_project_member(project_id));
create policy "Designers can upload project sources"
  on public.sources for insert to authenticated
  with check (
    auth.uid() = uploaded_by
    and public.has_project_role(project_id, array['Project Owner', 'Test Designer'])
  );
create policy "Designers can update project sources"
  on public.sources for update to authenticated
  using (public.has_project_role(project_id, array['Project Owner', 'Test Designer']))
  with check (public.has_project_role(project_id, array['Project Owner', 'Test Designer']));
create policy "Owners can delete project sources"
  on public.sources for delete to authenticated
  using (public.has_project_role(project_id, array['Project Owner']));

create or replace function public.storage_project_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return split_part(object_name, '/', 1)::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create policy "Members can read project source files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-sources'
    and public.is_project_member(public.storage_project_id(name))
  );
create policy "Designers can upload project source files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-sources'
    and public.has_project_role(public.storage_project_id(name), array['Project Owner', 'Test Designer'])
  );
create policy "Owners can delete project source files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-sources'
    and public.has_project_role(public.storage_project_id(name), array['Project Owner'])
  );

create trigger sources_set_updated_at before update on public.sources
  for each row execute procedure public.set_project_updated_at();

comment on table public.sources is 'Project-scoped source metadata; file content is stored in the private project-sources bucket.';
