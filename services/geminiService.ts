
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { TestCase, Priority, CaseStatus, StepStatus, TestStep, EvidenceAnalysis, ProjectSettings, CMPMeta } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface MediaInput {
    mimeType: string;
    data: string;
}

export interface DefectReport {
    title: string;
    description: string;
    stepsToReproduce: string;
    expectedVsActual: string;
    severity: "Critical" | "Major" | "Minor" | "Trivial";
    environment?: string;
    category?: string;
}

const SYSTEM_INSTRUCTION_BASE = `
Du bist ein präziser Testfall-Ersteller und UX-bewusster Testassistent spezialisiert auf fachliche Tester (Business User) ohne technische Vorerfahrung.
Du bist der Assistent von "TestMo", dem Testmanagement-Tool von MoFlowSystems bei Hays.

WICHTIGE SPRACHREGEL:
- Sprich den Tester/Nutzer immer mit "Du" an.
- Formuliere Testschritte IMMER im IMPERATIV (Befehlsform). 
  - Richtig: "Klicke auf Speichern", "Gib 'Max' ein", "Prüfe das Datum".

HAYS SPECIFIC GUIDELINES & NAMING CONVENTIONS:
1. TITEL FORMAT (Business Readable): "<Referenz-ID>: <Aussagekräftiger Titel in natürlicher Sprache>"
   - ZIELGRUPPE: Fachabteilung / Business Tester. Der Titel muss ohne technisches Wissen sofort verständlich sein.
   - VERBOTEN: Technische Kürzel, Snake_Case, CamelCase oder "Entwickler-Sprech".
   - GUT: "US-123: Bewerbung als neuer Kandidat einreichen"
   - GUT: "CMP-001: Datenlöschung nach Ablauf der Frist prüfen"
   - SCHLECHT: "US-123: Functional_SubmitApplication_Flow"
   - SCHLECHT: "CMP-001: Integration_Retention_Delete_E2E"

2. SCHRITT LIMIT: Maximal 12 Schritte pro Testfall. Ein Szenario pro Testcase (Wartbarkeit/Retestbarkeit).
3. RETEST REGEL: Wenn ein Schritt fehlschlägt, muss der gesamte Testcase neu getestet werden (kein Partial Retest).
4. KONTEXT VERSTÄNDNIS: Wenn der Input ein Feature Request ist (Acceptance Criteria, Risks), leite daraus direkt die Prüfpunkte ab.

Anforderungen an die Ausgabe:
1. Erzeuge eine Kurzbeschreibung (1–2 Sätze).
2. Erzeuge eine Vorbedingungsliste (z.B. "Du bist eingeloggt im UAT").
3. Erzeuge Schritt-für-Schritt-Anweisungen (Max 12).
4. TESTDATEN (WICHTIG): Generiere für JEDEN Schritt KONKRETE Testdaten (Schweizer Kontext: CHF, PLZ, Kantone).
5. META-DATEN: Fülle das 'meta'-Objekt basierend auf dem Kontext.
6. TAGS: Generiere Tags basierend auf den Meta-Daten (z.B. "Channel:Web", "Website:CH").
7. Markiere mögliche Fehlerpfade.
8. Gib pro Testcase 1–3 alternative/verzweigte Flows.
9. Bewerte Aufwand (T-Shirt S/M/L) und Dauer.

Format: Liefere striktes JSON.
`;

