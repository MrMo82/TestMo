
export enum Priority {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

export enum StepStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Passed = 'Passed',
  Failed = 'Failed',
  Blocked = 'Blocked'
}

export enum CaseStatus {
  Draft = 'Draft',
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Passed = 'Passed',
  Failed = 'Failed',
  Blocked = 'Blocked'
}

// --- Kontextmodell: Confirmation / Readiness ---

export enum ConfirmationStatus {
  Confirmed = 'Confirmed',
  ReviewRequired = 'Review Required',
  Deprecated = 'Deprecated'
}

export enum Readiness {
  Confirmed = 'Confirmed',
  ConditionalReady = 'Conditional Ready',
  Draft = 'Draft / Blocked'
}

// --- Kontextprofil (z.B. "Allgemein", "Hays Talent Delivery") ---

export interface ContextProfileSystem {
  key: string;
  label: string;
  description?: string;
}

export interface ContextProfileProcess {
  key: string;
  label: string;
  description?: string;
  targetMailbox?: string; // fachliche Ziel-Mailbox, nur wenn bestaetigt
  targetSpoolLabel?: string; // fachliche Spoolbezeichnung, nur wenn bestaetigt
  mandatoryRule?: string; // z.B. "update-only"
  confirmationStatus: ConfirmationStatus;
  systemChain?: string[]; // z.B. ['Freelancermap', 'Hays Web/API', 'Daxtra Capture', 'IRIS']
}

export interface ContextProfile {
  id: string;
  organization: string;
  name: string;
  version: string;
  status: 'active' | 'draft' | 'archived';
  systems: ContextProfileSystem[];
  processes: ContextProfileProcess[];
  fields: string[]; // Data-Dictionary-Entry-IDs, die zu diesem Profil gehoeren
  controlledValues: string[]; // ControlledValueSet-Keys, die zu diesem Profil gehoeren
  routingRules: string[]; // RoutingRule-IDs
  wordingRules: string[]; // TerminologyRule-IDs
  forbiddenTerms: string[];
  evidenceTypes: string[];
  qaRules: string[]; // kurze, strukturierte QA-Contract-Saetze
  dataDictionaryVersions: string[]; // verfuegbare/aktive Versionen
  createdAt: string;
  updatedAt: string;
}

// --- Data Dictionary ---

export interface DataDictionaryEntry {
  id: string;
  domain: string; // z.B. 'Website/EML', 'Daxtra Standard', 'Daxtra User Field', 'IRIS', 'Freelancermap API'
  displayName: string; // Hays-Anzeigename
  technicalName: string; // technischer Name bzw. Prefix (z.B. DXFNM)
  prefix?: string;
  sourceSystem?: string;
  targetSystem?: string;
  targetField?: string;
  description: string;
  allowedValues?: string[];
  requiredRule?: string;
  validationRule?: string;
  confirmationStatus: ConfirmationStatus;
  usageNotes?: string;
  sourceReference?: string;
  active: boolean;
  contextProfileId: string;
  dataDictionaryVersion: string;
  applicableProcesses?: string[]; // ContextProfileProcess-Keys
}

// --- kontrollierte Wertelisten ---

export interface ControlledValueSet {
  key: string;
  label: string;
  values: string[];
  multiSelect: boolean;
  required: boolean;
  applicableProjects?: string[]; // ContextProfile-IDs oder Projekttypen
  confirmationStatus: ConfirmationStatus;
  version: string;
}

// --- Terminologie- und Routingregeln ---

export interface TerminologyRule {
  id: string;
  forbiddenTerm: string;
  replacementGuidance: string;
  contextCondition?: string; // z.B. "IRIS ist Zielsystem"
  severity: 'error' | 'warning' | 'info';
  contextProfileId: string;
}

export interface RoutingRule {
  id: string;
  processKey: string;
  description: string;
  targetMailbox?: string;
  targetSpoolLabel?: string;
  mandatoryRule?: string;
  confirmationStatus: ConfirmationStatus;
  contextProfileId: string;
}

export interface SystemUrlEntry {
  id: string;
  environment: string;
  system: string;
  url: string;
  purpose?: string;
  status?: 'active' | 'inactive' | 'planned';
  note?: string;
}

