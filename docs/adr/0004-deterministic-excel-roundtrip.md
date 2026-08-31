# ADR 0004: Deterministischer Excel-Roundtrip

- Status: Akzeptiert
- Kontext: Aktuell existieren nur CSV-Exporte und AI-abhängiger CSV-Import.
- Entscheidung: ExcelJS erzeugt definierte Profile mit verstecktem Manifest und stabilen technischen IDs; Generated-Workbook-Import bleibt AI-frei.
- Konsequenz: Import wird stufenweise validiert, duplikatgeschützt und auditiert.
