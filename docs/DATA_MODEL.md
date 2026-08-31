# Datenmodell

## Entitäten und Verantwortlichkeit

- `profiles`: Auth-User-Profil; keine Passwörter.
- `projects`: Projektname, Key, Ziel, Scope, Release, Owner und Lifecycle.
- `project_members`: User-Projekt-Rolle; zentrale Zugriffsbeziehung.
- `project_environments`: testbare Umgebung je Projekt.
- `sources`, `source_statements`: versionierte Quellen und reviewbare atomare Aussagen.
- `requirements`, `risks`, `test_conditions`: bestätigbare fachliche Testgrundlage.
- `draft_scenarios`: nicht ausführbare, offene Entwürfe.
- `test_suites`, `test_cases`, `test_case_versions`, `test_steps`: Design und unveränderliche ausführbare Versionen.
- `test_data_sets`, `test_data_records`: wiederverwendbare Testdaten.
- `test_runs`, `test_run_cases`: Planung genehmigter Versionen.
- `test_executions`, `step_results`: historische Ausführungen und Resultate.
- `evidence_files`: Storage-Metadaten, Scope und Verknüpfungen.
- `defects`, `defect_links`: persistente Fehler und flexible Traceability.
- `reviews`, `comments`, `activity_logs`: Entscheidungen, Zusammenarbeit und Audit.
- `imports`, `import_rows`, `exports`: Roundtrip- und Audit-Provenienz.
- `ai_jobs`: Vorschläge, Roh-/validierte Ausgabe, Review und Retry-Metadaten.
- `controlled_values`: projekt- oder systemweite kontrollierte Listen.

## Beziehungen und Regeln

- Jede Projekt-Entität trägt `project_id` direkt oder erreicht sie über eine geprüfte FK-Kette; RLS nutzt diese Beziehung.
- Jede Tabelle erhält UUID als Primärschlüssel, `created_at`, `updated_at`; relevante Tabellen zusätzlich `created_by`, `updated_by` und Lifecycle-/Soft-Delete-Felder.
- `test_case_versions` gehört zu genau einem `test_case`, besitzt eine eindeutige Versionsnummer und wird nach Approval nicht updatebar.
- `test_steps` gehören zu einer Version; sie tragen keine Execution-Status-, Notes- oder Evidence-Felder.
- `test_executions` referenziert Run und immutable Version. `step_results` referenziert Execution und Step und ist historisch append-orientiert.
- `draft_scenarios` haben keine direkte Ausführbarkeit und werden aus Pass-Rate und Execution-KPIs ausgeschlossen.
- `evidence_files` verweist auf private Storage-Pfade und auf Execution, Step Result oder Defect, nicht auf Base64 im Kerndatensatz.

## Constraints und Indizes

- UUID-FKs mit bewusstem `RESTRICT`, `CASCADE` oder Soft Delete je Lebenszyklus.
- Unique: `(project_id, project_key)`, Business Keys, `(test_case_id, version_number)`, `(execution_id, step_id)`, Manifest-/Import-IDs.
- Check/Lookup: Lifecycle, Readiness, Priorität, Execution-/Step-Status, Severity und Rollen.
- Indizes auf `project_id`, FKs, Status, Run, Version, Business Key und Zeitstempel; zusammengesetzte Indizes für Dashboard-Filter.
- Prüfungen für Sequenzen, positive Versionen und zulässige Statusübergänge.

## Audit und Löschung

Definitionen und genehmigte Versionen werden nicht überschrieben. Execution-, Result-, Defect- und Audit-Historie wird nicht durch Reset gelöscht. Quell- und Evidence-Löschung ist permission- und retention-gesteuert; Storage-Datei und Metadaten müssen konsistent behandelt werden.

## Migrationsstatus

Profiles/Auth sowie Projects/Memberships/Environments sind als Migrationen vorhanden. Sources und Design-Entitäten folgen danach, anschließend Execution/Defects/Audit/Import/Export/AI.
