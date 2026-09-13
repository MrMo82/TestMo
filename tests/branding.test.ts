import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getActiveOrganizationTheme, HAYS_BRAND_COLORS, HAYS_BRAND_ASSETS, PRODUCT_NAME, SAFE_FONT_STACK } from '../theme/brand';

// 1. OrganizationTheme wird geladen. / 2. Fallback Theme funktioniert ohne Supabase-Verbindung.
describe('OrganizationTheme laden', () => {
  it('liefert ein vollstaendiges, synchron verfuegbares Theme ohne Netzwerkzugriff', () => {
    const theme = getActiveOrganizationTheme();
    expect(theme.productName).toBe('Hays Test Hub');
    expect(theme.active).toBe(true);
    expect(theme.colors).toBeDefined();
    expect(theme.semanticColors.light).toBeDefined();
    expect(theme.semanticColors.dark).toBeDefined();
  });

  it('ist referenzstabil (Singleton, kein Reload pro Aufruf)', () => {
    expect(getActiveOrganizationTheme()).toBe(getActiveOrganizationTheme());
  });
});

// 3. Product Name wird aus der zentralen Konfiguration gerendert (hier: Konsistenzpruefung der Konstante).
describe('Zentraler Produktname', () => {
  it('PRODUCT_NAME entspricht dem Theme-Produktnamen', () => {
    expect(PRODUCT_NAME).toBe(getActiveOrganizationTheme().productName);
    expect(PRODUCT_NAME).toBe('Hays Test Hub');
  });
});

// 4. "TestMo Next" erscheint nicht mehr in zentralen sichtbaren Komponenten.
describe('Kein "TestMo Next"/"CMP Schweiz" mehr in zentralen sichtbaren Dateien', () => {
  const filesToCheck = [
    '../App.tsx',
    '../components/Login.tsx',
    '../components/OnboardingModal.tsx',
    '../components/ProjectsPage.tsx',
    '../components/PlannedRoute.tsx',
    '../metadata.json',
    '../index.html',
  ];

  filesToCheck.forEach(relativePath => {
    it(`${relativePath} enthaelt weder "TestMo Next" noch "CMP Schweiz"`, () => {
      const filePath = path.resolve(__dirname, relativePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('TestMo Next');
      expect(content).not.toContain('CMP Schweiz');
    });
  });

  it('App.tsx zeigt den Produktnamen ueber die zentrale Konstante statt hartcodiert', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');
    expect(content).toContain('PRODUCT_NAME');
  });
});

// 5. Browser-Titel wird korrekt gesetzt.
describe('Browser-Titel und Manifest', () => {
  it('index.html enthaelt den neuen Produktnamen im <title>', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    expect(html).toMatch(/<title>[^<]*Hays Test Hub[^<]*<\/title>/);
  });

  it('index.html laedt keine externen Google-Font-Requests mehr (AC-BRAND-14)', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
  });

  it('public/manifest.webmanifest verwendet den neuen Produktnamen', () => {
    const manifestPath = path.resolve(__dirname, '../public/manifest.webmanifest');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name).toBe('Hays Test Hub');
    expect(manifest.short_name).toBe('Test Hub');
    expect(manifest.theme_color).toBe('#0A0532');
  });
});

// 6. Navigation zeigt die neuen Labels.
describe('Navigations-Wording', () => {
  it('App.tsx verwendet die neuen deutschen Navigationslabels', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');
    expect(content).toContain('Übersicht');
    expect(content).toContain('Neuer Testfall');
    expect(content).not.toContain('Neu (KI)');
  });
});

// 7. Theme-Tokens sind vorhanden.
describe('Brand- und semantische Tokens', () => {
  it('enthaelt die vorgegebene Hays-Primaer-/Sekundaerpalette mit korrekten Hex-Werten', () => {
    expect(HAYS_BRAND_COLORS.midnightBlue).toBe('#0A0532');
    expect(HAYS_BRAND_COLORS.azureBlue).toBe('#2173FF');
    expect(HAYS_BRAND_COLORS.white).toBe('#FFFFFF');
    expect(HAYS_BRAND_COLORS.black).toBe('#000000');
    expect(HAYS_BRAND_COLORS.teal).toBe('#06D6A0');
    expect(HAYS_BRAND_COLORS.deepTeal).toBe('#0B7A75');
    expect(HAYS_BRAND_COLORS.orange).toBe('#F7911E');
    expect(HAYS_BRAND_COLORS.lilac).toBe('#CFB6FF');
    expect(HAYS_BRAND_COLORS.mint).toBe('#A0F2E4');
  });

  it('semantische Farben sind von Markenfarben getrennt (eigenes Set)', () => {
    const theme = getActiveOrganizationTheme();
    expect(theme.semanticColors.light.actionPrimary).toBe(HAYS_BRAND_COLORS.azureBlue);
    expect(theme.semanticColors.light.confirmed).toBe(HAYS_BRAND_COLORS.deepTeal);
    expect(theme.semanticColors.light.reviewRequired).toBe(HAYS_BRAND_COLORS.orange);
  });

  it('index.html definiert die semantischen CSS Custom Properties fuer Light und Dark Mode', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    expect(html).toContain('--color-action-primary');
    expect(html).toContain('--color-confirmed');
    expect(html).toContain('.dark {');
  });
});

