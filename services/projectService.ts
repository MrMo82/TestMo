import { supabase } from './supabaseClient';
import type { Project } from '../types';

interface ProjectRow {
  id: string;
  project_key: string;
  name: string;
  description: string;
  goal: string;
  test_object: string;
  release: string;
  status: Project['status'];
  owner_id: string;
  in_scope: string;
  out_of_scope: string;
  unchanged_processes: string;
  known_interfaces: string;
  systems: string;
  channels: string;
  known_risks: string;
  compliance_privacy: string;
  entry_criteria: string;
  exit_criteria: string;
  go_live_criteria: string;
  intake_step: 1 | 2 | 3 | 4;
  created_at: string;
  updated_at: string;
}

const mapProject = (row: ProjectRow): Project => ({
  id: row.id,
  projectKey: row.project_key,
  name: row.name,
  description: row.description,
  goal: row.goal,
  testObject: row.test_object,
  release: row.release,
  status: row.status,
  ownerId: row.owner_id,
  inScope: row.in_scope,
  outOfScope: row.out_of_scope,
  unchangedProcesses: row.unchanged_processes,
  knownInterfaces: row.known_interfaces,
  systems: row.systems,
  channels: row.channels,
  knownRisks: row.known_risks,
  compliancePrivacy: row.compliance_privacy,
  entryCriteria: row.entry_criteria,
  exitCriteria: row.exit_criteria,
  goLiveCriteria: row.go_live_criteria,
  intakeStep: row.intake_step,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const projectColumns = 'id, project_key, name, description, goal, test_object, release, status, owner_id, in_scope, out_of_scope, unchanged_processes, known_interfaces, systems, channels, known_risks, compliance_privacy, entry_criteria, exit_criteria, go_live_criteria, intake_step, created_at, updated_at';

export interface CreateProjectInput {
  projectKey: string;
  name: string;
  description: string;
  goal: string;
  testObject: string;
  release: string;
}

export const listProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select(projectColumns)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Projekte konnten nicht geladen werden: ${error.message}`);
  return (data as ProjectRow[]).map(mapProject);
};

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('Für das Anlegen eines Projekts ist eine gültige Sitzung erforderlich.');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      project_key: input.projectKey,
      name: input.name,
      description: input.description,
      goal: input.goal,
      test_object: input.testObject,
      release: input.release,
      owner_id: userData.user.id,
    })
    .select(projectColumns)
    .single();

  if (error) throw new Error(`Projekt konnte nicht angelegt werden: ${error.message}`);
  return mapProject(data as ProjectRow);
};

export type UpdateProjectInput = Partial<Omit<Project, 'id' | 'projectKey' | 'ownerId' | 'createdAt' | 'updatedAt'>>;

export const getProject = async (projectId: string): Promise<Project> => {
  const { data, error } = await supabase.from('projects').select(projectColumns).eq('id', projectId).single();
  if (error) throw new Error(`Projekt konnte nicht geladen werden: ${error.message}`);
  return mapProject(data as ProjectRow);
};

export const updateProject = async (projectId: string, input: UpdateProjectInput): Promise<Project> => {
  const fieldMap: Record<string, string> = {
    description: 'description', goal: 'goal', testObject: 'test_object', release: 'release',
    inScope: 'in_scope', outOfScope: 'out_of_scope', unchangedProcesses: 'unchanged_processes',
    knownInterfaces: 'known_interfaces', systems: 'systems', channels: 'channels', knownRisks: 'known_risks',
    compliancePrivacy: 'compliance_privacy', entryCriteria: 'entry_criteria', exitCriteria: 'exit_criteria',
    goLiveCriteria: 'go_live_criteria', intakeStep: 'intake_step'
  };
  const payload: Record<string, unknown> = {};
  Object.entries(input).forEach(([key, value]) => { if (fieldMap[key]) payload[fieldMap[key]] = value; });
  const { data, error } = await supabase.from('projects').update(payload).eq('id', projectId).select(projectColumns).single();
  if (error) throw new Error(`Projekt konnte nicht gespeichert werden: ${error.message}`);
  return mapProject(data as ProjectRow);
};