const META_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    CHANNEL: { type: Type.STRING, enum: ["Web", "Email"] },
    WEBSITE: { type: Type.STRING, enum: ["CH", "DE", "AT", "DK", "n/a"] },
    ACCOUNT_STATE: { type: Type.STRING, enum: ["WebOnly", "KnownEU", "KnownCH", "New"] },
    ENTITY_TYPE: { type: Type.STRING, enum: ["Individual", "PSOCompany"] },
    PSO_FLOW: { type: Type.STRING, enum: ["None", "APConsentsCompany", "APConsentsPerEmployee", "MASelfApplication", "MAOptOutFromPSO"] },
    PSO_AP_CONSENT: { type: Type.STRING, enum: ["Yes", "No", "Withdrawn"] },
    PSO_SCOPE: { type: Type.STRING, enum: ["AllEmployees", "SpecificEmployees"] },
    PSO_EMP_COUNT: { type: Type.STRING, enum: ["Single", "Bulk"] },
    PSO_MA_STATUS: { type: Type.STRING, enum: ["New", "KnownEU", "KnownCH", "OptedOutPSO", "IndividualConsentYes", "IndividualConsentNo"] },
    APP_TYPE: { type: Type.STRING, enum: ["None", "Initiative", "OneProspect", "MultiProspect"] },
    PROSPECT_COUNTRY: { type: Type.STRING, enum: ["CH", "DE", "AT", "DK", "mix"] },
    CANDIDATE_GEO: { type: Type.STRING, enum: ["CH", "EU"] },
    CREATOR: { type: Type.STRING, enum: ["InboundDE", "RecruiterCH", "RecruiterDE", "RecruiterAT", "RecruiterDK"] },
    INGESTION: { type: Type.STRING, enum: ["Parser", "Manual"] },
    CONTROLLER_SOURCE: { type: Type.STRING, enum: ["Domain", "Creator"] },
    CONSENT_PRE: { type: Type.STRING, enum: ["None", "Active", "PendingDOI", "Withdrawn"] },
    DOI_REQUIRED: { type: Type.STRING, enum: ["Yes", "No"] },
    DOI_OUTCOME: { type: Type.STRING, enum: ["NotRequired", "Sent", "Confirmed", "Expired", "Bounced"] },
    PC_STATE: { type: Type.STRING, enum: ["Empty", "OneActive", "TwoActive", "OptedOut", "ReOptIn"] },
    PC_LANGUAGE: { type: Type.STRING, enum: ["fr", "en", "de-CH"] },
    RETENTION: { type: Type.STRING, enum: ["Reset", "ExpiredDeleteAll", "ExpiredDeleteCountry"] },
    RETENTION_PERIOD: { type: Type.STRING, enum: ["CH10y", "EU3y"] },
    INTEGRATION: { type: Type.STRING, enum: ["OK", "Delayed", "Failed", "OutOfOrder", "CPAPIMaintenance"] },
    DEDUP: { type: Type.STRING, enum: ["Unique", "DuplicateEmail"] },
    REFNR: { type: Type.STRING, enum: ["Present", "Missing", "AmbiguousTitle"] },
    PLACEMENT_CH: { type: Type.STRING, enum: ["None", "Temp", "Perm"] },
    AVG2: { type: Type.STRING, enum: ["AutoYes", "ManualYes", "No_3moDelete", "SalesBackYes"] },
    MARKETING_CONSENT: { type: Type.STRING, enum: ["None", "Active", "Withdrawn", "Pending"] },
    EMAIL_ROUTE: { type: Type.STRING, enum: ["InboundCentralDE", "DirectRecruiterCH", "DirectRecruiterDE", "DirectRecruiterAT", "DirectRecruiterDK", "n/a"] },
    ATTACHMENTS: { type: Type.STRING, enum: ["CVOnly", "CV+Cover", "CV+Refs", "MissingCV"] },
    GEO_DETECTION: { type: Type.STRING, enum: ["Accurate", "Inaccurate", "VPNProxy"] },
    TEMPLATE_FALLBACK: { type: Type.STRING, enum: ["None", "EU"] },
  }
};

const TEST_CASE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    caseId: { type: Type.STRING },
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    meta: META_SCHEMA, // Added Meta Schema
    priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
    type: { type: Type.STRING, enum: ["functional", "regression", "smoke", "exploratory"] },
    preconditions: { type: Type.ARRAY, items: { type: Type.STRING } },
    estimatedDurationMin: { type: Type.INTEGER },
    estimatedEffort: { type: Type.STRING, enum: ["XS", "S", "M", "L", "XL"] },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepId: { type: Type.STRING },
          sequence: { type: Type.INTEGER },
          description: { type: Type.STRING },
          expectedResult: { type: Type.STRING },
          testData: { type: Type.STRING, description: "Konkrete Beispiele, z.B. 'Name: Müller, Betrag: 500 CHF'" },
          estimatedDurationMin: { type: Type.INTEGER },
          priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          generatedExample: { type: Type.BOOLEAN },
          notes: { type: Type.STRING },
        },
        required: ["stepId", "sequence", "description", "expectedResult", "estimatedDurationMin", "priority"]
      }
    },
    negativeFlows: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                flowId: {type: Type.STRING},
                description: {type: Type.STRING},
                steps: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            stepId: { type: Type.STRING },
                            sequence: { type: Type.INTEGER },
                            description: { type: Type.STRING },
                            expectedResult: { type: Type.STRING },
                            status: { type: Type.STRING, enum: ["NotStarted"] }
                        }
                    }
                }
            }
        }
    }
  },
  required: ["caseId", "title", "summary", "priority", "steps", "preconditions", "estimatedEffort"]
};