export interface ProjectSettings {
  projectName: string;
  description: string;
  systems: string; // Comma separated list (IRIS, Salesforce, etc.) - legacy, weiterhin unterstuetzt
  urls: string; // Comma separated list - legacy, weiterhin unterstuetzt
  releaseVersion: string; // e.g., "IRIS 3.02.03 PF"
  qaInstruction?: string;
  strictQAContract?: boolean;
  artifactModeDefault?: 'auto' | 'testcase' | 'draft_backlog';

  // Erweiterter Kontext (optional, rueckwaertskompatibel)
  fixVersion?: string;
  contextProfileId?: string;
  dataDictionaryVersion?: string;
  selectedSystems?: string[];
  otherSystems?: string[];
  selectedEnvironments?: string[];
  selectedProcesses?: string[];
  selectedEvidenceTypes?: string[];
  systemUrls?: SystemUrlEntry[];
  irisFields?: string[];
  daxtraFields?: string[];
  websiteEmlFields?: string[];
  apiFields?: string[];
  forbiddenTerms?: string[];
  approvedRoutingKeys?: string[];
}

export interface Project {
  id: string;
  projectKey: string;
  name: string;
  description: string;
  goal: string;
  testObject: string;
  release: string;
  status: 'draft' | 'active' | 'archived';
  ownerId: string;
  inScope: string;
  outOfScope: string;
  unchangedProcesses: string;
  knownInterfaces: string;
  systems: string;
  channels: string;
  knownRisks: string;
  compliancePrivacy: string;
  entryCriteria: string;
  exitCriteria: string;
  goLiveCriteria: string;
  intakeStep: 1 | 2 | 3 | 4;
  createdAt: string;
  updatedAt: string;

  // Hays-Kontextmodell (optional, rueckwaertskompatibel - bestehende Projekte ohne diese Felder bleiben lesbar)
  testGoal?: string;
  strictQaContract?: boolean;
  defaultArtifactMode?: 'auto' | 'testcase' | 'draft_backlog';
  customQaInstruction?: string;
  organizationProfileId?: string;
  contextProfileId?: string;
  projectType?: string;
  dataDictionaryVersion?: string;
  selectedSystems?: string[];
  selectedEnvironments?: string[];
  selectedProcesses?: string[];
  selectedEvidenceTypes?: string[];
  terminologyRules?: string[];
  businessOwner?: string;
  technicalOwner?: string;
}

