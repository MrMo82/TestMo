import { TestCase, ProjectSettings } from '../types';

export type TestDataReadiness = 'Confirmed' | 'Conditional Ready' | 'Draft / Blocked';
export type ArtifactType = 'txt' | 'json';

export interface TestDataRequirement {
  caseId: string; projectId: string; scenarioType: string;
  profileReuseMode: 'new' | 'reuse' | 'version' | 'dedupe' | 'update';
  documentLanguage: 'de' | 'en'; candidateFields: Record<string, string>;
  intentionallyMissingFields: string[]; intentionallyInvalidFields: string[];
  roles: string[]; skills: string[]; workHistoryRequirements: string[];
  educationRequirements: string[]; documentRoles: string[]; fileTypes: string[];
  documentCount: number; expectedMainCv: boolean; matchingScenario: boolean;
  deduplicationScenario: boolean; updateScenario: boolean; negativeVariant?: string;
  fileNameRequirements: string[]; sizeRequirements: string[];
  protectionRequirements: string[]; corruptionRequirements: string[];
  expectedDaxtraFields: string[]; expectedIrisFields: string[];
  unresolvedRequirements: string[]; readiness: TestDataReadiness;
}

export interface SyntheticProfile {
  id: string; testDataId: string; displayName: string; firstName: string; lastName: string;
  email1: string; email2: string; mobile: string; telephone: string; street: string;
  postcode: string; city: string; country: string; nationality: string; dateOfBirth: string;
  availabilityDate: string; linkedinUrl: string; focusArea: string; employmentType: string;
  skills: string[]; roles: string[]; workHistory: Array<Record<string, unknown>>;
  educationHistory: Array<Record<string, unknown>>; language: 'de' | 'en'; synthetic: true;
  version: number; createdAt: string;
}
export interface TestDataArtifact { fileName: string; type: ArtifactType; mimeType: string; content: string; }
export interface TestDataPackage { testDataId: string; profile: SyntheticProfile; requirement: TestDataRequirement; artifacts: TestDataArtifact[]; expectedValues: Record<string, unknown>; manifest: Record<string, unknown>; }

const unique = (values: string[]) => [...new Set(values.map(value => value.trim()).filter(Boolean))];

export function extractTestDataRequirement(testCase: TestCase, settings?: ProjectSettings | null): TestDataRequirement {
  const context = testCase.haysContext || {};
  const corpus = [testCase.title, testCase.summary, ...testCase.preconditions, ...testCase.steps.flatMap(step => [step.description, step.expectedResult, step.testData || ''])].join(' ');
  const roles = unique(corpus.match(/(?:Senior |Lead )?(?:Software Engineer|Developer|Consultant|Projektmanager|Data Engineer|Tester|Recruiter)/gi) || []);
  const skills = unique(corpus.match(/\b(?:TypeScript|JavaScript|React|Java|Python|SQL|SAP|IRIS|Daxtra|API|Docker|AWS|Azure)\b/gi) || []);
  const lower = corpus.toLowerCase();
  const missing = ['Vorname', 'Nachname', 'E-Mail-Adresse'].filter(field => lower.includes(`fehlend${field === 'E-Mail-Adresse' ? 'e' : 'er'} ${field.toLowerCase()}`));
  const invalid = ['E-Mail-Adresse', 'Datum'].filter(field => lower.includes(`ungültig${field === 'Datum' ? 'es' : 'e'} ${field.toLowerCase()}`));
  const unresolved = testCase.readiness === 'Draft / Blocked' || !settings?.dataDictionaryVersion ? ['Data-Dictionary-Version nicht bestätigt'] : [];
  return { caseId: testCase.caseId, projectId: 'legacy-project', scenarioType: context.applicationFlow || testCase.type, profileReuseMode: lower.includes('dedup') ? 'dedupe' : lower.includes('update') ? 'update' : 'new', documentLanguage: lower.includes('english') || lower.includes('englisch') ? 'en' : 'de', candidateFields: {}, intentionallyMissingFields: missing, intentionallyInvalidFields: invalid, roles, skills, workHistoryRequirements: roles.length ? ['Chronologisch plausible, vollständig fiktive Stationen'] : [], educationRequirements: [], documentRoles: context.documentRole || ['CV'], fileTypes: context.fileTypes || ['txt'], documentCount: 1, expectedMainCv: true, matchingScenario: lower.includes('match'), deduplicationScenario: lower.includes('dedup'), updateScenario: lower.includes('update'), fileNameRequirements: [], sizeRequirements: [], protectionRequirements: [], corruptionRequirements: [], expectedDaxtraFields: context.daxtraFields || settings?.daxtraFields || [], expectedIrisFields: context.irisFields || settings?.irisFields || [], unresolvedRequirements: unresolved, readiness: unresolved.length ? 'Draft / Blocked' : 'Conditional Ready' };
}