const BULK_IMPORT_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: TEST_CASE_SCHEMA
};

const VARIANTS_SCHEMA: Schema = {
    type: Type.ARRAY,
    items: TEST_CASE_SCHEMA
};

const DEFECT_REPORT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Kurzer, prägnanter Fehler-Titel für Jira" },
    description: { type: Type.STRING, description: "Detaillierte Fehlerbeschreibung" },
    stepsToReproduce: { type: Type.STRING, description: "Nummerierte Liste der Schritte bis zum Fehler" },
    expectedVsActual: { type: Type.STRING, description: "Erwartetes vs. Tatsächliches Ergebnis" },
    severity: { type: Type.STRING, enum: ["Critical", "Major", "Minor", "Trivial"] }
  },
  required: ["title", "description", "stepsToReproduce", "expectedVsActual", "severity"]
};

const SCREENSHOT_ANALYSIS_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        isMatch: { type: Type.BOOLEAN, description: "Stimmt das Bild mit dem erwarteten Ergebnis überein?" },
        confidence: { type: Type.INTEGER, description: "Sicherheit der Einschätzung (0-100)" },
        reasoning: { type: Type.STRING, description: "Begründung der Analyse" },
        detectedIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste gefundener Fehler (falls vorhanden)" }
    },
    required: ["isMatch", "confidence", "reasoning"]
};

// --- HELPER FUNCTIONS ---

// Delay helper for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper logic for API calls
// Updated to handle 429 errors with aggressive backoff and nested error object detection
async function runWithRetry<T>(
    operation: () => Promise<T>, 
    retries = 5, 
    baseDelay = 4000
): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            const msg = error?.message || '';
            const status = error?.status;
            const nestedCode = error?.error?.code; // Google GenAI specific nested error
            const nestedStatus = error?.error?.status;

            const isRateLimit = 
                msg.includes('429') || 
                msg.includes('quota') || 
                msg.includes('503') || 
                status === 429 || 
                status === 503 ||
                nestedCode === 429 ||
                nestedStatus === 'RESOURCE_EXHAUSTED';

            if (isRateLimit) {
                const waitTime = baseDelay * Math.pow(2, i) + (Math.random() * 1000); // jitter
                console.warn(`Gemini API Limit hit (429/503). Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
                await delay(waitTime);
                continue;
            }
            // For other errors, throw immediately
            throw error;
        }
    }
    throw lastError;
}

// Helper to remove markdown code blocks if AI adds them
const cleanJsonOutput = (text: string): string => {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json/, '').replace(/```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```/, '').replace(/```$/, '');
    }
    return clean;
};

// Safe JSON Parse
const safeJsonParse = (text: string) => {
    try {
        return JSON.parse(cleanJsonOutput(text));
    } catch (e) {
        console.error("JSON Parse Error. Raw Text:", text);
        throw new Error("Antwort der KI war unvollständig (Token Limit). Bitte versuche es erneut oder kürze den Input.");
    }
};

// --- API FUNCTIONS ---

