# Migrationsplan

## Grundsätze

Forward-only-Migrationen, kleine überprüfbare Pull Requests, keine Löschung des Prototyps vor vorhandener Ersatzfunktion. Alte Daten werden nicht stillschweigend in autoritative neue Entitäten umgedeutet.

## Reihenfolge

1. **Phase 0 / PR 0**: Audit und Architektur-Dokumentation. Keine Verhaltensänderung. Abgeschlossen mit diesem Dokumentationssatz.
2. **PR 1**: Router und App-Shell; CMP-freie Navigation, Legacy-Screens bleiben erreichbar. Umgesetzt.
3. **PR 2**: Supabase Auth, Profile, Session-Lifecycle, geschützte Routen. Implementiert, reale Instanzprüfung ausstehend.
4. **PR 3**: `projects`, `project_members`, Rollen, Environments, Intake und Membership-RLS. Tabellen, Policies, Projektservice, Projektliste und speicherbarer Intake implementiert; Mitglieder-/Environment-UI bleibt ausstehend.
5. **PR 4**: Sources, Storage-Pfade, Metadaten, Status, Freigabe und Duplikatprüfung. Upload, private Storage-Policies, Metadatenliste und signierte Downloads implementiert; Review und Extraction bleiben ausstehend.
6. **PR 5**: Requirements, Risks, Conditions, Draft Scenarios, Suites, Cases, Versions, Steps, Gates und Traceability.
7. **PR 6**: ExcelJS Design-/Execution-/Full-Export, Manifest, technische IDs und Audit.
8. **PR 7**: deterministischer XLSX-Import mit Preview, Validierung, Duplikat- und Konfliktprüfung; danach Foreign-Workbook-Mapping.
9. **PR 8**: Runs, Run Cases, Executions, Step Results, Statusaggregation, Historie und Evidence.
10. **PR 9**: persistente Defects, Evidence-Verknüpfung und Retest-Verknüpfung.
11. **PR 10**: Reports, Dashboard-Aggregate und Traceability-Ansichten.
12. **PR 11**: serverseitige AI-Foundation, Job-/Schema-/Review-Modell; Browser-Gemini entfernen.
13. **PR 12+**: einzelne AI-Jobs und Workflows nach Governance.

## Datenmigration

- Der bestehende `localStorage`-State wird zunächst als Legacy-Importquelle behandelt, nicht als vertrauenswürdige Datenbank.
- Bestehende CMP-Felder werden nicht automatisch in generische Requirements oder Source Statements konvertiert.
- Testfälle mit gemischtem Ausführungszustand werden als Design-Draft plus ausdrücklich markierter historischer Import untersucht; keine Status-/Evidence-Löschung.
- Sichtbare IDs werden nicht als technische Schlüssel übernommen. Neue UUIDs und deterministische Business Keys werden in der Datenbank vergeben.
- Die bestehende `DEPLOYMENT.md`-SQL-Anleitung wird erst nach einer versionierten Migration ersetzt, nicht als Migration ausgeführt.

## Risiken und Rückfall

Jede Migration erhält eine neue Datei, Constraints werden vor Schreibpfaden aktiviert, Backfills sind idempotent und mit Importbericht versehen. Bei Fehlern bleibt der Legacy-Screen bis zum Abschluss des jeweiligen PRs verfügbar; Rückfall bedeutet Deaktivierung des neuen Pfads, nicht destruktives Zurückrollen produktiver Daten.
