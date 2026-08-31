# Ist-Zustand

## Repository

- Root: `/workspaces/TestMo`
- Stack: Vite 6, React 19, TypeScript 5.8, Recharts, Lucide React, `@supabase/supabase-js`, `@google/genai`.
- Einstieg: `index.tsx` rendert `App` aus `App.tsx`.
- Komponenten liegen derzeit direkt unter `components/`; Services unter `services/`; Hilfsfunktionen unter `utils/`.
- Es existiert kein `src/`-Feature-Modul, kein `supabase/migrations/`-Verzeichnis und keine `supabase/functions/`.
- Aktueller Branch: `rebuild/testmo-next`; der Arbeitsbaum enthielt vor Phase 0 bereits Änderungen in `components/ProjectSettingsModal.tsx`, `components/TestCaseGenerator.tsx`, `services/geminiService.ts` und `types.ts`.

## Baseline

| Prüfung | Ergebnis |
|---|---|
| `npm install` | Erfolgreich; 9 Audit-Meldungen, davon 8 high und 1 low |
| `npm run build` | Erfolgreich; Vite meldet einen JavaScript-Chunk >500 kB |
| `npx tsc --noEmit` | Fehlgeschlagen: `ImportMeta.env` fehlt in `services/supabaseClient.ts` mangels Vite-Typdeklaration |
| `npm run lint` | Nicht vorhanden |
| `npm test` | Nicht vorhanden |
| `rg` | Nicht installiert; Audit-Suchen wurden mit `grep`/`find` ausgeführt |

## Bestätigte Architektur

- `App.tsx` ist eine monolithische Shell ohne React Router. Die Navigation verwendet den lokalen Union-State `view`.
- `App.tsx` lädt und speichert Testfälle sowie Projekteinstellungen über `storageService`.
- `services/storageService.ts` verwendet `localStorage` als primäre Datenbank für Testfälle, Projektsettings, Benutzer und Aktivität.
- Vor Phase 2 enthielten `services/storageService.ts` und `components/Login.tsx` einen lokalen Demo-Login mit festem Zugang; dieser aktive Auth-Pfad wurde entfernt.
- `services/supabaseClient.ts` stellt Supabase-Auth-Hilfen bereit, wird aber vom App-Login nicht verwendet. Es gibt keine verifizierte Datenbankintegration.
- `vite.config.ts` definiert `process.env.API_KEY` und `process.env.GEMINI_API_KEY` aus `VITE_GEMINI_API_KEY` oder `GEMINI_API_KEY`. Damit wird ein Provider-Schlüssel in den Client-Build injizierbar.
- `services/geminiService.ts` importiert `@google/genai`, erstellt im Browser einen `GoogleGenAI`-Client und ruft `generateContent` direkt aus React-Komponenten auf.
- `components/TestCaseGenerator.tsx`, `CaseDetail.tsx`, `TestRunner.tsx` und `BulkUpload.tsx` verwenden diesen Browser-Service direkt.
- `types.ts` modelliert ein `TestCase` mit `TestStep[]`, `caseStatus`, `executionDate`, `executedBy`, Notizen, Evidence und Step-Status im selben Objekt.
- `utils/statusHelpers.ts` berechnet den Testfallstatus aus Step-Status. `components/Dashboard.tsx` berechnet Kennzahlen aus `TestCase.caseStatus`, nicht aus Testausführungen.
- `App.tsx` löscht bei Reset Status, Evidence und Notizen aus den Schritten. `CaseDetail.tsx` aktualisiert diese Felder direkt am Testfall.
- Identitäten werden an mehreren Stellen mit `Math.random()` oder zeitbasierten Strings erzeugt, unter anderem in `App.tsx`, `TestCaseGenerator.tsx`, `geminiService.ts`, `UserManagementModal.tsx` und `storageService.ts`.
- `utils/exportUtils.ts` exportiert semikolongetrennte CSV-Dateien für Standard und Zephyr. Es gibt keine XLSX-Erzeugung, kein Manifest und keine technischen UUIDs im Exportvertrag.
- `components/BulkUpload.tsx` liest CSV/Text und ruft `parseCSVToTestCases` auf. Diese Funktion importiert Daten batchweise über Gemini; es gibt keine deterministische Vorschau-, Manifest-, Duplikat- oder Konfliktpipeline.
- `DEPLOYMENT.md` enthält ein veraltetes Inline-SQL-Schema mit wenigen Tabellen und Policies wie `USING (true)` für alle authentifizierten Nutzer.
- Es gibt keine versionierten Migrationen, keine RLS-Verifikationstests und keinen kontrollierten Storage-Bucket-Vertrag.