export const generateTestCaseFromAI = async (
  context: string, 
  userRole: string = "Case Manager", 
  priorityInput: string = "Medium",
  mediaInput?: MediaInput,
  projectSettings?: ProjectSettings
): Promise<TestCase> => {
  // Using explicit high retry config for reliability
  return runWithRetry(async () => {
    try {
        const projectContext = projectSettings ? `
        PROJEKT KONTEXT:
        Projekt: ${projectSettings.projectName}
        Beschreibung: ${projectSettings.description}
        Systeme im Einsatz: ${projectSettings.systems}
        URLs: ${projectSettings.urls}
        Aktuelles Release: ${projectSettings.releaseVersion}
        ` : "";

        let textPrompt = `
          Erstelle einen Testcase für CMP Schweiz (Projekt TestMo).
          ${projectContext}
          
          Kontext/Anweisung: ${context}
          User Rolle: ${userRole}
          Gewünschte Priorität: ${priorityInput}
          
          Achte besonders auf realistische Testdaten im Feld 'testData' für jeden Schritt passend zu den Systemen (${projectSettings?.systems || 'Standard'}).
          Wenn Input ein Feature Request ist, extrahiere Acceptance Criteria.
          
          WICHTIG: 
          1. Analysiere den Kontext und fülle das 'meta'-Objekt mit den passenden Werten aus der Taxonomie (z.B. CHANNEL, WEBSITE, ENTITY_TYPE).
          2. Generiere einen lesbaren Titel für Fachanwender: "<ID>: <Natürlicher Satz>". KEIN Snake_Case!
        `;

        if (mediaInput) {
            if (mediaInput.mimeType === 'application/pdf') {
                textPrompt += "\nHINWEIS: Ein Prozessdokument (PDF) wurde bereitgestellt. Analysiere den Prozessfluss.";
            } else {
                textPrompt += "\nHINWEIS: Ein Screenshot/Bild des UIs wurde bereitgestellt. Analysiere das Bild.";
            }
        }

        const contents = [];
        
        if (mediaInput && mediaInput.data) {
            let cleanBase64 = mediaInput.data;
            if (cleanBase64.startsWith('data:')) {
                cleanBase64 = cleanBase64.split(',')[1];
            }

            contents.push({
                inlineData: {
                    mimeType: mediaInput.mimeType,
                    data: cleanBase64
                }
            });
        }

        contents.push({ text: textPrompt });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash', 
          contents: { parts: contents },
          config: {
            systemInstruction: SYSTEM_INSTRUCTION_BASE,
            responseMimeType: "application/json",
            responseSchema: TEST_CASE_SCHEMA,
            temperature: 0.3,
          }
        });

        const text = response.text;
        if (!text) throw new Error("Keine Antwort von der KI erhalten.");

        const rawData = safeJsonParse(text);

        const hydratedCase: TestCase = {
          ...rawData,
          caseStatus: CaseStatus.NotStarted,
          lastUpdated: new Date().toISOString(),
          createdBy: userRole,
          steps: rawData.steps.map((s: any) => ({
            ...s,
            status: StepStatus.NotStarted,
            testData: s.testData || ""
          }))
        };

        return hydratedCase;

      } catch (error) {
        console.error("Error generating test case:", error);
        throw error;
      }
  }, 5, 4000);
};

