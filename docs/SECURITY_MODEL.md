# Sicherheitsmodell

## Bestätigte Risiken im Prototyp

- `services/storageService.ts`: lokale Testfall- und Aktivitätsdaten bleiben Legacy; die lokale Session- und Demo-Authentifizierung wurde entfernt.
- Vor Phase 2: `components/Login.tsx` und `storageService.login` enthielten einen sichtbaren Demo-Zugang und feste Passwortprüfung; der aktive Pfad ist entfernt.
- `vite.config.ts`: `VITE_GEMINI_API_KEY`/`GEMINI_API_KEY` werden als `process.env.*` in den Client definiert.
- `services/geminiService.ts`: Browser-Aufruf an Gemini mit Provider-SDK.
- `components/TestRunner.tsx`: Evidence als Base64 im lokalen Testfall.
- `DEPLOYMENT.md`: Beispiel-RLS mit `USING (true)` für projektbezogene Tabellen.
- Uploads werden im Prototyp nicht durch einen zentralen MIME-/Größen-/Storage-Vertrag geschützt.
- Excel/CSV-Eingaben sind untrusted; es gibt keine Formel-Injection- oder Manifest-Validierung.
- Externe Avatar-URLs und Benutzerinhalte werden ohne zentralen Sanitizing-/Privacy-Vertrag verwendet.

Keine geheimen Werte wurden ausgegeben. Geprüfte sensible Variablennamen/Pfade: `VITE_GEMINI_API_KEY` in `.env.example`/`vite.config.ts`, `GEMINI_API_KEY` in `vite.config.ts`/`services/geminiService.ts`, `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` in `.env.example`/`services/supabaseClient.ts`.

## Zielkontrollen

1. Supabase Auth statt lokaler Login-Daten; Profile referenzieren `auth.users`.
2. Nur public Supabase-Konfiguration im Browser; AI- und Service-Role-Secrets ausschließlich als Edge-Function-Secrets.
3. Membership-basierte RLS auf jeder projektbezogenen Tabelle und privater Evidence-Bucket mit signierten Downloads.
4. Serverseitige Validierung von Upload-Typ, -Größe, Dateinamen, Projektpfad und Berechtigung.
5. Excel-Export neutralisiert Formeln (`=`, `+`, `-`, `@` am Zellanfang), nutzt technische IDs und verstecktes Manifest.
6. Excel-Import parst untrusted Inhalte ohne Ausführung, validiert Schema/IDs/Controlled Values und persistiert erst nach Preview.
7. AI-Ausgaben werden pro Job mit Zod validiert, als Vorschlag gespeichert und human reviewed.
8. Audit enthält Actor, Aktion, Entität, Projekt, Zeit und Correlation ID, aber keine Secrets oder unnötigen Datei-Inhalte.
9. Startup validiert erforderliche Environment-Konfiguration; Fehlermeldungen enthalten keine Secrets.
10. Dependency-Audit und RLS-SQL-Verifikation werden Teil der Release-Gates.

## Release-Gate

Produktionsfreigabe erst nach Auth-/RLS-Tests, Storage-Tests, Import-Fuzz-/Formeltests, Secret-Scan, Dependency-Audit und dokumentiertem Recovery-Plan.