export interface Source {
  id: string;
  projectId: string;
  title: string;
  originalFileName: string;
  mimeType: string;
  sourceType: 'docx' | 'pdf' | 'xlsx' | 'csv' | 'txt' | 'json' | 'openapi' | 'image' | 'link' | 'text';
  version: number;
  approvalStatus: 'draft' | 'in_review' | 'approved' | 'rejected' | 'obsolete';
  authorityLevel: 'proposed' | 'confirmed' | 'authoritative';
  extractionStatus: 'not_started' | 'queued' | 'processing' | 'completed' | 'failed' | 'not_applicable';
  storagePath: string | null;
  sourceUrl: string | null;
  checksum: string | null;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceAnalysis {
  isMatch: boolean;
  confidence: number;
  reasoning: string;
  detectedIssues?: string[];
}

export interface TestStep {
  stepId: string;
  sequence: number;
  description: string;
  expectedResult: string;
  testData?: string;
  estimatedDurationMin: number;
  priority: Priority;
  dependencies?: string[];
  generatedExample?: boolean;
  notes?: string;
  status: StepStatus;
  actualDuration?: number;
  comment?: string;
  evidence?: string; // Base64 data URL for screenshots
  evidenceAnalysis?: EvidenceAnalysis; // AI Analysis result
}

export interface NegativeFlow {
  flowId: string;
  description: string;
  steps: TestStep[];
}

export interface CMPMeta {
  CHANNEL?: "Web" | "Email";
  WEBSITE?: "CH" | "DE" | "AT" | "DK" | "n/a";
  ACCOUNT_STATE?: "WebOnly" | "KnownEU" | "KnownCH" | "New";
  ENTITY_TYPE?: "Individual" | "PSOCompany";
  PSO_FLOW?: "None" | "APConsentsCompany" | "APConsentsPerEmployee" | "MASelfApplication" | "MAOptOutFromPSO";
  PSO_AP_CONSENT?: "Yes" | "No" | "Withdrawn";
  PSO_SCOPE?: "AllEmployees" | "SpecificEmployees";
  PSO_EMP_COUNT?: "Single" | "Bulk";
  PSO_MA_STATUS?: "New" | "KnownEU" | "KnownCH" | "OptedOutPSO" | "IndividualConsentYes" | "IndividualConsentNo";
  APP_TYPE?: "None" | "Initiative" | "OneProspect" | "MultiProspect";
  PROSPECT_COUNTRY?: "CH" | "DE" | "AT" | "DK" | "mix";
  CANDIDATE_GEO?: "CH" | "EU";
  CREATOR?: "InboundDE" | "RecruiterCH" | "RecruiterDE" | "RecruiterAT" | "RecruiterDK";
  INGESTION?: "Parser" | "Manual";
  CONTROLLER_SOURCE?: "Domain" | "Creator";
  CONSENT_PRE?: "None" | "Active" | "PendingDOI" | "Withdrawn";
  DOI_REQUIRED?: "Yes" | "No";
  DOI_OUTCOME?: "NotRequired" | "Sent" | "Confirmed" | "Expired" | "Bounced";
  PC_STATE?: "Empty" | "OneActive" | "TwoActive" | "OptedOut" | "ReOptIn";
  PC_LANGUAGE?: "fr" | "en" | "de-CH";
  RETENTION?: "Reset" | "ExpiredDeleteAll" | "ExpiredDeleteCountry";
  RETENTION_PERIOD?: "CH10y" | "EU3y";
  INTEGRATION?: "OK" | "Delayed" | "Failed" | "OutOfOrder" | "CPAPIMaintenance";
  DEDUP?: "Unique" | "DuplicateEmail";
  REFNR?: "Present" | "Missing" | "AmbiguousTitle";
  PLACEMENT_CH?: "None" | "Temp" | "Perm";
  AVG2?: "AutoYes" | "ManualYes" | "No_3moDelete" | "SalesBackYes";
  MARKETING_CONSENT?: "None" | "Active" | "Withdrawn" | "Pending";
  EMAIL_ROUTE?: "InboundCentralDE" | "DirectRecruiterCH" | "DirectRecruiterDE" | "DirectRecruiterAT" | "DirectRecruiterDK" | "n/a";
  ATTACHMENTS?: "CVOnly" | "CV+Cover" | "CV+Refs" | "MissingCV";
  GEO_DETECTION?: "Accurate" | "Inaccurate" | "VPNProxy";
  TEMPLATE_FALLBACK?: "None" | "EU";
}

export interface TerminologyFinding {
  severity: 'error' | 'warning' | 'info';
  term: string;
  message: string;
  ruleId?: string;
}

export interface HaysTestContext {
  system?: string[];
  environment?: string;
  applicationFlow?: string; // Bewerbungsweg
  testType?: string[];
  submissionType?: string;
  websiteEmlFields?: string[];
  daxtraFields?: string[];
  expectedDaxtraStatus?: string[];
  irisFields?: string[];
  expectedIrisOutcome?: string[];
  matchingResult?: string;
  documentRole?: string[];
  fileTypes?: string[];
}

export interface TestCase {
  caseId: string;
  title: string;
  summary: string;
  tags: string[];
  meta?: CMPMeta; // Strukturierte Dimensionen (optionales CMP-Kontextprofil)
  priority: Priority;
  type: 'functional' | 'regression' | 'smoke' | 'exploratory';
  preconditions: string[];
  estimatedDurationMin: number;
  estimatedEffort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  steps: TestStep[];
  negativeFlows?: NegativeFlow[];
  caseStatus: CaseStatus;
  lastUpdated: string;
  createdBy: string;
  executionDate?: string;
  
  // User Management
  assignedTo?: string; // Username of the assignee
  executedBy?: string; // Username of the person who executed/is executing

  // Hays-Kontextmodell (optional, rueckwaertskompatibel)
  contextProfileId?: string;
  dataDictionaryVersion?: string;
  readiness?: Readiness;
  haysContext?: HaysTestContext;
  evidenceRequirements?: string[];
  terminologyFindings?: TerminologyFinding[];
}

export interface DashboardStats {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  inProgress: number;
  passRate: number;
}

export interface User {
  username: string;
  name: string;
  role: 'Admin' | 'Project Owner' | 'Test Designer' | 'Tester' | 'Reviewer' | 'Viewer';
  avatarUrl?: string;
  initials?: string;
  color?: string; // Hex color for avatar bg
}

export interface ActivityLog {
  id: string;
  user: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'import' | 'login';
  target: string; // e.g. Case ID or "Bulk Import"
  details?: string;
  timestamp: string;
}