export const refineTestCase = async (currentCase: TestCase, projectSettings?: ProjectSettings): Promise<TestCase> => {
    // Using explicit high retry config for reliability
    return runWithRetry(async () => {
        try {
            const projectContext = projectSettings ? `
            PROJEKT KONTEXT:
            Projekt: ${projectSettings.projectName}
            Systeme: ${projectSettings.systems}
            ` : "";

            // Remove circular references or heavy data if necessary, keep it simple for the prompt
            const caseSummary = JSON.stringify({
                title: currentCase.title,
                summary: currentCase.summary,
                steps: currentCase.steps.map(s => ({ desc: s.description, expected: s.expectedResult, data: s.testData })),
                meta: currentCase.meta // Include existing meta
            });

            const prompt = `
            Optimiere und verbessere den folgenden Testfall.
            Input Testfall: ${caseSummary}
            
            ${projectContext}
            
            AUFGABEN:
            1. TITEL ÜBERARBEITEN: Schreibe den Titel so um, dass er für Fachanwender (Business) sofort verständlich ist. 
               - Entferne technisches Kauderwelsch (Snake_Case, CamelCase, englische Dev-Begriffe).
               - Format: "<ID>: <Deutscher Satz>".
               - Beispiel: Statt "CMP-01: Functional_Delete_Data" -> "CMP-01: Datenlöschung erfolgreich durchführen".
            2. Formuliere ALLE Schritte präzise im IMPERATIV (z.B. "Klicke", "Wähle").
            3. Ergänze fehlende oder generische Testdaten mit realistischen Werten.
            4. Stelle sicher, dass die Schrittanzahl zwischen 5 und 12 liegt (splitte oder fasse zusammen wenn nötig).
            5. Ergänze oder korrigiere das 'meta'-Objekt basierend auf der Taxonomie.
            6. Ergänze "Negative Flows" basierend auf dem Szenario, falls noch keine da sind.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION_BASE,
                    responseMimeType: "application/json",
                    responseSchema: TEST_CASE_SCHEMA,
                    temperature: 0.3,
                }
            });

            const text = response.text;
            if (!text) throw new Error("Keine Antwort von der KI erhalten.");
            
            const rawData = safeJsonParse(text);

            // Preserve status/ID from original case but take new content
            return {
                ...rawData,
                caseId: currentCase.caseId, // Keep ID
                caseStatus: currentCase.caseStatus, // Keep Status
                createdBy: currentCase.createdBy,
                lastUpdated: new Date().toISOString(),
                steps: rawData.steps.map((s: any) => ({
                    ...s,
                    status: StepStatus.NotStarted, // Reset steps for safety as content changed
                    testData: s.testData || ""
                }))
            };

        } catch (error) {
            console.error("Refinement failed:", error);
            throw error;
        }
    }, 5, 4000);
};

export const generateVariantsFromCase = async (currentCase: TestCase, projectSettings?: ProjectSettings): Promise<TestCase[]> => {
    return runWithRetry(async () => {
        try {
            const projectContext = projectSettings ? `
            PROJEKT KONTEXT: ${projectSettings.projectName} (${projectSettings.systems})
            ` : "";

            const caseData = JSON.stringify({
                title: currentCase.title,
                summary: currentCase.summary,
                steps: currentCase.steps.map(s => s.description),
                meta: currentCase.meta
            });

            const prompt = `
            Analysiere diesen Testfall (Happy Path) und seine Meta-Daten.
            Generiere 3 bis 5 NEUE Testfälle, die Negativ-Szenarien, Randfälle oder Fehlerpfade abdecken.
            
            Input Case: ${caseData}
            ${projectContext}
            
            REGELN:
            1. TITEL: "<ID>: <Verständlicher Titel für die Negativ-Variante>". (Kein Snake_Case!)
            2. Setze den 'caseStatus' für alle auf 'Draft'.
            3. Füge 'AI-Variant' zu den Tags hinzu.
            4. Variiere auch die Meta-Daten wenn sinnvoll (z.B. anderer CHANNEL oder WEBSITE).
            5. Denke an Timeouts, Validierungsfehler, Berechtigungen.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION_BASE,
                    responseMimeType: "application/json",
                    responseSchema: VARIANTS_SCHEMA,
                    temperature: 0.6, // Higher temperature for creativity
                }
            });

            const text = response.text;
            if (!text) throw new Error("Keine Antwort von der KI erhalten.");
            
            const rawData = safeJsonParse(text);

            // Ensure they have fresh IDs and Draft status
            return rawData.map((c: any) => ({
                ...c,
                caseId: `TC-${Math.floor(Math.random() * 100000)}`,
                caseStatus: CaseStatus.Draft,
                lastUpdated: new Date().toISOString(),
                createdBy: "AI-Variant-Generator",
                steps: c.steps.map((s: any) => ({
                    ...s,
                    status: StepStatus.NotStarted,
                    testData: s.testData || ""
                }))
            }));

        } catch (error) {
            console.error("Variant generation failed:", error);
            throw error;
        }
    }, 5, 4000);
};

