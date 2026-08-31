# ADR 0005: Server-seitiger AI-Provider

- Status: Akzeptiert
- Kontext: `services/geminiService.ts` initialisiert Gemini im Browser; Vite kann Provider-Variablen exponieren.
- Entscheidung: Provider-Aufrufe ausschließlich in geschützten Edge Functions, mit job-spezifischen Schemas und Human Review.
- Konsequenz: Client enthält keinen Provider-Key; AI ist für deterministische Kernpfade optional.
