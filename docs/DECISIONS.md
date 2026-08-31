# Architekturentscheidungen

## Beschlossene Entscheidungen

- Vite SPA bleibt erhalten; siehe ADR 0002.
- Definition und Ausführung werden getrennt; siehe ADR 0003.
- ExcelJS und Manifest sind der deterministische Roundtrip-Vertrag; siehe ADR 0004.
- AI läuft serverseitig und bleibt reviewpflichtig; siehe ADR 0005.
- CMP-spezifische UX wird nicht als generische Domäne fortgeschrieben.
- Supabase ist Ziel für Auth, Postgres und Storage; konkrete Migrationen entstehen erst in den jeweiligen PRs.

## Offene Entscheidungen

- Exakte Business-Key-Präfixe und Sequenzierungsstrategie je Entität.
- Retention-/Archivierungsfristen je Mandant/Projekt.
- Admin-Abbildung: sichere Claims versus dedizierte serverseitige Membership.
- XLSX-Schutzgrad und erlaubte Fremdtemplate-Kompatibilität.
- Konkreter Gemini-Modell-/Regionvertrag und Redaktionsregeln.

Offene Entscheidungen dürfen keine implizite Produktsemantik in frühen Implementierungen erzeugen.
