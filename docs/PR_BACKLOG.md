# Pull-Request-Backlog

## PR 0: Analyse und Architektur-Dokumentation
- Ziel: belegten Ist-Zustand und kontrollierten Rebuild festhalten.
- Umfang: Phase-0-Dokumente, ADRs, Baseline.
- Ausgeschlossen: App-Verhalten, Schema, Löschung.
- Migrationen: keine.
- Abnahme: Buildstatus, Risiken, Sequenz und Pfade dokumentiert.
- Recovery: Dokumente separat revertierbar.

## PR 1: App-Shell und Routing
- Ziel: React Router, responsive Sidebar, Projektkontext, CMP-freie Shell.
- Ausgeschlossen: Auth und Datenmigration.
- Migrationen: keine. Abhängigkeit: PR 0.
- Tests: Routen, Protected-Route-Platzhalter, mobile Layouts.
- Security: keine Berechtigungsannahme aus Navigation.

## PR 2: Auth und Profile
- Supabase Auth, Sessions, Reset, `profiles`, geschützte Routen.
- Ausgeschlossen: Projektrollen.
- Migration: Profiles plus Trigger/RLS.
- Tests: Session-Lifecycle, Fehler, Passwortreset.
- Recovery: Legacy-Login bis Ersatz validiert.

## PR 3: Projekte, Membership, RLS
- Projekte, Mitglieder, Rollen, Environments, Intake.
- Migration: Projects/Members/Environments und Policies.
- Tests: Cross-Project-RLS und Rollenmatrix.
- Recovery: additive Migration, keine Datenlöschung.

## PR 4: Sources
- Storage, Metadaten, Version, Approval, Authority, Download/Delete.
- Migration: Sources/Statements-Basis und private Bucket-Policies.
- Tests: Scope, MIME/Größe, Duplicate, Signed URL.

## PR 5: Core Test Design
- Requirements, Risks, Conditions, Draft Scenarios, Suites, Cases, Versions, Steps, Gates.
- Migration: Design-Entitäten, Links, Immutability-Trigger/Policies.
- Tests: Gate-Regeln, Versionierung, Traceability.

## PR 6: Deterministischer XLSX-Export
- ExcelJS, Profile, Sheets, Manifest, IDs, Audit.
- Migration: Exports.
- Tests: stabile Sortierung, Manifest, Formelneutralisierung, Fixtures.

## PR 7: XLSX-Import und Roundtrip
- Staged Preview, Validierung, Duplikate, Konflikte, Foreign Mapping.
- Migration: Imports/Rows.
- Tests: Roundtrip, ungültige/duplizierte Workbooks, Recovery.

## PR 8: Runs und Execution
- Runs, Run Cases, Executions, Step Results, Retest-Historie, Evidence.
- Migration: Execution- und Storage-Metadaten.
- Tests: Statusaggregation, Historie, Pass-Rate ohne Drafts.

## PR 9: Defects
- Persistente Defects, Links, Evidence, Retest.
- Migration: Defects/Links.
- Tests: Prefill ohne Erfindungen, Scope, Lifecycle.

## PR 10: Reports und Traceability
- DB-nahe Aggregationen, Coverage, offene Risiken, Imports und Aktivitäten.
- Migration: erforderliche Indizes/Views.
- Tests: Nenner/Numerator und Filter.

## PR 11: Server-seitige AI-Foundation
- Edge Function, Adapter, Jobs, Schemas, Review.
- Migration: AI Jobs.
- Tests: Schema, Review, Secret-Scan.

## PR 12+: Einzelne AI-Workflows
- Je Job separater PR mit Prompt-Version, Tests, Review und Rollback.
- Abhängigkeit: PR 11 und alle MVP-Datenpfade.
