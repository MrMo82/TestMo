# ADR 0001: Kontrollierter Rebuild

- Status: Akzeptiert
- Kontext: Der Prototyp verbindet CMP-Domäne, LocalStorage, Mock-Auth, Ausführung und Browser-AI.
- Entscheidung: UX-Muster selektiv übernehmen, zentrale Domäne und Persistenz inkrementell neu bauen.
- Konsequenz: Legacy-Funktionen bleiben bis zum Ersatz; jede Phase hat eigene Validierung und Migration.
