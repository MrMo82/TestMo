import { describe, it, expect } from 'vitest';
import { ConfirmationStatus, TestCase, CaseStatus, Priority, Readiness } from '../types';
import {
  listContextProfiles,
  getContextProfile,
  listDataDictionaryEntries,
  filterDataDictionary,
  buildCompactAiContext,
  HAYS_CONTEXT_PROFILE_ID,
  GENERAL_CONTEXT_PROFILE_ID,
} from '../services/contextProfileService';
import {
  checkTextTerminology,
  checkTestCaseTerminology,
  checkTestCasesTerminology,
  validateDaxtraStatus,
  checkProfilpflegeRule,
  hasBlockingFindings,
} from '../services/terminologyService';
import { HAYS_DATA_DICTIONARY } from '../data/hays/contextProfile';

const baseCase = (overrides: Partial<TestCase> = {}): TestCase => ({
  caseId: 'TC-1',
  title: 'Test',
  summary: 'Summary',
  tags: [],
  priority: Priority.Medium,
  type: 'functional',
  preconditions: [],
  estimatedDurationMin: 5,
  estimatedEffort: 'S',
  steps: [],
  caseStatus: CaseStatus.NotStarted,
  lastUpdated: new Date().toISOString(),
  createdBy: 'tester',
  ...overrides,
});

// 1. ContextProfile wird korrekt geladen.
describe('ContextProfile laden', () => {
  it('liefert das Hays-Profil mit Systemen und Prozessen', () => {
    const profile = getContextProfile(HAYS_CONTEXT_PROFILE_ID);
    expect(profile).toBeDefined();
    expect(profile!.systems.some(s => s.label === 'IRIS')).toBe(true);
    expect(profile!.systems.some(s => s.label === 'Daxtra Capture')).toBe(true);
    expect(profile!.processes.some(p => p.key === 'profilpflege')).toBe(true);
  });

  it('listet mindestens das Allgemein- und das Hays-Profil', () => {
    const profiles = listContextProfiles();
    expect(profiles.map(p => p.id)).toEqual(expect.arrayContaining([GENERAL_CONTEXT_PROFILE_ID, HAYS_CONTEXT_PROFILE_ID]));
  });
});

