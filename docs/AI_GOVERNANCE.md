# AI-Governance

## Aktueller Zustand

`services/geminiService.ts` ruft Gemini direkt aus dem Browser auf. Testfallgenerierung, Varianten, Defect-Report, Screenshot-Analyse und CSV-Import verwenden gemeinsame bzw. große Schemas; CMP/Hays-Anweisungen sind im Prompt fest eingebaut. Dies ist nicht produktionsfähig und wird erst nach Auth, Domäne, Quellen, Excel-Roundtrip und Execution-Modell ersetzt.

## Zielvertrag

Provider-Aufrufe laufen ausschließlich über eine geschützte Supabase Edge Function. Ein provider-neutraler Adapter erhält Jobtyp, Projekt, User, Modell, Prompt-Version und referenzierte Eingaben. Jeder Job besitzt ein eigenes Input-/Output-Zod-Schema.

Jobtypen: `analyze_project_intake`, `extract_source_statements`, `identify_conflicts`, `generate_test_conditions`, `generate_draft_scenarios`, `compile_test_cases`, `review_test_case`, `generate_test_data`, `suggest_traceability`, `generate_bug_report`, `suggest_excel_mapping`.

`ai_jobs` speichert Projekt/User, Provider/Modell, Prompt-Version, Input-Referenzen, Roh- und validierte Ausgabe, Validierung, Review-Status, akzeptierte/abgelehnte Änderungen, Fehler und Retry-Metadaten. Sensible Daten werden minimiert oder redigiert.

## Nicht verhandelbare Regeln

- AI schlägt vor; Menschen bestätigen.
- Keine erfundenen Fakten, Soll-Ergebnisse, Prioritäten, Source-Bestätigungen oder Freigaben.
- Keine automatische Persistenz ungültiger strukturierter Ausgabe.
- Keine direkte Überschreibung genehmigter Versionen.
- Jede Suggestion bleibt als Suggestion sichtbar und referenziert Quelle/Prompt-Version.
- Deterministische TestMo-XLSX-Imports verwenden niemals AI.

## Abnahmetests

Schemas müssen valide, invalide, unvollständige und unbekannte Felder prüfen. Review-Entscheidungen erzeugen Audit. Provider-Key darf nicht in Client-Bundle, Browser-Provider-Request, Repository oder Logs erscheinen.
