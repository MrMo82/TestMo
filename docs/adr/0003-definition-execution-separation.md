# ADR 0003: Definition und Ausführung trennen

- Status: Akzeptiert
- Kontext: `types.ts` mischt Testdefinition mit Status, Notes und Evidence.
- Entscheidung: Case/Version/Step definieren Testinhalt; Run/Execution/Step Result speichern Ereignisse und Resultate.
- Konsequenz: Genehmigte Versionen sind unveränderlich; Retests überschreiben keine Historie.