// 8. Primary Button verwendet das semantische Primary Token (statischer Check der Design-System-Seite).
describe('Primary Button semantisches Token', () => {
  it('DesignSystemPage.tsx nutzt --color-action-primary statt hartcodiertem Blauton fuer den Primary-Button', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/DesignSystemPage.tsx'), 'utf-8');
    expect(content).toContain('--color-action-primary');
  });
});

// 9. Status Badge enthaelt Text und zugaengliches Label.
describe('StatusBadge Komponente', () => {
  it('StatusBadge.tsx setzt role="status" und aria-label mit lesbarem Text', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/StatusBadge.tsx'), 'utf-8');
    expect(content).toContain('role="status"');
    expect(content).toContain('aria-label');
  });
});

// 10. fehlendes Logo verwendet den Text-Fallback.
describe('BrandLogo Fallback', () => {
  it('BrandLogo.tsx faellt bei fehlendem Asset auf reinen Textnamen zurueck (onError-Handler)', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/BrandLogo.tsx'), 'utf-8');
    expect(content).toContain('onError');
    expect(content).toContain(HAYS_BRAND_ASSETS.altText);
  });

  it('kein Logo wird per CSS-Filter automatisch invertiert/umgefaerbt', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/BrandLogo.tsx'), 'utf-8');
    expect(content).not.toMatch(/filter:\s*invert/i);
    expect(content).not.toContain('grayscale');
  });
});

// 11. Dark Mode rendert ohne fehlende Tokens.
describe('Dark Mode Tokens', () => {
  it('definiert fuer jeden Light-Mode-Token einen entsprechenden Dark-Mode-Token', () => {
    const theme = getActiveOrganizationTheme();
    const lightKeys = Object.keys(theme.semanticColors.light).sort();
    const darkKeys = Object.keys(theme.semanticColors.dark).sort();
    expect(darkKeys).toEqual(lightKeys);
  });
});

// 12. verbotene externe Font-Requests existieren nicht (siehe auch oben, hier zusaetzlich Theme-Ebene).
describe('Sicherer Font-Stack', () => {
  it('SAFE_FONT_STACK enthaelt Arial und system-ui gemaess Vorgabe', () => {
    expect(SAFE_FONT_STACK).toContain('Arial');
    expect(SAFE_FONT_STACK).toContain('system-ui');
  });
});

// 16. bestehende technische CaseStatus- und StepStatus-Werte bleiben kompatibel.
describe('Technische Enum-Kompatibilitaet (AC-BRAND-17)', () => {
  it('CaseStatus-Enum-Werte sind unveraendert (nur UI-Labels wurden angepasst, keine Werte)', async () => {
    const { CaseStatus, StepStatus } = await import('../types');
    expect(CaseStatus.Draft).toBe('Draft');
    expect(CaseStatus.Passed).toBe('Passed');
    expect(CaseStatus.Failed).toBe('Failed');
    expect(StepStatus.Blocked).toBe('Blocked');
  });
});

// 18. Design-System-Seite ist fuer nicht berechtigte Benutzer nicht sichtbar.
describe('Design-System-Seite Zugriffsschutz', () => {
  it('DesignSystemPage.tsx zeigt fuer Nicht-Admins einen Zugriffshinweis statt der Tokens', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../components/DesignSystemPage.tsx'), 'utf-8');
    expect(content).toContain("currentUserRole !== 'Admin'");
    expect(content).toContain('Kein Zugriff');
  });
});

// 15. CSV-Import und -Export werden durch reine Labeländerungen nicht beschädigt.
describe('Export-Dateinamen unveraendert (CSV-Kompatibilitaet)', () => {
  it('utils/exportUtils.ts behaelt die bestehenden TestMo-Exportdateinamen fuer Kompatibilitaet bei', () => {
    const content = fs.readFileSync(path.resolve(__dirname, '../utils/exportUtils.ts'), 'utf-8');
    expect(content).toContain('TestMo_Standard_Export');
    expect(content).toContain('TestMo_Zephyr_Import');
  });
});