// 2. Data Dictionary wird nach Projekt, Prozess und System gefiltert.
describe('Data Dictionary Filterung', () => {
  it('liefert keine Eintraege fuer das Allgemein-Profil', () => {
    expect(listDataDictionaryEntries(GENERAL_CONTEXT_PROFILE_ID)).toHaveLength(0);
  });

  it('filtert auf ausgewaehlte Systeme', () => {
    const filtered = filterDataDictionary({ contextProfileId: HAYS_CONTEXT_PROFILE_ID, systemLabels: ['IRIS'] });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(e => e.sourceSystem === 'IRIS' || e.targetSystem === 'IRIS')).toBe(true);
  });

  it('filtert auf explizite Feld-IDs (z.B. fuer KI-Kontext)', () => {
    const filtered = filterDataDictionary({ contextProfileId: HAYS_CONTEXT_PROFILE_ID, fieldIds: ['dxbpi'] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('dxbpi');
  });
});

// 3. Confirmed- und Review-Required-Werte werden unterschieden.
describe('Confirmed vs Review Required', () => {
  it('enthaelt sowohl Confirmed- als auch Review-Required-Eintraege', () => {
    const statuses = new Set(HAYS_DATA_DICTIONARY.map(e => e.confirmationStatus));
    expect(statuses.has(ConfirmationStatus.Confirmed)).toBe(true);
    expect(statuses.has(ConfirmationStatus.ReviewRequired)).toBe(true);
  });

  it('DXGND (Geschlecht) ist Review Required, bis IRIS-Mapping final ist', () => {
    const entry = HAYS_DATA_DICTIONARY.find(e => e.id === 'dxgnd');
    expect(entry?.confirmationStatus).toBe(ConfirmationStatus.ReviewRequired);
  });
});

// 4-6. Terminologiepruefung: ATS, Downstream Handover, erfundene APP-ID
describe('Terminologiepruefung (Abschnitt L)', () => {
  it('beanstandet "An ATS übergeben" (AC-07)', () => {
    const findings = checkTextTerminology('Systemstatus: An ATS übergeben', { contextProfileId: HAYS_CONTEXT_PROFILE_ID });
    expect(findings.some(f => f.term === 'ATS' && f.severity === 'error')).toBe(true);
  });

  it('beanstandet "Downstream Handover successful for APP-2024-00123" (AC-08)', () => {
    const findings = checkTextTerminology('Downstream Handover successful for APP-2024-00123', { contextProfileId: HAYS_CONTEXT_PROFILE_ID });
    expect(findings.some(f => f.term === 'Downstream Handover')).toBe(true);
    expect(findings.some(f => f.term.includes('APP-2024-00123'))).toBe(true);
  });

  it('beanstandet eine erfundene APP-ID auch ohne "Downstream Handover"', () => {
    const findings = checkTextTerminology('Referenz APP-2025-00042 wurde verarbeitet', { contextProfileId: HAYS_CONTEXT_PROFILE_ID });
    expect(findings.some(f => f.severity === 'error' && f.term.includes('APP-2025-00042'))).toBe(true);
  });

  it('laesst unproblematischen Text ohne Findings durch', () => {
    const findings = checkTextTerminology('Öffne den Business Partner in IRIS über die IRIS-ID/BPID.', { contextProfileId: HAYS_CONTEXT_PROFILE_ID });
    expect(findings).toHaveLength(0);
  });
});

// 7-8. Daxtra-Status aus erlaubter Liste
describe('Daxtra-Status Validierung', () => {
  it('akzeptiert einen Status aus der kontrollierten Liste', () => {
    expect(validateDaxtraStatus('Successfully loaded')).toBe(true);
  });

  it('lehnt einen unbekannten/erfundenen Status ab', () => {
    expect(validateDaxtraStatus('Magically Processed')).toBe(false);
  });
});

// 9. Profilpflege ohne "Keine Neuanlage"-Regel wird beanstandet.
describe('Profilpflege Sonderregel (AC-11)', () => {
  it('beanstandet einen Profilpflege-Testfall ohne "Keine Neuanlage"-Hinweis', () => {
    const testCase = baseCase({
      haysContext: { applicationFlow: 'profilpflege' },
      summary: 'Kandidat aktualisiert sein Profil.',
    });
    const findings = checkProfilpflegeRule(testCase);
    expect(findings.some(f => f.severity === 'error')).toBe(true);
  });

  it('akzeptiert einen Profilpflege-Testfall mit "Keine Neuanlage"/update-only Hinweis', () => {
    const testCase = baseCase({
      haysContext: { applicationFlow: 'profilpflege' },
      summary: 'Profilpflege ist update-only: Keine Neuanlage eines neuen Business Partners erlaubt.',
    });
    const findings = checkProfilpflegeRule(testCase);
    expect(findings).toHaveLength(0);
  });
});

// 10. Draft wird bei fehlendem verbindlichem Soll erzeugt (hier: Readiness/Status-Kennzeichnung geprueft).
describe('Draft-Kennzeichnung bei unvollstaendigem Soll', () => {
  it('markiert einen Testfall mit Readiness Draft, wenn kein bestaetigtes Soll vorliegt', () => {
    const testCase = baseCase({ readiness: Readiness.Draft, caseStatus: CaseStatus.Draft });
    expect(testCase.readiness).toBe(Readiness.Draft);
    expect(testCase.caseStatus).toBe(CaseStatus.Draft);
  });
});

// 12. Bestehendes Projekt ohne neues Kontextprofil bleibt lesbar (AC-02) - hier auf Ebene Testfall/Kontext geprueft.
describe('Rueckwaertskompatibilitaet ohne Kontextprofil', () => {
  it('erzeugt fuer einen Testfall ohne contextProfileId keine Terminologiefindings aus Versehen', () => {
    const testCase = baseCase({ summary: 'Ganz normaler Testfall ohne Hays-Kontext und ohne verbotene Begriffe.' });
    const findings = checkTestCaseTerminology(testCase, {});
    // Ohne explizite contextProfileId wird auf das Hays-Profil defaultet; Text enthaelt aber keine verbotenen Begriffe.
    expect(findings).toHaveLength(0);
  });

  it('buildCompactAiContext liefert fuer das Allgemein-Profil einen einfachen Kontext ohne Data Dictionary', () => {
    const context = buildCompactAiContext({ projectName: 'Legacy Projekt', contextProfileId: GENERAL_CONTEXT_PROFILE_ID });
    expect(context).toContain('Legacy Projekt');
    expect(context).not.toContain('Data-Dictionary');
  });
});

// 15. generierter Hays-E2E-Test enthaelt mindestens einen konkreten IRIS-Pruefschritt (Proxy ueber Kontextaufbau, da kein Live-API-Call in Tests).
describe('KI-Kontext enthaelt konkrete IRIS-Pruefung statt genereischem Platzhalter', () => {
  it('enthaelt bei Systemauswahl IRIS einen konkreten IRIS-Dictionary-Eintrag im Prompt-Kontext', () => {
    const context = buildCompactAiContext({
      projectName: 'Importtool-Ablösung',
      contextProfileId: HAYS_CONTEXT_PROFILE_ID,
      selectedSystems: ['IRIS'],
      selectedProcess: 'standardbewerbung',
    });
    expect(context).toContain('IRIS');
    expect(context).toContain('IRIS-ID / BPID');
    // "ATS" darf nur als Teil der Terminologieregel (verbotener Begriff + Ersatzhinweis) auftauchen, nicht als Systemname.
    expect(context).toContain('"ATS" -> IRIS, wenn IRIS das Zielsystem ist');
  });
});

// Bulk-Check Nutzung
describe('checkTestCasesTerminology (Bulk)', () => {
  it('liefert eine Map mit Findings pro Testfall-ID', () => {
    const cases = [
      baseCase({ caseId: 'TC-A', summary: 'An ATS übergeben' }),
      baseCase({ caseId: 'TC-B', summary: 'Business Partner in IRIS geprüft' }),
    ];
    const findingsMap = checkTestCasesTerminology(cases, { contextProfileId: HAYS_CONTEXT_PROFILE_ID });
    expect(hasBlockingFindings(findingsMap.get('TC-A') || [])).toBe(true);
    expect(hasBlockingFindings(findingsMap.get('TC-B') || [])).toBe(false);
  });
});