## CMP-Kopplung

Bestätigt in `types.ts`, `services/geminiService.ts`, `components/TestCaseGenerator.tsx`, `components/ProjectSettingsModal.tsx`, `components/OnboardingModal.tsx`, `utils/exportUtils.ts` und mehreren UI-Texten:

- `CMPMeta` und `CMP_MATRIX` bilden eine feste CMP-Taxonomie.
- Prompts nennen CMP Schweiz, TestMo, Hays und Schweizer Testdaten/Branding.
- Projekteinstellungen starten mit `CMP Schweiz`.
- Onboarding beschreibt explizit CMP Schweiz.
- Exporttexte enthalten CMP-Dimensionsdaten.

## Nicht nachgewiesen / fehlt derzeit

- Keine echte Supabase-Auth-Verbindung im laufenden Login-Fluss.
- Keine Profile, Projektmitglieder, Rollenprüfung oder projektbezogene Autorisierung.
- Keine normalisierte Domain für Anforderungen, Risiken, Bedingungen, Szenarien, Versionen, Runs, Executions, Results, Defects, Evidence oder Audit.
- Keine Test-Case-Versionimmutabilität und kein Retest-Historienmodell.
- Keine XLSX-Roundtrip-Implementierung.
- Keine serverseitige AI-Funktion, runtime-validierte AI-Job-Verträge oder Review-Persistenz.
- Keine belastbare Datenbank- oder Integrationstest-Suite.

## Phase-2-Stand (Auth und Profile)

- Supabase Auth ist im aktiven Login-Fluss über `components/AuthProvider.tsx` und `components/Login.tsx` verdrahtet.
- `supabase/migrations/20260824140000_create_profiles.sql` legt `public.profiles`, einen Auth-Trigger und eine eigene Profil-RLS an.
- Ohne echte `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` zeigt die App einen Konfigurationsfehler; es gibt keinen lokalen Auth-Fallback mehr.
- Das bisherige lokale User-Management ist aus der aktiven Shell entfernt und bleibt bis zur Membership-Implementierung nur als Legacy-Datei erhalten.
- Die Supabase-Integration ist mangels Projekt-Credentials und ausgeführter Migration noch nicht gegen eine reale Instanz verifiziert.
- Bestehende Auth-User benötigen nachträglich `20260824180000_backfill_existing_profiles.sql`, da ein `auth.users`-Trigger nur neue User erfasst.

## Phase-3-Stand (Projekte und Membership)

- `supabase/migrations/20260824150000_create_projects_memberships_environments.sql` ergänzt Projekte, Memberships, Umgebungen, Rollenfunktionen, Owner-Trigger und projektbezogene RLS.
- `services/projectService.ts` kapselt das Laden und Anlegen von Projekten.
- `components/ProjectsPage.tsx` stellt die Supabase-basierte Projektliste und minimale Projektanlage bereit.
- Guided Intake und Projekt-Detailansicht sind für Basics, Scope und Qualität als speicherbarer Entwurf implementiert; der Quellen-Schritt verweist weiterhin auf Phase 4.
- Mitgliederverwaltung und Environment-UI sind noch nicht vollständig implementiert.

## Phase-4-Stand (Sources)

- `supabase/migrations/20260824170000_create_sources_storage.sql` ergänzt eine private Bucket-Konfiguration, Quellenmetadaten, Duplikat-Checksum und Storage-RLS.
- `services/sourceService.ts` validiert Dateityp und Größe, erzeugt SHA-256-Prüfsummen, sanitisiert Dateinamen und erstellt signierte Download-URLs.
- `components/SourcesPage.tsx` bietet projektbezogenen Upload, Liste, Download und Löschung.
- AI-Extraktion, Source Statements und Review-Workflow sind noch nicht implementiert.

## Referenzierte UX-Bausteine

`Dashboard.tsx`, `DashboardDrillDown.tsx`, `CaseList.tsx`, `CaseDetail.tsx`, `TestRunner.tsx`, `FailureDialog.tsx`, `DefectModal.tsx`, `ActivityFeed.tsx`, `ProjectSettingsModal.tsx`, `BulkUpload.tsx` und `UserManagementModal.tsx` enthalten wiederverwendbare Interaktionsmuster, sind aber fachlich und persistenzseitig an das Prototypmodell gebunden.