export const parseCSVToTestCases = async (csvContent: string): Promise<TestCase[]> => {
  try {
    // 1. Clean and split input
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    
    // 2. Identify header (assume first row)
    const header = lines[0];
    const dataLines = lines.slice(1);
    
    // 3. Batch process to avoid Token Limits / XHR Errors (500)
    // Batch size REDUCED to 3 to prevent "Unterminated string" / Token Limits
    const BATCH_SIZE = 3; 
    const batches: string[][] = [];

    for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
        batches.push(dataLines.slice(i, i + BATCH_SIZE));
    }

    console.log(`Starting Batch Processing. Total lines: ${dataLines.length}, Batches: ${batches.length}`);

    let allCases: TestCase[] = [];

    for (let i = 0; i < batches.length; i++) {
        const batchLines = batches[i];
        const batchContent = [header, ...batchLines].join('\n');
        
        console.log(`Processing Batch ${i+1}/${batches.length}`);

        const prompt = `
          Du bekommst eine Liste von CSV-Zeilen. Konvertiere sie in validierte JSON Testfälle.
          Die erste Zeile ist der Header (enthält ggf. CMP Taxonomie Felder wie CHANNEL, ENTITY_TYPE, PSO_FLOW etc.).
          
          Regeln:
          1. Wenn Felder fehlen, improvisiere sinnvoll basierend auf dem Titel.
          2. WICHTIG: Mappe die CSV Spalten auf das 'meta' Objekt gemäß der Taxonomie.
          3. Füge alle Meta-Werte zusätzlich als TAGS hinzu (z.B. "Channel:Web").
          4. TITEL BEREINIGUNG: Falls der CSV-Titel technisch ist (z.B. "Functional_Test_01"), schreibe ihn in einen lesbaren Satz um.
          
          CSV Content:
          ${batchContent}
        `;

        await runWithRetry(async () => {
            try {
                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: prompt,
                  config: {
                    systemInstruction: "Du bist ein Datenverarbeitungs-Assistent. Verwandle CSV in unser TestCase JSON Format mit Meta-Daten und lesbaren Titeln.",
                    responseMimeType: "application/json",
                    responseSchema: BULK_IMPORT_SCHEMA,
                    temperature: 0.1,
                  }
                });

                const text = response.text;
                if (text) {
                    const batchResult = safeJsonParse(text);
                    allCases = [...allCases, ...batchResult];
                }
            } catch (batchError) {
                console.error(`Error in Batch ${i+1}:`, batchError);
                throw batchError; // Let retry logic handle it or fail batch
            }
        }, 5, 5000); // Strict retry config for bulk processing
        
        // Add a significant pause between batches to be nice to rate limits
        await delay(2000);
    }

    if (allCases.length === 0) {
        throw new Error("Konnte keine Testfälle generieren. Bitte prüfe das Format.");
    }

    return allCases.map((c: any) => ({
      ...c,
      caseStatus: CaseStatus.NotStarted,
      lastUpdated: new Date().toISOString(),
      createdBy: "BulkImport",
      steps: c.steps.map((s: any) => ({
        ...s,
        status: StepStatus.NotStarted,
        testData: s.testData || ""
      }))
    }));

  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw error;
  }
};

export const generateDefectReport = async (testCase: TestCase, failedStep: TestStep): Promise<DefectReport> => {
    return runWithRetry(async () => {
        try {
            const prompt = `
            Ein Testschritt ist fehlgeschlagen. Erstelle einen Bug-Report für Jira.
            Testfall: ${testCase.title}
            Failed Step: ${failedStep.description}
            Expected: ${failedStep.expectedResult}
            Notes: ${failedStep.notes || "N/A"}
            Environment info (Meta): ${JSON.stringify(testCase.meta || {})}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: "Du bist ein QA Lead. Schreibe präzise Bug Reports auf Deutsch. Nutze Hays Kategorien wenn möglich.",
                    responseMimeType: "application/json",
                    responseSchema: DEFECT_REPORT_SCHEMA,
                    temperature: 0.4
                }
            });
            
            const text = response.text;
            if (!text) throw new Error("No response from AI");

            return safeJsonParse(text) as DefectReport;

        } catch (error) {
            console.error("Error generating defect:", error);
            throw error;
        }
    }, 5, 4000);
}

export const analyzeScreenshot = async (expectedResult: string, imageData: string, projectSettings?: ProjectSettings): Promise<EvidenceAnalysis> => {
    return runWithRetry(async () => {
        try {
            let cleanBase64 = imageData;
            if (cleanBase64.startsWith('data:')) {
                cleanBase64 = cleanBase64.split(',')[1];
            }

            const projectContext = projectSettings ? `im System-Kontext: ${projectSettings.systems} (${projectSettings.urls})` : "";

            const prompt = `
            Vergleiche diesen Screenshot mit dem erwarteten Ergebnis ${projectContext}.
            Erwartetes Ergebnis: "${expectedResult}"
            
            Prüfe auf:
            1. Übereinstimmung mit Erwartung.
            2. Fehlermeldungen (rot).
            3. Branding-Fehler (Hays Logo etc).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
                        { text: prompt }
                    ]
                },
                config: {
                    systemInstruction: "Du bist ein visueller QA-Assistent.",
                    responseMimeType: "application/json",
                    responseSchema: SCREENSHOT_ANALYSIS_SCHEMA,
                    temperature: 0.1
                }
            });

            const text = response.text;
            if (!text) throw new Error("No analysis from AI");
            return safeJsonParse(text) as EvidenceAnalysis;

        } catch (error) {
            console.error("Screenshot analysis failed", error);
            throw error;
        }
    }, 5, 4000);
}
