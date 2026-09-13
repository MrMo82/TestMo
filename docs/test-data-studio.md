# Test Data Studio

## Architektur

Das Studio extrahiert Anforderungen aus einem `TestCase`, erzeugt ausschließlich markierte synthetische Profile und erstellt daraus Expected Values sowie ein Manifest. Die aktuelle SPA enthält einen deterministischen Browser-Fallback in `services/testDataStudioService.ts`; DOCX/PDF/ZIP und Supabase-Storage sind als Servergrenze vorgesehen, damit binäre Artefakte nicht im Browser erzeugt werden.

## Datenmodell und Zugriff

Migration `20260902130000_create_test_data_studio.sql` legt Profile, Artefakte, Erwartungen und Case-Verknüpfungen an. Alle Tabellen sind projektbezogen und verwenden die vorhandenen `is_project_member`/`has_project_role`-Funktionen. Viewer lesen, Tester erzeugen, Projekt-Owner verwalten. Storage-Artefakte müssen in einem privaten Bucket durch eine Serverless Function erzeugt werden.

## Generatorregeln

IDs, `example.test`-Adressen, Datumswerte und Manifestdaten sind deterministisch kontrollierbar. Arbeitgeber, Profilname und Historie sind fiktiv; `synthetic` bleibt zwingend `true`. Unbestätigte Data-Dictionary-Anforderungen werden nicht erfunden und führen zu `Draft / Blocked`.

## Templates, negative Varianten und Vergleich

Die fachliche Quelldatenstruktur ist für alle Dokumentvarianten vorgesehen. Negative Varianten müssen passiv und eindeutig markiert bleiben; keine Makros, ausführbaren Inhalte oder automatischen E-Mails. Expected Values unterstützen Exact, case-insensitive, normalisierte Werte, Contains, Set-Vergleich und Manual Review. Automatische Bewertung ohne Regel ist unzulässig.

## Betrieb und offene Punkte

Für Produktion sind eine Vercel-Function mit DOCX/PDF/ZIP-Bibliotheken, ein privater `test-data-artifacts`-Bucket, Storage-RLS und ein serverseitiger Auth-Kontext zu konfigurieren. Retention ist als Metadatenklasse (`Temporary`, `Project Lifetime`, `Manual Retention`) zu führen; konkrete Fristen werden nicht hardcodiert. Die SPA-Fallback-Ausgabe ist bewusst Draft und noch kein produktionsreifes Dokumentenpaket.