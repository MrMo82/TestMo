# Autorisierungsmatrix

## Zielrollen

| Fähigkeit | Admin | Project Owner | Test Designer | Tester | Reviewer | Viewer |
|---|---:|---:|---:|---:|---:|---:|
| Projekte sehen | alle zulässigen | eigene | eigene | eigene | eigene | eigene |
| Projekt anlegen | ja | ja | nein | nein | nein | nein |
| Mitglieder/Rollen verwalten | ja | im eigenen Projekt | nein | nein | nein | nein |
| Quellen hochladen/bearbeiten | ja | ja | ja | nein | review | nein |
| Requirements/Risks/Conditions bearbeiten | ja | ja | ja | nein | review | lesen |
| Draft Scenarios erstellen | ja | ja | ja | nein | review | lesen |
| Test Case Versionen erstellen | ja | ja | ja | nein | review | lesen |
| Version genehmigen | ja | optional | nein | nein | ja | nein |
| Runs planen | ja | ja | ja | nein | nein | lesen |
| Execution/Step Results schreiben | ja | optional | optional | ja | optional | nein |
| Evidence hochladen | ja | ja | ja | ja | ja | nein |
| Defects erstellen | ja | ja | ja | ja | ja | nein |
| Defect-Workflow verwalten | ja | ja | nein | nein | ja | lesen |
| Exportieren | ja | ja | ja | ja | ja | ja |
| Import bestätigen | ja | ja | ja | nein | optional | nein |
| Reports/Traceability lesen | ja | ja | ja | ja | ja | ja |
| Controlled Lists/AI-Konfiguration | ja | nein | nein | nein | nein | nein |
| Audit lesen | ja | Projekt-scope | Projekt-scope | Projekt-scope | Projekt-scope | nein |

`optional` bedeutet konfigurierbar und muss durch Projektrolle plus konkrete Policy begrenzt werden.

## Durchsetzung

- UI-Fähigkeiten sind nur Komfort und dürfen keine Security-Grenze sein.
- Datenbank-RLS prüft `auth.uid()` gegen `project_members` und Rollen; Admin-Zugriff stammt aus serverseitig kontrollierter Zuordnung, nicht aus client-editierbaren Profildaten.
- Jede Mutation validiert Projekt-Scope, Lifecycle und erlaubten Statusübergang.
- Approval, Gate-Override, Import-Bestätigung und Rollenänderung erzeugen Audit-Ereignisse.

## Tests

Zu implementieren: User A kann Projekt B nicht lesen oder mutieren; Viewer kann keine Mutation ausführen; Tester kann nur zugewiesene/zulässige Executions aktualisieren; Project Owner kann nur eigene Projekte verwalten; Admin-Regeln werden serverseitig geprüft.
