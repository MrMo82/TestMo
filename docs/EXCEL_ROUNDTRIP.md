# Excel-Roundtrip

## Ziel

Excel ist ein gleichwertiger Ausführungskanal. Application-owned XLSX-Dateien werden mit ExcelJS deterministisch erzeugt und ohne AI wieder eingelesen.

## Exportprofile

- **Design**: Cases, Steps, Data, Traceability, Sources/Assumptions.
- **Execution Pack**: Read Me, Cases, Steps, Data, Bug Log, Lists, Dashboard.
- **Full Project**: Design plus Draft Scenarios, Requirements, Risks, Runs, Executions und Bugs.

Verbindliche Blätter: `00_Read_Me`, `01_Test_Cases`, `02_Test_Steps`, `03_Bug_Log`, `04_Test_Data`, `05_Dashboard`, `06_Traceability`, `07_Lists`, `08_Sources_Assumptions`, `09_Draft_Scenarios`, `10_Requirements_Risks`, `11_Test_Runs`, `_TestMo_Manifest`.

## Manifest und IDs

Das versteckte Manifest enthält `schemaVersion`, `projectId`, `projectKey`, optional `testRunId`, `exportId`, `exportedAt`, `exportedBy`, `templateVersion`, `exportType` und einen Integritätsmarker. Relevante Zeilen führen technische UUIDs für Case, Version, Execution, Step, Step Result, Bug und optional `ExportRowId`; Business Keys bleiben sichtbar für Menschen.

## Importpipeline

Select/drop -> Parse ohne Persistenz -> Manifest prüfen -> Projekt/Run auflösen -> Schema/Template prüfen -> Duplikat prüfen -> Zeilen und Beziehungen validieren -> Preview mit Fehlern -> Konflikte entscheiden -> kontrollierte Persistenz -> Audit und Zusammenfassung.

Generated workbooks werden ausschließlich über IDs und erlaubte Lifecycle-Regeln importiert. Unbekannte IDs werden abgewiesen oder quarantänisiert; genehmigte Versionen werden nicht überschrieben. Ergebnisimporte schreiben Step Results auf eine bestehende Execution oder erzeugen nur nach expliziter Regel eine neue Execution. Historie bleibt erhalten.

Foreign workbooks benötigen explizite Auswahl von Projekt, Sheet und Importmodus, Spaltenmapping und Bestätigung. AI darf später Mapping vorschlagen, ist aber nicht erforderlich.

## Sicherheits- und Qualitätsregeln

Controlled Lists, Validierung, Filter, Freeze Panes, deterministische Sortierung, lesbare Breiten, geschützte Formeln/Technikbereiche und Read Me. Formeln werden bei Export neutralisiert; Formelergebnisse sind beim Import nicht autoritativ. Importdateien gelten als untrusted, HTML/Formeln werden nicht ausgeführt.

## Status

Noch nicht implementiert. Aktuell existiert nur CSV-Export in `utils/exportUtils.ts` und Gemini-basierter CSV-Import in `services/geminiService.ts`/`components/BulkUpload.tsx`; es gibt weder ExcelJS noch Manifest oder Roundtrip-Tests.
