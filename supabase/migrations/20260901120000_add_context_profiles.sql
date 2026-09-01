-- Hays-Kontextmodell: Kontextprofile, Data Dictionary, kontrollierte Wertelisten,
-- Terminologie-/Routingregeln sowie projektbezogene Kontextauswahl.
-- Additiv und rueckwaertskompatibel: bestehende `projects`-Zeilen ohne Eintrag in
-- `project_context_selections` bleiben unveraendert lesbar und nutzbar (siehe AC-02).
--
-- Rollback: siehe docs/hays-context-profile.md ("Rollback der Migration").

-- 1. Kontextprofile (Organisations-/Domänenkataloge, z.B. "Allgemein", "Hays Talent Delivery")
create table public.context_profiles (
  id text primary key,
  organization text not null,
  name text not null,
  version text not null default '1.0.0',
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  systems jsonb not null default '[]'::jsonb,
  processes jsonb not null default '[]'::jsonb,
  evidence_types text[] not null default '{}',
  qa_rules text[] not null default '{}',
  forbidden_terms text[] not null default '{}',
  data_dictionary_versions text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 2. Data-Dictionary-Einträge (versioniert je Kontextprofil)
create table public.data_dictionary_entries (
  id text primary key,
  context_profile_id text not null references public.context_profiles(id) on delete cascade,
  data_dictionary_version text not null,
  domain text not null,
  display_name text not null,
  technical_name text not null,
  prefix text,
  source_system text,
  target_system text,
  target_field text,
  description text not null default '',
  allowed_values text[],
  required_rule text,
  validation_rule text,
  confirmation_status text not null default 'Review Required' check (confirmation_status in ('Confirmed', 'Review Required', 'Deprecated')),
  usage_notes text,
  source_reference text,
  active boolean not null default true,
  applicable_processes text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 3. Kontrollierte Wertelisten (Dropdown-Katalog, versioniert)
create table public.controlled_value_sets (
  key text not null,
  version text not null,
  label text not null,
  values text[] not null default '{}',
  multi_select boolean not null default false,
  required boolean not null default false,
  applicable_projects text[] not null default '{}',
  confirmation_status text not null default 'Review Required' check (confirmation_status in ('Confirmed', 'Review Required', 'Deprecated')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (key, version)
);

-- 4. Terminologieregeln (verbotene/zu ersetzende Begriffe je Kontextprofil)
create table public.terminology_rules (
  id text primary key,
  context_profile_id text not null references public.context_profiles(id) on delete cascade,
  forbidden_term text not null,
  replacement_guidance text not null,
  context_condition text,
  severity text not null default 'warning' check (severity in ('error', 'warning', 'info')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 5. Routingregeln (fachliche Zielwege je Prozess)
create table public.routing_rules (
  id text primary key,
  context_profile_id text not null references public.context_profiles(id) on delete cascade,
  process_key text not null,
  description text not null,
  target_mailbox text,
  target_spool_label text,
  mandatory_rule text,
  confirmation_status text not null default 'Review Required' check (confirmation_status in ('Confirmed', 'Review Required', 'Deprecated')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 6. Projektbezogene Kontextauswahl (1:1 zu projects; additive Erweiterung ohne Schema-Bruch)
create table public.project_context_selections (
  project_id uuid primary key references public.projects(id) on delete cascade,
  context_profile_id text references public.context_profiles(id) on delete set null,
  project_type text,
  data_dictionary_version text,
  fix_version text,
  selected_systems text[] not null default '{}',
  selected_environments text[] not null default '{}',
  selected_processes text[] not null default '{}',
  selected_evidence_types text[] not null default '{}',
  business_owner text,
  technical_owner text,
  strict_qa_contract boolean not null default true,
  default_artifact_mode text not null default 'auto' check (default_artifact_mode in ('auto', 'testcase', 'draft_backlog')),
  custom_qa_instruction text,
  forbidden_terms text[] not null default '{}',
  approved_routing_keys text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index data_dictionary_entries_profile_idx on public.data_dictionary_entries(context_profile_id, data_dictionary_version);
create index terminology_rules_profile_idx on public.terminology_rules(context_profile_id);
create index routing_rules_profile_idx on public.routing_rules(context_profile_id);
create index project_context_selections_profile_idx on public.project_context_selections(context_profile_id);

create trigger context_profiles_set_updated_at before update on public.context_profiles
  for each row execute procedure public.set_project_updated_at();
create trigger data_dictionary_entries_set_updated_at before update on public.data_dictionary_entries
  for each row execute procedure public.set_project_updated_at();
create trigger controlled_value_sets_set_updated_at before update on public.controlled_value_sets
  for each row execute procedure public.set_project_updated_at();
create trigger terminology_rules_set_updated_at before update on public.terminology_rules
  for each row execute procedure public.set_project_updated_at();
create trigger routing_rules_set_updated_at before update on public.routing_rules
  for each row execute procedure public.set_project_updated_at();
create trigger project_context_selections_set_updated_at before update on public.project_context_selections
  for each row execute procedure public.set_project_updated_at();

alter table public.context_profiles enable row level security;
alter table public.data_dictionary_entries enable row level security;
alter table public.controlled_value_sets enable row level security;
alter table public.terminology_rules enable row level security;
alter table public.routing_rules enable row level security;
alter table public.project_context_selections enable row level security;

-- Kataloge (Profile, Dictionary, kontrollierte Werte, Terminologie-/Routingregeln) enthalten
-- ausschliesslich konfigurative Referenzdaten (keine Bewerber-/Projektdaten) und sind daher fuer
-- alle authentifizierten Nutzer lesbar. Schreibzugriff bleibt Admins vorbehalten.
create policy "Authenticated users can read context profiles"
  on public.context_profiles for select to authenticated using (true);
create policy "Admins can manage context profiles"
  on public.context_profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Authenticated users can read data dictionary entries"
  on public.data_dictionary_entries for select to authenticated using (true);
create policy "Admins can manage data dictionary entries"
  on public.data_dictionary_entries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Authenticated users can read controlled value sets"
  on public.controlled_value_sets for select to authenticated using (true);
create policy "Admins can manage controlled value sets"
  on public.controlled_value_sets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Authenticated users can read terminology rules"
  on public.terminology_rules for select to authenticated using (true);
create policy "Admins can manage terminology rules"
  on public.terminology_rules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Authenticated users can read routing rules"
  on public.routing_rules for select to authenticated using (true);
create policy "Admins can manage routing rules"
  on public.routing_rules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Projektbezogene Kontextauswahl bleibt strikt an bestehende Projekt-Membership-RLS gebunden:
-- ein Benutzer ohne Projektmitgliedschaft sieht keine unternehmensspezifische Auswahl eines fremden Projekts.
create policy "Members can read project context selection"
  on public.project_context_selections for select to authenticated
  using (public.is_project_member(project_id));
create policy "Designers can upsert project context selection"
  on public.project_context_selections for insert to authenticated
  with check (public.has_project_role(project_id, array['Project Owner', 'Test Designer']));
create policy "Designers can update project context selection"
  on public.project_context_selections for update to authenticated
  using (public.has_project_role(project_id, array['Project Owner', 'Test Designer']))
  with check (public.has_project_role(project_id, array['Project Owner', 'Test Designer']));
create policy "Owners can delete project context selection"
  on public.project_context_selections for delete to authenticated
  using (public.has_project_role(project_id, array['Project Owner']));

-- --- Seed: Kontextprofil "Allgemein" ---
insert into public.context_profiles (id, organization, name, version, status, evidence_types, qa_rules, forbidden_terms, data_dictionary_versions)
values (
  'general', 'Allgemein', 'Allgemein', '1.0.0', 'active',
  array['Screenshot', 'Timestamp'],
  array['Draft-first bei unvollstaendiger Spezifikation.', 'Keine Fakten erfinden.'],
  array[]::text[],
  array[]::text[]
) on conflict (id) do nothing;

-- --- Seed: Kontextprofil "Hays Talent Delivery" ---
-- Enthaelt ausschliesslich konfigurative Referenzwerte (Systemnamen, Feldnamen, Mailbox-Bezeichnungen
-- laut Anforderung). Keine Secrets, keine produktiven Bewerberdaten, keine API-Keys.
insert into public.context_profiles (id, organization, name, version, status, systems, processes, evidence_types, qa_rules, forbidden_terms, data_dictionary_versions)
values (
  'hays-talent-delivery', 'Hays', 'Hays Talent Delivery', '1.0.0', 'active',
  '[
    {"key":"hays-website","label":"Hays Webseite"},
    {"key":"mein-hays","label":"MeinHays"},
    {"key":"freelancermap","label":"Freelancermap"},
    {"key":"hays-web-api","label":"Hays Web/API"},
    {"key":"global-quick-apply-service","label":"global-quick-apply-service"},
    {"key":"daxtra-capture","label":"Daxtra Capture"},
    {"key":"iris","label":"IRIS"},
    {"key":"azure-devops","label":"Azure DevOps"},
    {"key":"monitoring-logs","label":"Monitoring / Logs"}
  ]'::jsonb,
  '[
    {"key":"standardbewerbung","label":"Standardbewerbung","targetMailbox":"Parsing_Inbound@hays.de","targetSpoolLabel":"Standard-Spool","confirmationStatus":"Confirmed"},
    {"key":"pso-bewerbung","label":"PSO-Bewerbung","targetMailbox":"PM.PSO-Parsing@hays.de","targetSpoolLabel":"PSO-Spool","confirmationStatus":"Confirmed"},
    {"key":"profilpflege","label":"Profilpflege / Profile Update","targetMailbox":"PM.Profilpflege-Parsing@hays.de","targetSpoolLabel":"Profilpflege-Spool","mandatoryRule":"update-only","confirmationStatus":"Confirmed"},
    {"key":"freelancermap-api-bewerbung","label":"Freelancermap API Bewerbung","confirmationStatus":"Confirmed","systemChain":["Freelancermap","Hays Web/API","Daxtra Capture","IRIS"]},
    {"key":"email-bewerbung","label":"E-Mail-Bewerbung","confirmationStatus":"Confirmed"},
    {"key":"cv-rescan","label":"CV-Rescan","confirmationStatus":"Review Required"}
  ]'::jsonb,
  array['Screenshot', 'Daxtra Docket-ID', 'IRIS-ID / BPID', 'Prospect-ID', 'PSO-ID', 'Correlation-ID', 'Request/Response', 'HAR', 'Console Log', 'Service Log', 'Timestamp'],
  array[
    'Keine Systeme, Felder, Endpunkte, URLs, Statuswerte, IDs, Enums, Pflichtwerte, Logtexte oder Fehlercodes erfinden.',
    'Confirmed-, Review-Required- und Deprecated-Werte unterscheiden; Review-Required nicht als verbindliches Soll darstellen.',
    'Draft-first bei unvollstaendiger Spezifikation.',
    'E2E ist erst bestanden, wenn technische Annahme, Daxtra-Verarbeitung und fachliches IRIS-Ergebnis geprueft sind.',
    'Profilpflege ist update-only und darf keinen neuen Business Partner in IRIS erzeugen.',
    'GDPR Lock darf weder Update noch automatische Ersatz-Neuanlage veranlassen.',
    'Mehrfachtreffer duerfen nicht zufaellig aktualisiert werden.',
    'Keine produktiven Bewerberdaten, Passwoerter oder API-Keys generieren.',
    'Drafts fliessen nicht in Pass Rate und Testausfuehrung ein.'
  ],
  array['ATS', 'Candidate Record', 'Application Record', 'Downstream Handover', 'APP-', 'processed successfully', 'system status', 'manual queue', 'Category', 'Reference ID', 'Success'],
  array['v1-2026-09']
) on conflict (id) do nothing;

comment on table public.context_profiles is 'Organisations-/Domaenenkataloge fuer Kontextprofile (z.B. Allgemein, Hays Talent Delivery). Referenzdaten, keine Projekt-/Bewerberdaten.';
comment on table public.project_context_selections is 'Projektbezogene Zuordnung von Kontextprofil, Projekttyp, Systemen, Prozessen etc. RLS folgt bestehender Projekt-Membership.';
