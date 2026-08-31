-- Phase 3: normalized project intake context.
alter table public.projects
  add column in_scope text not null default '',
  add column out_of_scope text not null default '',
  add column unchanged_processes text not null default '',
  add column known_interfaces text not null default '',
  add column systems text not null default '',
  add column channels text not null default '',
  add column known_risks text not null default '',
  add column compliance_privacy text not null default '',
  add column entry_criteria text not null default '',
  add column exit_criteria text not null default '',
  add column go_live_criteria text not null default '',
  add column intake_step smallint not null default 1 check (intake_step between 1 and 4);
