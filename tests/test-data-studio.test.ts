import { describe, expect, it } from 'vitest';
import { CaseStatus, Priority, TestCase } from '../types';
import { buildTestDataPackage, createSyntheticProfile, extractTestDataRequirement } from '../services/testDataStudioService';

const testCase = (summary = 'Profil für React und TypeScript prüfen'): TestCase => ({ caseId: 'TC-ITR-001', title: 'CV Import', summary, tags: [], priority: Priority.Medium, type: 'functional', preconditions: [], estimatedDurationMin: 5, estimatedEffort: 'S', steps: [], caseStatus: CaseStatus.NotStarted, lastUpdated: '2026-09-02T00:00:00Z', createdBy: 'tester' });

describe('Test Data Studio', () => {
  it('erzeugt ein synthetisches Standardprofil mit example.test', () => { const requirement = extractTestDataRequirement(testCase()); const profile = createSyntheticProfile(requirement); expect(profile.synthetic).toBe(true); expect(profile.email1.endsWith('@example.test')).toBe(true); expect(profile.testDataId).toContain('TESTDATA-'); });
  it('erzeugt maschinenlesbare Expected Values und Manifest ohne echte Daten', () => { const pack = buildTestDataPackage(testCase()); expect(pack.expectedValues.synthetic).toBe(true); expect(pack.manifest.containsRealPersonalData).toBe(false); expect(pack.artifacts.some(artifact => artifact.fileName === 'expected-values.json')).toBe(true); expect(pack.artifacts.some(artifact => artifact.fileName === 'test-data-manifest.json')).toBe(true); });
  it('markiert ungeklärte Anforderungen als Draft', () => { const pack = buildTestDataPackage(testCase()); expect(pack.requirement.readiness).toBe('Draft / Blocked'); });
  it('übernimmt bewusst fehlende Felder', () => { const pack = buildTestDataPackage(testCase('Fehlender Nachname und ungültige E-Mail-Adresse')); expect(pack.requirement.intentionallyMissingFields).toContain('Nachname'); expect(pack.requirement.intentionallyInvalidFields).toContain('E-Mail-Adresse'); });
});