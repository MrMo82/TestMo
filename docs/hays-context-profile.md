# Hays Kontextprofil - Architektur, Betrieb und Nutzung

Dieses Dokument beschreibt die Erweiterung von TestMo Next um ein konfigurierbares,
organisations-/domänenspezifisches Kontextmodell (siehe Aufgabenstellung "TestMo Next zu einer
konfigurierbaren, Hays-spezifischen Testmanagement-App erweitern") sowie das initiale
Kontextprofil "Hays Talent Delivery".

## 1. Architektur des Kontextmodells

Die Erweiterung ist **additiv**: Bestehende Projekte, Testfälle, `ProjectSettings` und
Import-/Exportlogik funktionieren unverändert weiter. Neue Felder sind überall optional.

Neue Typen in [`types.ts`](../types.ts):

- `ContextProfile` – Organisations-/Domänenkatalog (z.B. `general`, `hays-talent-delivery`) mit
  Systemen, Prozessen, Terminologie-/Routingregel-Referenzen, Evidence-Typen und QA-Regeln.
- `DataDictionaryEntry` – ein Feld/Mapping (z.B. `DXFNM -> IRIS Vorname`) mit
  `confirmationStatus` (`Confirmed` / `Review Required` / `Deprecated`).
- `ControlledValueSet` – kontrollierte Dropdown-Werteliste (SYSTEM, ENVIRONMENT, DAXTRA_STATUS, …).
- `TerminologyRule` – verbotener/zu ersetzender Begriff mit Ersatz-Hinweis und Schweregrad.
- `RoutingRule` – fachlicher Zielweg eines Prozesses (Ziel-Mailbox, Spool-Label, Pflichtregel).
- `TestCase.haysContext`, `TestCase.contextProfileId`, `TestCase.dataDictionaryVersion`,
  `TestCase.readiness`, `TestCase.terminologyFindings` – projektbezogener Testfall-Kontext.
- `Project.contextProfileId`, `Project.projectType`, `Project.selectedSystems`, … – optionale
  Erweiterung des bestehenden `Project`-Modells (siehe `docs/DATA_MODEL.md`).

Seed-Daten (Systeme, Prozesse, Data Dictionary, kontrollierte Werte, Terminologie-/Routingregeln)
liegen als typisierte, statische Struktur in [`data/hays/contextProfile.ts`](../data/hays/contextProfile.ts).
Diese Datei ist die Client-Kopie der Supabase-Seed-Daten und wird von
[`services/contextProfileService.ts`](../services/contextProfileService.ts) für UI und
KI-Kontextaufbau genutzt.

## 2. Supabase-Tabellen

Migration [`20260901120000_add_context_profiles.sql`](../supabase/migrations/20260901120000_add_context_profiles.sql):

| Tabelle | Zweck | RLS |
|---|---|---|
| `context_profiles` | Organisationskatalog (Allgemein, Hays Talent Delivery) | lesbar für alle authentifizierten Nutzer (Referenzdaten, keine Bewerberdaten); Schreibzugriff nur Admins |
| `data_dictionary_entries` | Feld-/Mapping-Katalog je Profil + Version | wie oben |
| `controlled_value_sets` | Dropdown-Kataloge (SYSTEM, ENVIRONMENT, …) | wie oben |
| `terminology_rules` | Verbotene Begriffe + Ersatzregel | wie oben |
| `routing_rules` | Fachliche Zielwege je Prozess | wie oben |
| `project_context_selections` | 1:1-Zuordnung Projekt → Kontextprofil, Systeme, Prozesse, Owner, QA Governance | **strikt an bestehende Projekt-Membership-RLS gebunden** (`is_project_member`/`has_project_role`) |

Seed-Daten für das Hays-Profil (Systeme, Prozesse, Data Dictionary G1–G5, kontrollierte
Wertelisten H1–H18, Terminologie-/Routingregeln) liegen in
[`20260901121000_seed_hays_context_data.sql`](../supabase/migrations/20260901121000_seed_hays_context_data.sql).
Alle Inserts nutzen `on conflict do nothing` und sind daher wiederholbar/idempotent.

**Wichtig:** `context_profiles`, `data_dictionary_entries`, `controlled_value_sets`,
`terminology_rules` und `routing_rules` enthalten ausschließlich konfigurative Referenzwerte
(Systemnamen, Feldbezeichnungen, Mailbox-Namen). Es werden keine Bewerber-/Kandidatendaten in
diesen Tabellen gespeichert. Die tatsächliche projektbezogene Zuordnung
(`project_context_selections`) folgt exakt der bestehenden Membership-Autorisierung aus
`project_members`/`has_project_role` – ein Nutzer ohne Projektmitgliedschaft sieht keine
Kontextauswahl eines fremden Projekts (Anforderung F/AC einschlägig).

## 3. Migrationen einspielen

```bash
# lokal mit Supabase CLI (falls konfiguriert)
supabase db push

# oder manuell in der SQL-Konsole des Projekts, in Reihenfolge:
# 1) 20260901120000_add_context_profiles.sql
# 2) 20260901121000_seed_hays_context_data.sql
```

Beide Migrationen sind additiv und verändern keine bestehenden Spalten/Tabellen. Bestehende
Projekte und Testfälle bleiben unverändert lesbar (AC-02).

## 4. Neue Data-Dictionary-Version anlegen

1. Neuen Versionsstring festlegen (z.B. `v2-2027-01`).
2. Neue Zeilen in `data_dictionary_entries` mit `data_dictionary_version = 'v2-2027-01'` einfügen
   (alte Version bleibt bestehen und referenzierbar).
3. `context_profiles.data_dictionary_versions` um den neuen Wert ergänzen.
4. Optional: Client-Seed in `data/hays/contextProfile.ts` synchron nachziehen, falls die Version
   auch offline/ohne Supabase-Verbindung nutzbar sein soll.
5. Bestehende Testfälle behalten ihre historische `dataDictionaryVersion` – so bleibt
   nachvollziehbar, mit welchem Kontext ein Testfall erzeugt wurde (AC-16).

## 5. Pflege kontrollierter Wertelisten

Neue/geänderte Werte werden als neue Zeile in `controlled_value_sets` mit neuer `version`
eingefügt (nicht die bestehende Zeile überschreiben), damit historische Testfälle nicht rückwirkend
ihre Grundlage verlieren.

## 6. Confirmed vs. Review Required

- **Confirmed**: fachlich/technisch bestätigter Wert. Die KI darf ihn als verbindliches Soll
  verwenden.
- **Review Required**: dokumentierter, aber noch nicht final bestätigter Wert. Die KI darf ihn
  nennen, aber nicht als verbindliches Soll behaupten (siehe `services/terminologyService.ts`,
  `isReviewRequired`). In der UI wird dieser Status orange gekennzeichnet, Confirmed-Werte grün.
- **Deprecated**: nicht mehr zu verwenden.

## 7. Neues Organisationsprofil erstellen

1. Neue Zeile in `context_profiles` (z.B. `id = 'acme-corp'`).
2. Systeme/Prozesse als JSONB analog zum Hays-Profil pflegen.
3. Zugehörige `data_dictionary_entries`, `controlled_value_sets`
   (`applicable_projects` um die neue Profil-ID ergänzen), `terminology_rules`, `routing_rules`
   anlegen.
4. Optional: Eintrag in `data/hays/contextProfile.ts`-Analogon (bzw. eigene Datei) für
   Offline-Fallback ergänzen und in `ALL_CONTEXT_PROFILES` registrieren.

## 8. Nutzung im Projekt

- Reiter **Projekte** (`components/ProjectsPage.tsx`): Formular um Organisation/Kontextprofil,
  Projekttyp, Data-Dictionary-Version, Environment, Systeme, Prozesse, Owner und QA Governance
  erweitert. Persistiert wird die Auswahl in `project_context_selections`
  (`services/projectContextSelectionService.ts`).
- **Projekt Konfiguration** (`components/ProjectSettingsModal.tsx`, lokal/`ProjectSettings`):
  Kontextprofil, Data-Dictionary-Version, Systeme (Multi-Select + "Weiteres System"),
  strukturierte URL-Matrix, Prozesse, Evidence, verbotene Begriffe. Bestehende
  kommagetrennte Felder (`systems`, `urls`) bleiben als Legacy-Eingabe erhalten.
- Ein Wechsel des Kontextprofils setzt abhängige Mehrfachauswahlen (Systeme/Prozesse/Evidence)
  zurück; die UI zeigt vorher eine Warnung.

## 9. Nutzung im KI-Generator

Reiter **Neu (KI)** (`components/TestCaseGenerator.tsx`) zeigt bei aktivem Hays-Kontextprofil
zusätzlich einen Abschnitt "Hays Testkontext" mit Environment, Bewerbungsweg, Testtyp, Systemen,
erwartetem Daxtra-Status, IRIS-Prüffeldern, erwartetem IRIS-Ergebnis, Matching-Ergebnis und
Evidence. Die Auswahl wird als `HaysTestContext` am generierten Testfall gespeichert und in den
KI-Prompt eingebettet (`services/geminiService.ts` → `buildCompactAiContext`).

## 10. Nutzung im Bulk Import

`components/BulkUpload.tsx` übergibt das aktive Kontextprofil an `parseCSVToTestCases`. Fehlen
notwendige Felder/Sollwerte, erzeugt die KI einen Draft-Testfall statt zu improvisieren (Tag
`IncompleteInput`). Zusätzlich steht ein Bulk-Button "Terminologie prüfen" zur Verfügung, der alle
importierten Zeilen gegen die Terminologieregeln des Kontextprofils prüft.

## 11. Terminologieprüfung

`services/terminologyService.ts` bietet:

- `checkTextTerminology(text, options)` – Freitextprüfung.
- `checkTestCaseTerminology(testCase, options)` – Einzeltestfall (Titel, Summary, Schritte,
  Negative Flows).
- `checkTestCasesTerminology(testCases, options)` – Bulk-Prüfung, liefert `Map<caseId, Finding[]>`.
- `checkProfilpflegeRule` – Sonderregel: Profilpflege-Testfälle müssen "Keine Neuanlage"/
  "update-only" referenzieren.
- Severity: `error` (erfundener/verbotener Begriff, nicht belegter Sollwert),
  `warning` (Review-Required-Wert), `info` (Verbesserungsvorschlag).

## 12. Bekannte Einschränkungen

- `ProjectSettings` (lokale KI-Projektkonfiguration) und das Supabase-`Project`-Modell sind zwei
  getrennte Konzepte im bestehenden Code (siehe `docs/CURRENT_STATE.md`). Die Erweiterung
  respektiert diese bestehende Trennung, statt sie in dieser Iteration zusammenzuführen.
- Die KI-Anbindung läuft weiterhin browser-seitig über `@google/genai` (siehe
  `docs/AI_GOVERNANCE.md`); die in dieser Erweiterung strukturierte Kontextzusammenstellung
  reduziert das Risiko erfundener Begriffe, ersetzt aber nicht die dort beschriebene
  Ziel-Architektur (serverseitige Edge Function).
- `DefectModal`/`generateDefectReport` wurden um Hays-Kontextfelder in Typ und Prompt erweitert;
  eine vollständige, dedizierte Hays-Formularoberfläche für alle in Abschnitt S beschriebenen
  Felder (z.B. eigene Eingabefelder für Daxtra Docket-ID) ist nicht Teil dieser Iteration.
- Die Environment-/System-URL-Matrix speichert keine Zugangsdaten; eine Validierung auf
  tatsächlich erreichbare URLs findet nicht statt (bewusst, siehe Nicht-Ziele).

## 13. Rollback der Migration

```sql
drop table if exists public.project_context_selections;
drop table if exists public.routing_rules;
drop table if exists public.terminology_rules;
drop table if exists public.controlled_value_sets;
drop table if exists public.data_dictionary_entries;
drop table if exists public.context_profiles;
```

Da alle neuen Tabellen additiv sind und keine bestehende Spalte in `projects` verändert wurde,
hat ein Rollback keine Auswirkung auf bestehende Projekte, Testfälle oder Memberships.
