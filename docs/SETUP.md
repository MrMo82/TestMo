# Supabase-Setup

## Lokale Konfiguration

1. Supabase-Projekt anlegen.
2. In Supabase unter **Project Settings -> API** die Project URL und den `anon` public key kopieren.
3. `.env.local` anlegen:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
```

Nur diese beiden öffentlichen Werte gehören in den Vite-Client. Niemals Service-Role-Keys oder Provider-Keys mit `VITE_` prefixieren.

## Migration ausführen

Die erste Migration liegt in `supabase/migrations/20260824140000_create_profiles.sql`.

Die Projekt- und Sources-Migrationen unter `supabase/migrations/20260824150000_create_projects_memberships_environments.sql`, `supabase/migrations/20260824160000_add_project_intake_context.sql` und `supabase/migrations/20260824170000_create_sources_storage.sql` müssen anschließend in derselben Reihenfolge angewendet werden. Für bereits vorhandene Auth-User danach auch `supabase/migrations/20260824180000_backfill_existing_profiles.sql` ausführen.

Mit Supabase CLI im Repository-Root:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

Alternativ kann die Migration im Supabase SQL Editor ausgeführt werden. Für produktive Deployments ist der versionierte CLI-Weg vorzuziehen.

## Benutzer und Profile

E-Mail/Passwort muss in Supabase Auth aktiviert sein. Die Migration erzeugt über einen `auth.users`-Trigger automatisch ein Profil. Name und Username können bei der Registrierung über `raw_user_meta_data` gesetzt werden. Neue Profile erhalten zunächst die Rolle `Viewer`.

Rollenänderungen werden nicht aus dem Browser erlaubt. Ein administrativer, serverseitig autorisierter Workflow folgt mit Project Membership und RLS in der nächsten Phase.

## Prüfen

- Ohne gültige `.env.local` zeigt die Login-Seite eine Konfigurationsmeldung.
- Mit gültiger Konfiguration lädt die App die Auth-Session und anschließend das Profil aus `public.profiles`.
- Die bestehende lokale Testfalldatenhaltung ist in dieser Phase noch Legacy und wird erst mit der Projektmigration ersetzt.

## Bekannte Einschränkung

Die aktuelle Phase integriert Auth, Profile, Projekte, Memberships, Intake sowie projektbezogene Sources mit privatem Storage und RLS. Projektliste, speicherbarer Intake und Sources sind in `components/ProjectsPage.tsx`, `components/ProjectOverviewPage.tsx` und `components/SourcesPage.tsx` verfügbar. Requirements und die übrigen Domänen folgen in den nächsten PRs.

## Vercel

Die Variablen müssen im Vercel-Projekt unter **Settings -> Environment Variables** für Preview und Production gesetzt werden. Nach jeder Änderung ist ein neuer Deployment-Build erforderlich; ein lokales `.env.local` ändert die bereits veröffentlichte URL nicht.

Erforderlich:

```text
VITE_SUPABASE_URL=https://thpwufmezaghwummiakl.supabase.co
VITE_SUPABASE_ANON_KEY=<Supabase-Publishable-Key>
```

Nach dem Deployment muss die ausgelieferte App die aktuelle Supabase-Anmeldeseite zeigen. Wenn weiterhin die alte Oberfläche erscheint, wurde nicht der Branch `rebuild/testmo-next` deployed.
