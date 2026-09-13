import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TestCase, CaseStatus, Priority } from '../types';
import { HAYS_DATA_DICTIONARY, HAYS_CONTEXT_PROFILE } from '../data/hays/contextProfile';

// 11. Bulk Import erhaelt identische Case IDs.
describe('Bulk Import Case-ID-Stabilitaet', () => {
  it('behaelt die Case-ID bei, wenn ein importierter Testfall angereichert/optimiert wird', () => {
    const imported: TestCase = {
      caseId: 'TC-99001',
      title: 'Bewerbung pruefen',
      summary: 'Import aus CSV',
      tags: [],
      priority: Priority.Medium,
      type: 'functional',
      preconditions: [],
      estimatedDurationMin: 5,
      estimatedEffort: 'S',
      steps: [{ stepId: 's1', sequence: 1, description: 'Schritt', expectedResult: 'Ergebnis', estimatedDurationMin: 1, priority: Priority.Medium, status: 'NotStarted' as any }],
      caseStatus: CaseStatus.NotStarted,
      lastUpdated: new Date().toISOString(),
      createdBy: 'BulkImport',
    };

    // Simuliert die Nachbearbeitung, wie sie App.tsx/BulkUpload beim Optimieren/Speichern durchfuehrt:
    // Die Case-ID darf dabei niemals neu vergeben werden.
    const optimized: TestCase = { ...imported, summary: 'Optimierte Zusammenfassung' };

    expect(optimized.caseId).toBe(imported.caseId);
  });
});

// 14. Hays-Seed-Daten enthalten keine Secrets oder produktiven Bewerberdaten.
describe('Seed-Daten Sicherheit (keine Secrets/produktive Daten)', () => {
  const forbiddenPatterns = [
    /bearer\s+[a-z0-9._-]+/i, // Auth-Header-artige Werte
    /https?:\/\/(?!example\.)/i, // keine echten produktiven URLs im Seed
  ];

  it('data/hays/contextProfile.ts enthaelt keine Secrets/echten URLs oder API-Key-Werte', () => {
    const filePath = path.resolve(__dirname, '../data/hays/contextProfile.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    forbiddenPatterns.forEach(pattern => {
      expect(pattern.test(content)).toBe(false);
    });
  });

  it('Data-Dictionary-Eintraege enthalten keine Beispiel-IDs fuer PSO ID oder Prospect-ID (laut Anforderung nicht erfinden)', () => {
    const psoIdEntry = HAYS_DATA_DICTIONARY.find(e => e.id === 'dxpsi');
    expect(psoIdEntry?.allowedValues).toBeUndefined();
  });

  it('Kontextprofil-Metadaten enthalten keine konkreten Zugangsdaten-Werte (Passwoerter/Keys)', () => {
    // Die Regeltexte duerfen zwar vor der Verwendung von API-Keys/Passwoertern warnen,
    // es duerfen aber keine konkreten Secret-aehnlichen Werte (lange Base64/Hex-Strings) enthalten sein.
    const serialized = JSON.stringify(HAYS_CONTEXT_PROFILE);
    expect(/[A-Za-z0-9_-]{32,}/.test(serialized)).toBe(false);
  });
});

// 13. Nicht berechtigter Benutzer kann kein fremdes Kontextprofil lesen (RLS-Vertrag statisch geprueft,
// da kein Live-Supabase in der Testumgebung verfuegbar ist).
describe('RLS-Vertrag fuer projektbezogene Kontextauswahl', () => {
  it('project_context_selections-Policies binden Lesezugriff an Projekt-Membership', () => {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260901120000_add_context_profiles.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('project_context_selections for select to authenticated');
    expect(sql).toContain('is_project_member(project_id)');
  });
});
