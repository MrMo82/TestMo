
export enum Priority {
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

export interface ProjectSettings {
  projectName: string;
  description: string;
  systems: string; // Comma separated list (IRIS, Salesforce, etc.)
  urls: string; // Comma separated list
  releaseVersion: string; // e.g., "IRIS 3.02.03 PF"
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

export interface TestCase {
  caseId: string;
  title: string;
  summary: string;
  tags: string[];
  meta?: CMPMeta; // Strukturierte Dimensionen
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
  role: 'Admin' | 'Tester' | 'Viewer';
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
