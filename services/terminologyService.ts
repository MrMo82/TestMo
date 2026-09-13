// Terminologie-Validierung fuer generierte, importierte und optimierte Testfaelle (Abschnitt L).
// Prueft, ob verbotene/generische Begriffe verwendet werden, obwohl im aktiven Kontext ein
// konkreter Hays-Begriff verfuegbar waere, und ob erfundene IDs/Logtexte vorkommen.

import { ConfirmationStatus, TerminologyFinding, TestCase } from '../types';
import { HAYS_CONTEXT_PROFILE_ID, HAYS_TERMINOLOGY_RULES } from '../data/hays/contextProfile';

const DAXTRA_STATUS_ALLOWED = [
  'Successfully loaded',
  'Successfully updated',
  'Missing Information',
  'Possible Update',
  'Failed to Load',
];

// Erkennt Muster wie "APP-2024-00123", die wie eine erfundene, nicht im Data Dictionary
// bestaetigte Business-ID aussehen.
const INVENTED_APP_ID_PATTERN = /\bAPP-\d{4}-\d+\b/gi;

const buildRegex = (term: string): RegExp => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

export interface TerminologyCheckOptions {
  contextProfileId?: string;
  /** Freitext mit dem tatsaechlich verwendeten/erwaehnten Daxtra-Status, falls vorhanden. */
  mentionedDaxtraStatuses?: string[];
}

const collectText = (testCase: TestCase): string => {
  const parts = [testCase.title, testCase.summary];
  testCase.steps.forEach(step => {
    parts.push(step.description, step.expectedResult, step.testData || '', step.notes || '');
  });
  (testCase.negativeFlows || []).forEach(flow => {
    parts.push(flow.description);
    flow.steps.forEach(step => parts.push(step.description, step.expectedResult));
  });
  return parts.filter(Boolean).join('\n');
};

/**
 * Prueft einen freien Text (z.B. einen einzelnen Log-/Statussatz oder Testschritt) auf
 * verbotene/erfundene Terminologie. Wird sowohl fuer Einzeltexte als auch aus checkTestCaseTerminology heraus genutzt.
 */
export const checkTextTerminology = (text: string, options: TerminologyCheckOptions = {}): TerminologyFinding[] => {
  const findings: TerminologyFinding[] = [];
  const profileId = options.contextProfileId || HAYS_CONTEXT_PROFILE_ID;
  const rules = HAYS_TERMINOLOGY_RULES.filter(rule => rule.contextProfileId === profileId);

  rules.forEach(rule => {
    const regex = buildRegex(rule.forbiddenTerm);
    if (regex.test(text)) {
      findings.push({
        severity: rule.severity,
        term: rule.forbiddenTerm,
        message: `"${rule.forbiddenTerm}" gefunden - ${rule.replacementGuidance}`,
        ruleId: rule.id,
      });
    }
  });

  const inventedIds = text.match(INVENTED_APP_ID_PATTERN);
  if (inventedIds) {
    inventedIds.forEach(id => {
      findings.push({
        severity: 'error',
        term: id,
        message: `"${id}" sieht wie eine erfundene Business-ID aus. Ohne bestaetigten Eintrag im Data Dictionary darf keine ID-Konvention behauptet werden. Referenziere stattdessen die Request-/Correlation-ID.`,
      });
    });
  }

  // Unbekannter/erfundener Daxtra-Status im Text
  const mentionedDaxtra = /daxtra[^.\n]{0,40}status[^.\n]{0,60}/gi.exec(text);
  if (mentionedDaxtra) {
    const isAllowedStatusPresent = DAXTRA_STATUS_ALLOWED.some(status => text.includes(status));
    if (!isAllowedStatusPresent) {
      findings.push({
        severity: 'warning',
        term: 'Daxtra-Status',
        message: 'Es wird ein Daxtra-Status erwaehnt, der nicht aus der kontrollierten Liste stammt (Successfully loaded, Successfully updated, Missing Information, Possible Update, Failed to Load).',
      });
    }
  }

  return findings;
};

export const validateDaxtraStatus = (status: string): boolean => DAXTRA_STATUS_ALLOWED.includes(status);

export const DAXTRA_STATUS_VALUES = DAXTRA_STATUS_ALLOWED;

/**
 * Prueft die Profilpflege-Sonderregel: der Testfall muss die "Keine Neuanlage"-Regel referenzieren
 * (Abschnitt F/K/AC-11). Nur relevant, wenn applicationFlow === 'profilpflege'.
 */
export const checkProfilpflegeRule = (testCase: TestCase): TerminologyFinding[] => {
  const findings: TerminologyFinding[] = [];
  if (testCase.haysContext?.applicationFlow !== 'profilpflege') return findings;

  const text = collectText(testCase).toLowerCase();
  const mentionsNoCreationRule = text.includes('keine neuanlage') || text.includes('update-only') || text.includes('darf keinen neuen business partner');
  if (!mentionsNoCreationRule) {
    findings.push({
      severity: 'error',
      term: 'Profilpflege',
      message: 'Profilpflege-Testfaelle muessen die Regel "Keine Neuanlage" (update-only) explizit enthalten.',
    });
  }
  return findings;
};

/**
 * Fuehrt die vollstaendige Terminologiepruefung fuer einen Testfall durch (Einzel- und Bulk-Nutzung, Abschnitt L).
 */
export const checkTestCaseTerminology = (testCase: TestCase, options: TerminologyCheckOptions = {}): TerminologyFinding[] => {
  const text = collectText(testCase);
  const findings = [...checkTextTerminology(text, options), ...checkProfilpflegeRule(testCase)];

  // Duplikate (gleicher term+message) entfernen
  const seen = new Set<string>();
  return findings.filter(finding => {
    const key = `${finding.term}|${finding.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const checkTestCasesTerminology = (testCases: TestCase[], options: TerminologyCheckOptions = {}): Map<string, TerminologyFinding[]> => {
  const result = new Map<string, TerminologyFinding[]>();
  testCases.forEach(testCase => {
    result.set(testCase.caseId, checkTestCaseTerminology(testCase, options));
  });
  return result;
};

export const hasBlockingFindings = (findings: TerminologyFinding[]): boolean => findings.some(f => f.severity === 'error');

/**
 * Ermittelt, ob ein Data-Dictionary-Wert als "Review Required" markiert ist, um ihn in der UI
 * orange statt gruen zu kennzeichnen (Abschnitt L/AC-15).
 */
export const isReviewRequired = (status?: ConfirmationStatus): boolean => status === ConfirmationStatus.ReviewRequired;
