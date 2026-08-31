# Zielarchitektur

## Leitentscheidung

TestMo Next bleibt eine Vite-React-TypeScript-SPA. Die bestehende UX wird selektiv übernommen; Domäne, Persistenz, Authentifizierung, Ausführung, Excel und AI werden schrittweise neu aufgebaut.

## Schichten

1. **App und Router**: React Router, geschützte Routen, responsive Shell, Projektkontext.
2. **Features**: Auth, Projekte, Quellen, Anforderungen, Risiken, Testdesign, Runs, Executions, Defects, Imports, Exports, Reports, Traceability und Administration.
3. **Domänenlogik**: reine TypeScript-Services für Quality Gates, Execution-Status, Pass-Rate, Business Keys, Import-Konflikte und Berechtigungen.
4. **Adapter**: Supabase Auth/Postgres/Storage, ExcelJS und serverseitiger AI-Adapter.
5. **Persistenz**: versionierte Supabase-Migrationen mit Projekt-Scope, Constraints, Indizes, RLS und Audit.

## Kernmodell

Ein Testfall beschreibt eine Prüfung. Eine genehmigte `test_case_version` ist unveränderlich und wird einem `test_run` zugeordnet. Jede Ausführung erzeugt eine `test_execution`; Ergebnisse und Evidence gehören zu dieser Ausführung und nicht zur Definition. Retests erzeugen eine weitere Ausführung.

Draft Scenarios bleiben eigene, nicht ausführbare Entwürfe und fließen niemals in Execution-Metriken ein. Readiness wird aus Quality Gates abgeleitet.

## Dienste

- `services/supabase/`: typisierte Datenzugriffe, Auth, Storage und Transaktionen.
- `services/excel/`: getrennte Generator-, Parser-, Manifest-, Normalisierungs- und Validierungslogik.
- `services/ai/`: provider-neutraler Job-Adapter; Provider-Aufruf nur in Supabase Edge Functions.
- `schemas/`: Zod-Schemas für Eingaben, Datenbankgrenzen, Excel-Zeilen und AI-Ausgaben.
- `utils/`: reine Berechnungen und Sicherheitshelfer ohne React-Abhängigkeit.

## Sicherheitsgrenzen

Browser erhält nur Supabase URL und Anon-Key. Service-Role-Key und AI-Provider-Key bleiben in Edge-Function-Secrets. Jede projektbezogene Abfrage wird durch Membership-RLS begrenzt; UI-Ausblendungen sind keine Autorisierung.

## Implementierungsstatus

Dieses Dokument beschreibt die Zielarchitektur. In Phase 0 ist sie noch nicht implementiert; der aktuelle Stand ist in `docs/CURRENT_STATE.md` und die Reihenfolge in `docs/MIGRATION_PLAN.md` festgehalten.