export function createSyntheticProfile(requirement: TestDataRequirement, version = 1): SyntheticProfile {
  const suffix = requirement.caseId.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase() || 'CASE01';
  const roles = requirement.roles.length ? requirement.roles : ['Software Engineer'];
  const skills = requirement.skills.length ? requirement.skills : ['TypeScript', 'React', 'SQL'];
  return { id: `syn-profile-${suffix.toLowerCase()}-v${version}`, testDataId: `TESTDATA-${suffix}-001`, displayName: `Synthetic ${suffix} v${version}`, firstName: 'Mira', lastName: 'Beispiel', email1: `mira.beispiel.${suffix.toLowerCase()}@example.test`, email2: '', mobile: '+49 170 0000000', telephone: '', street: 'Teststraße 12', postcode: '00000', city: 'Teststadt', country: 'DE', nationality: 'DE', dateOfBirth: '1988-04-14', availabilityDate: '2030-01-15', linkedinUrl: '', focusArea: roles[0], employmentType: 'Permanent', skills, roles, workHistory: [{ companyName: 'RheinTech Solutions GmbH', roleTitle: roles[0], startDate: '2022-01', endDate: '2025-12', location: 'Teststadt', employmentType: 'Permanent', responsibilities: ['Fiktive Softwarelösungen umgesetzt'], technologies: skills, skills, synthetic: true }], educationHistory: [{ institution: 'Hochschule Teststadt', degree: 'B.Sc. Informatik', graduationYear: '2011', synthetic: true }], language: requirement.documentLanguage, synthetic: true, version, createdAt: new Date().toISOString() };
}

function profileText(profile: SyntheticProfile, requirement: TestDataRequirement) {
  const missing = new Set(requirement.intentionallyMissingFields);
  return ['SYNTHETISCHE TESTDATEN', `Test Data ID: ${profile.testDataId}`, `Name: ${missing.has('Vorname') ? '' : profile.firstName} ${missing.has('Nachname') ? '' : profile.lastName}`, `E-Mail: ${missing.has('E-Mail-Adresse') ? '' : profile.email1}`, `Telefon: ${profile.mobile}`, `Ort: ${profile.postcode} ${profile.city}`, `Rollen: ${profile.roles.join(', ')}`, `Skills: ${profile.skills.join(', ')}`, '', 'Arbeitshistorie', ...profile.workHistory.map(job => `${job.startDate} - ${job.endDate}: ${job.roleTitle} bei ${job.companyName}`), '', 'Dieses Dokument wurde ausschließlich für Softwaretests erstellt. Es beschreibt keine reale Person und keine tatsächlichen Beschäftigungsverhältnisse.'].join('\n');
}

export function buildTestDataPackage(testCase: TestCase, settings?: ProjectSettings | null): TestDataPackage {
  const requirement = extractTestDataRequirement(testCase, settings); const profile = createSyntheticProfile(requirement);
  const body = profileText(profile, requirement); const base = `${profile.testDataId}_${requirement.documentLanguage}`;
  const expectedValues = { testDataId: profile.testDataId, caseId: testCase.caseId, profileVersion: profile.version, synthetic: true, language: profile.language, candidateFields: profile, expectedDaxtraFields: requirement.expectedDaxtraFields, expectedIrisFields: requirement.expectedIrisFields, expectedSkills: profile.skills, expectedRoles: profile.roles, intentionallyMissingFields: requirement.intentionallyMissingFields, intentionallyInvalidFields: requirement.intentionallyInvalidFields, documentManifest: [{ fileName: `${base}.txt`, role: 'CV' }], expectedMainCv: true, comparisonRules: { 'First Name': 'Exact', 'Email 1': 'Case-insensitive', Skills: 'Set comparison' }, unresolvedExpectations: requirement.unresolvedRequirements };
  const artifacts: TestDataArtifact[] = [{ fileName: `${base}.txt`, type: 'txt', mimeType: 'text/plain', content: body }, { fileName: 'expected-values.json', type: 'json', mimeType: 'application/json', content: JSON.stringify(expectedValues, null, 2) }];
  const manifest = { generatorName: 'Hays TestFlow Test Data Studio', generatorVersion: '1.0.0', generatedAt: new Date().toISOString(), projectId: requirement.projectId, caseId: testCase.caseId, testDataId: profile.testDataId, profileId: profile.id, profileVersion: profile.version, synthetic: true, containsRealPersonalData: false, employmentHistorySynthetic: true, companyNamesMode: 'synthetic', documents: artifacts.map(artifact => ({ fileName: artifact.fileName, type: artifact.type, mimeType: artifact.mimeType })), intendedEnvironment: settings?.selectedEnvironments?.[0] || 'unspecified', retentionClass: 'Manual Retention', warnings: requirement.unresolvedRequirements, unresolvedRequirements: requirement.unresolvedRequirements };
  artifacts.push({ fileName: 'test-data-manifest.json', type: 'json', mimeType: 'application/json', content: JSON.stringify(manifest, null, 2) });
  return { testDataId: profile.testDataId, profile, requirement, artifacts, expectedValues, manifest };
}

export function downloadArtifact(artifact: TestDataArtifact) { const blob = new Blob([artifact.content], { type: artifact.mimeType }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = artifact.fileName; link.click(); URL.revokeObjectURL(link.href); }