// Zugriff auf Kontextprofile, Data Dictionary und kontrollierte Wertelisten.
// Client-seitig auf Basis der statischen Hays-Seed-Daten; kann spaeter durch
// Supabase-Abfragen auf `context_profiles`/`data_dictionary_entries`/`controlled_value_sets` ersetzt werden,
// ohne dass Aufrufer (geminiService, UI) angepasst werden muessen.

import {
  ContextProfile,
  ControlledValueSet,
  DataDictionaryEntry,
  RoutingRule,
} from '../types';
import {
  ALL_CONTEXT_PROFILES,
  GENERAL_CONTEXT_PROFILE_ID,
  HAYS_CONTEXT_PROFILE_ID,
  HAYS_CONTROLLED_VALUE_SETS,
  HAYS_DATA_DICTIONARY,
  HAYS_ROUTING_RULES,
  HAYS_TERMINOLOGY_RULES,
} from '../data/hays/contextProfile';

export { GENERAL_CONTEXT_PROFILE_ID, HAYS_CONTEXT_PROFILE_ID };

export const listContextProfiles = (): ContextProfile[] => ALL_CONTEXT_PROFILES;

export const getContextProfile = (contextProfileId?: string): ContextProfile | undefined =>
  ALL_CONTEXT_PROFILES.find(profile => profile.id === contextProfileId);

export const listDataDictionaryEntries = (contextProfileId?: string): DataDictionaryEntry[] => {
  if (!contextProfileId || contextProfileId === GENERAL_CONTEXT_PROFILE_ID) return [];
  return HAYS_DATA_DICTIONARY.filter(entry => entry.contextProfileId === contextProfileId);
};

export const listControlledValueSets = (contextProfileId?: string): ControlledValueSet[] => {
  if (!contextProfileId) return [];
  return HAYS_CONTROLLED_VALUE_SETS.filter(set => (set.applicableProjects || []).includes(contextProfileId));
};

export const getControlledValueSet = (key: string, contextProfileId?: string): ControlledValueSet | undefined =>
  listControlledValueSets(contextProfileId).find(set => set.key === key);

export const listRoutingRules = (contextProfileId?: string): RoutingRule[] => {
  if (!contextProfileId) return [];
  return HAYS_ROUTING_RULES.filter(rule => rule.contextProfileId === contextProfileId);
};

/**
 * Filtert das Data Dictionary auf das gewaehlte Projekt/Prozess/System, damit
 * niemals das volle Woerterbuch blind an die KI gesendet wird (siehe Abschnitt J).
 */
export interface DictionaryFilterOptions {
  contextProfileId?: string;
  processKeys?: string[];
  systemLabels?: string[];
  fieldIds?: string[];
}

export const filterDataDictionary = (options: DictionaryFilterOptions): DataDictionaryEntry[] => {
  const entries = listDataDictionaryEntries(options.contextProfileId);
  return entries.filter(entry => {
    if (options.fieldIds && options.fieldIds.length > 0) {
      if (!options.fieldIds.includes(entry.id)) return false;
    }
    if (options.systemLabels && options.systemLabels.length > 0) {
      const matchesSystem =
        (entry.sourceSystem && options.systemLabels.includes(entry.sourceSystem)) ||
        (entry.targetSystem && options.systemLabels.includes(entry.targetSystem));
      if (!matchesSystem && !options.fieldIds) return false;
    }
    if (options.processKeys && options.processKeys.length > 0 && entry.applicableProcesses) {
      const matchesProcess = entry.applicableProcesses.some(p => options.processKeys!.includes(p));
      if (!matchesProcess) return false;
    }
    return true;
  });
};

/**
 * Baut eine kompakte, strukturierte Kontextzusammenstellung fuer KI-Prompts (Abschnitt J).
 * Sendet nur die Ausschnitte des Data Dictionary, die zum gewaehlten Projekt/Prozess/System passen.
 */
export interface AiProjectContextInput {
  projectName?: string;
  organization?: string;
  projectType?: string;
  description?: string;
  testGoal?: string;
  testObject?: string;
  release?: string;
  environment?: string;
  selectedSystems?: string[];
  selectedProcess?: string;
  selectedFieldIds?: string[];
  contextProfileId?: string;
}

export const buildCompactAiContext = (input: AiProjectContextInput): string => {
  const profile = getContextProfile(input.contextProfileId);
  if (!profile || profile.id === GENERAL_CONTEXT_PROFILE_ID) {
    return [
      `Projekt: ${input.projectName || 'n/a'}`,
      `Organisation: ${input.organization || 'Allgemein'}`,
      `Projekttyp: ${input.projectType || 'n/a'}`,
      `Beschreibung: ${input.description || 'n/a'}`,
      `Testziel: ${input.testGoal || 'n/a'}`,
      `Testobjekt: ${input.testObject || 'n/a'}`,
      `Release: ${input.release || 'n/a'}`,
    ].join('\n');
  }

  const routing = listRoutingRules(profile.id).filter(r => !input.selectedProcess || r.processKey === input.selectedProcess);
  const dictionary = filterDataDictionary({
    contextProfileId: profile.id,
    processKeys: input.selectedProcess ? [input.selectedProcess] : undefined,
    systemLabels: input.selectedSystems,
    fieldIds: input.selectedFieldIds,
  });
  const terminologyRules = HAYS_TERMINOLOGY_RULES.filter(rule => rule.contextProfileId === profile.id);

  const lines: string[] = [
    `Projekt: ${input.projectName || 'n/a'}`,
    `Organisation: ${profile.organization} (Kontextprofil: ${profile.name} v${profile.version})`,
    `Projekttyp: ${input.projectType || 'n/a'}`,
    `Beschreibung: ${input.description || 'n/a'}`,
    `Testziel: ${input.testGoal || 'n/a'}`,
    `Testobjekt: ${input.testObject || 'n/a'}`,
    `Release: ${input.release || 'n/a'}`,
    `Environment: ${input.environment || 'n/a'}`,
    `Ausgewaehlte Systeme: ${(input.selectedSystems || []).join(', ') || 'n/a'}`,
    `Ausgewaehlter Prozess: ${input.selectedProcess || 'n/a'}`,
  ];

  if (routing.length > 0) {
    lines.push('Relevante Routingregel(n):');
    routing.forEach(r => lines.push(`- ${r.description}${r.targetMailbox ? ` (Ziel-Mailbox: ${r.targetMailbox})` : ''}${r.mandatoryRule ? ` [Pflichtregel: ${r.mandatoryRule}]` : ''} [${r.confirmationStatus}]`));
  }

  if (dictionary.length > 0) {
    lines.push('Relevante Data-Dictionary-Eintraege (nur gefilterter Ausschnitt):');
    dictionary.slice(0, 40).forEach(entry => {
      lines.push(`- ${entry.displayName} (${entry.technicalName}) -> ${entry.targetField || entry.targetSystem || 'kein bestaetigtes Zielfeld'} [${entry.confirmationStatus}]`);
    });
  }

  lines.push(`Verbotene/zu ersetzende Begriffe: ${profile.forbiddenTerms.join(', ')}`);
  lines.push('Terminologieregeln:');
  terminologyRules.forEach(rule => lines.push(`- "${rule.forbiddenTerm}" -> ${rule.replacementGuidance} [${rule.severity}]`));
  lines.push(`Evidence-Anforderungen: ${profile.evidenceTypes.join(', ')}`);
  lines.push('QA Contract:');
  profile.qaRules.forEach(rule => lines.push(`- ${rule}`));

  return lines.join('\n');
};
