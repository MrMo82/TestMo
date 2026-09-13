import { supabase } from './supabaseClient';

export interface ProjectContextSelection {
  projectId: string;
  contextProfileId: string | null;
  projectType: string | null;
  dataDictionaryVersion: string | null;
  fixVersion: string | null;
  selectedSystems: string[];
  selectedEnvironments: string[];
  selectedProcesses: string[];
  selectedEvidenceTypes: string[];
  businessOwner: string | null;
  technicalOwner: string | null;
  strictQaContract: boolean;
  defaultArtifactMode: 'auto' | 'testcase' | 'draft_backlog';
  customQaInstruction: string | null;
  forbiddenTerms: string[];
  approvedRoutingKeys: string[];
}

interface ProjectContextSelectionRow {
  project_id: string;
  context_profile_id: string | null;
  project_type: string | null;
  data_dictionary_version: string | null;
  fix_version: string | null;
  selected_systems: string[];
  selected_environments: string[];
  selected_processes: string[];
  selected_evidence_types: string[];
  business_owner: string | null;
  technical_owner: string | null;
  strict_qa_contract: boolean;
  default_artifact_mode: 'auto' | 'testcase' | 'draft_backlog';
  custom_qa_instruction: string | null;
  forbidden_terms: string[];
  approved_routing_keys: string[];
}

const columns = 'project_id, context_profile_id, project_type, data_dictionary_version, fix_version, selected_systems, selected_environments, selected_processes, selected_evidence_types, business_owner, technical_owner, strict_qa_contract, default_artifact_mode, custom_qa_instruction, forbidden_terms, approved_routing_keys';

const mapRow = (row: ProjectContextSelectionRow): ProjectContextSelection => ({
  projectId: row.project_id,
  contextProfileId: row.context_profile_id,
  projectType: row.project_type,
  dataDictionaryVersion: row.data_dictionary_version,
  fixVersion: row.fix_version,
  selectedSystems: row.selected_systems || [],
  selectedEnvironments: row.selected_environments || [],
  selectedProcesses: row.selected_processes || [],
  selectedEvidenceTypes: row.selected_evidence_types || [],
  businessOwner: row.business_owner,
  technicalOwner: row.technical_owner,
  strictQaContract: row.strict_qa_contract,
  defaultArtifactMode: row.default_artifact_mode,
  customQaInstruction: row.custom_qa_instruction,
  forbiddenTerms: row.forbidden_terms || [],
  approvedRoutingKeys: row.approved_routing_keys || [],
});

/**
 * Laedt die projektbezogene Kontextauswahl. Gibt `null` zurueck, wenn das Projekt noch kein
 * Kontextprofil zugewiesen bekommen hat (bestehende Projekte bleiben so lesbar - AC-02).
 */
export const getProjectContextSelection = async (projectId: string): Promise<ProjectContextSelection | null> => {
  const { data, error } = await supabase
    .from('project_context_selections')
    .select(columns)
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) throw new Error(`Projektkontext konnte nicht geladen werden: ${error.message}`);
  return data ? mapRow(data as ProjectContextSelectionRow) : null;
};

export type UpsertProjectContextSelectionInput = Partial<Omit<ProjectContextSelection, 'projectId'>>;

export const upsertProjectContextSelection = async (
  projectId: string,
  input: UpsertProjectContextSelectionInput
): Promise<ProjectContextSelection> => {
  const payload: Record<string, unknown> = { project_id: projectId };
  if (input.contextProfileId !== undefined) payload.context_profile_id = input.contextProfileId;
  if (input.projectType !== undefined) payload.project_type = input.projectType;
  if (input.dataDictionaryVersion !== undefined) payload.data_dictionary_version = input.dataDictionaryVersion;
  if (input.fixVersion !== undefined) payload.fix_version = input.fixVersion;
  if (input.selectedSystems !== undefined) payload.selected_systems = input.selectedSystems;
  if (input.selectedEnvironments !== undefined) payload.selected_environments = input.selectedEnvironments;
  if (input.selectedProcesses !== undefined) payload.selected_processes = input.selectedProcesses;
  if (input.selectedEvidenceTypes !== undefined) payload.selected_evidence_types = input.selectedEvidenceTypes;
  if (input.businessOwner !== undefined) payload.business_owner = input.businessOwner;
  if (input.technicalOwner !== undefined) payload.technical_owner = input.technicalOwner;
  if (input.strictQaContract !== undefined) payload.strict_qa_contract = input.strictQaContract;
  if (input.defaultArtifactMode !== undefined) payload.default_artifact_mode = input.defaultArtifactMode;
  if (input.customQaInstruction !== undefined) payload.custom_qa_instruction = input.customQaInstruction;
  if (input.forbiddenTerms !== undefined) payload.forbidden_terms = input.forbiddenTerms;
  if (input.approvedRoutingKeys !== undefined) payload.approved_routing_keys = input.approvedRoutingKeys;

  const { data, error } = await supabase
    .from('project_context_selections')
    .upsert(payload, { onConflict: 'project_id' })
    .select(columns)
    .single();

  if (error) throw new Error(`Projektkontext konnte nicht gespeichert werden: ${error.message}`);
  return mapRow(data as ProjectContextSelectionRow);
};
