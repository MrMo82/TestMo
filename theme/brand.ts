// Zentrale Markenkonfiguration ("Organization Theme") fuer Hays Test Hub.
// Einziger Ort, an dem der sichtbare Produktname, Brand-/semantische Farben,
// Typografie und Asset-Pfade definiert werden. Komponenten importieren ausschliesslich
// von hier, statt Produktnamen oder Markenfarben hart zu codieren (Abschnitt AA/QQ/TT).
//
// Sicherheit/Governance (Abschnitt FF/RR): Es werden ausschliesslich Platzhalterpfade
// referenziert. Es werden keine Logo-Binaerdateien durch KI erzeugt oder von der
// oeffentlichen Hays-Website extrahiert. Solange keine offiziell freigegebenen Assets
// unter den unten genannten Pfaden liegen, faellt die UI auf einen reinen Textnamen
// zurueck (siehe components/BrandLogo.tsx).

export interface BrandAssets {
  primaryLogo: string;
  secondaryLogo: string;
  symbolLogo: string;
  reversedLogo: string;
  favicon: string;
  appIcon: string;
  loginLogo: string;
  altText: string;
}

export interface BrandColors {
  midnightBlue: string;
  azureBlue: string;
  white: string;
  black: string;
  teal: string;
  deepTeal: string;
  orange: string;
  lilac: string;
  mint: string;
}

export interface SemanticColorSet {
  backgroundPage: string;
  backgroundSurface: string;
  backgroundSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  borderDefault: string;
  borderStrong: string;
  actionPrimary: string;
  actionPrimaryHover: string;
  actionPrimaryActive: string;
  actionSecondary: string;
  focus: string;
  link: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  draft: string;
  blocked: string;
  reviewRequired: string;
  confirmed: string;
}

export interface Typography {
  fontFamily: string;
  monoFontFamily: string;
  appTitle: string;
  pageTitle: string;
  sectionTitle: string;
  cardTitle: string;
  body: string;
  helpText: string;
  label: string;
  tableHeader: string;
}

export interface OrganizationTheme {
  id: string;
  organizationName: string;
  productName: string;
  shortProductName: string;
  tagline: string;
  description: string;
  primaryLogoPath: string;
  reversedLogoPath: string;
  symbolPath: string;
  faviconPath: string;
  fontFamily: string;
  colors: BrandColors;
  semanticColors: { light: SemanticColorSet; dark: SemanticColorSet };
  typography: Typography;
  borderRadius: { sm: string; md: string; lg: string; xl: string; full: string };
  shadows: { sm: string; md: string; lg: string };
  chartPalette: string[];
  darkMode: boolean;
  active: boolean;
  version: string;
}

// BB. Hays Brand Palette (Primär-/Sekundärfarben laut Vorgabe, unveraendert uebernehmen)
export const HAYS_BRAND_COLORS: BrandColors = {
  midnightBlue: '#0A0532',
  azureBlue: '#2173FF',
  white: '#FFFFFF',
  black: '#000000',
  teal: '#06D6A0',
  deepTeal: '#0B7A75',
  orange: '#F7911E',
  lilac: '#CFB6FF',
  mint: '#A0F2E4',
};

// Ergaenzende, barrierearme neutrale UI-Farben (KEINE offiziellen Hays-Markenfarben,
// nur als UI-Token fuer Hintergruende/Rahmen/Sekundaertexte dokumentiert - Abschnitt BB).
export const UI_NEUTRAL_TOKENS = {
  neutral50: '#F8F9FC',
  neutral100: '#EEF0F7',
  neutral200: '#D9DCE8',
  neutral400: '#8A8FA3',
  neutral600: '#565B75',
  neutral800: '#2A2E45',
  neutral900: '#14162A',
};

const lightSemanticColors: SemanticColorSet = {
  backgroundPage: UI_NEUTRAL_TOKENS.neutral50,
  backgroundSurface: HAYS_BRAND_COLORS.white,
  backgroundSubtle: UI_NEUTRAL_TOKENS.neutral100,
  textPrimary: HAYS_BRAND_COLORS.midnightBlue,
  textSecondary: UI_NEUTRAL_TOKENS.neutral600,
  textInverse: HAYS_BRAND_COLORS.white,
  borderDefault: UI_NEUTRAL_TOKENS.neutral200,
  borderStrong: UI_NEUTRAL_TOKENS.neutral400,
  actionPrimary: HAYS_BRAND_COLORS.azureBlue,
  actionPrimaryHover: '#1A5FE0',
  actionPrimaryActive: '#144DBB',
  actionSecondary: UI_NEUTRAL_TOKENS.neutral100,
  focus: HAYS_BRAND_COLORS.azureBlue,
  link: HAYS_BRAND_COLORS.azureBlue,
  success: HAYS_BRAND_COLORS.deepTeal,
  warning: HAYS_BRAND_COLORS.orange,
  error: '#D14343',
  info: HAYS_BRAND_COLORS.azureBlue,
  draft: UI_NEUTRAL_TOKENS.neutral400,
  blocked: HAYS_BRAND_COLORS.orange,
  reviewRequired: HAYS_BRAND_COLORS.orange,
  confirmed: HAYS_BRAND_COLORS.deepTeal,
};

const darkSemanticColors: SemanticColorSet = {
  backgroundPage: UI_NEUTRAL_TOKENS.neutral900,
  backgroundSurface: HAYS_BRAND_COLORS.midnightBlue,
  backgroundSubtle: UI_NEUTRAL_TOKENS.neutral800,
  textPrimary: HAYS_BRAND_COLORS.white,
  textSecondary: UI_NEUTRAL_TOKENS.neutral200,
  textInverse: HAYS_BRAND_COLORS.midnightBlue,
  borderDefault: UI_NEUTRAL_TOKENS.neutral800,
  borderStrong: UI_NEUTRAL_TOKENS.neutral600,
  actionPrimary: '#5B9BFF', // aufgehellte Azure-Blue-Variante fuer ausreichenden Dark-Mode-Kontrast
  actionPrimaryHover: '#4A8CF5',
  actionPrimaryActive: '#3576DE',
  actionSecondary: UI_NEUTRAL_TOKENS.neutral800,
  focus: '#5B9BFF',
  link: '#5B9BFF',
  success: HAYS_BRAND_COLORS.teal,
  warning: HAYS_BRAND_COLORS.orange,
  error: '#F08585',
  info: '#5B9BFF',
  draft: UI_NEUTRAL_TOKENS.neutral400,
  blocked: HAYS_BRAND_COLORS.orange,
  reviewRequired: HAYS_BRAND_COLORS.orange,
  confirmed: HAYS_BRAND_COLORS.teal,
};

// DD. Sicherer Font-Stack: keine externen/nicht freigegebenen Webfonts.
// Es liegt keine offiziell freigegebene, lizenzierte Hays-Webfont im Repository vor,
// daher Arial -> system-ui -> sans-serif als Fallback-Kette (siehe docs/branding-assets.md).
export const SAFE_FONT_STACK = 'Arial, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const SAFE_MONO_FONT_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

const typography: Typography = {
  fontFamily: SAFE_FONT_STACK,
  monoFontFamily: SAFE_MONO_FONT_STACK,
  appTitle: 'text-xl font-bold tracking-tight',
  pageTitle: 'text-2xl font-bold tracking-tight',
  sectionTitle: 'text-lg font-semibold',
  cardTitle: 'text-base font-semibold',
  body: 'text-sm font-normal',
  helpText: 'text-xs text-[color:var(--color-text-secondary)]',
  label: 'text-sm font-medium',
  tableHeader: 'text-xs font-bold uppercase tracking-wider',
};

// FF. Brand-Asset-Konfiguration. Nur Platzhalterpfade, bis offiziell freigegebene
// Assets kontrolliert ins Repository gelegt werden (siehe docs/branding-assets.md).
export const HAYS_BRAND_ASSETS: BrandAssets = {
  primaryLogo: '/brand/hays-logo-primary.svg',
  secondaryLogo: '/brand/hays-logo-secondary.svg',
  symbolLogo: '/brand/hays-symbol.svg',
  reversedLogo: '/brand/hays-logo-reversed.svg',
  favicon: '/brand/favicon.svg',
  appIcon: '/brand/hays-symbol.svg',
  loginLogo: '/brand/hays-logo-primary.svg',
  altText: 'Hays',
};

// VV. Dokumentierte Namensalternativen (nicht gleichzeitig anzeigen, nur Referenz fuer eine spaetere Entscheidung).
export const PRODUCT_NAME_ALTERNATIVES: readonly string[] = [
  'Hays Quality Hub',
  'Hays Test Management',
  'Hays Test Center',
  'Hays Quality & Test Hub',
  'Hays TestFlow',
];

export const HAYS_ORGANIZATION_THEME: OrganizationTheme = {
  id: 'hays-default',
  organizationName: 'Hays',
  productName: 'Hays Test Hub',
  shortProductName: 'Test Hub',
  tagline: 'AI-supported test management',
  description: 'Hays-internal platform for structured test design, execution and quality evidence.',
  primaryLogoPath: HAYS_BRAND_ASSETS.primaryLogo,
  reversedLogoPath: HAYS_BRAND_ASSETS.reversedLogo,
  symbolPath: HAYS_BRAND_ASSETS.symbolLogo,
  faviconPath: HAYS_BRAND_ASSETS.favicon,
  fontFamily: SAFE_FONT_STACK,
  colors: HAYS_BRAND_COLORS,
  semanticColors: { light: lightSemanticColors, dark: darkSemanticColors },
  typography,
  borderRadius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px' },
  shadows: {
    sm: '0 1px 2px rgba(10, 5, 50, 0.06)',
    md: '0 4px 10px rgba(10, 5, 50, 0.08)',
    lg: '0 10px 25px rgba(10, 5, 50, 0.12)',
  },
  // Hays Chart Palette: Brand-/Sekundaerfarben mit ausreichendem Kontrast fuer Diagramme (Abschnitt KK.10)
  chartPalette: [
    HAYS_BRAND_COLORS.azureBlue,
    HAYS_BRAND_COLORS.deepTeal,
    HAYS_BRAND_COLORS.orange,
    HAYS_BRAND_COLORS.lilac,
    HAYS_BRAND_COLORS.midnightBlue,
    HAYS_BRAND_COLORS.mint,
  ],
  darkMode: true,
  active: true,
  version: '1.0.0',
};

/**
 * Laedt das aktive Organization Theme. Aktuell statisch (kein Supabase-Roundtrip pro Render,
 * Abschnitt QQ). Der Rueckgabewert ist bewusst synchron und referenzstabil (Modul-Singleton),
 * damit Komponenten das Theme ohne wiederholte Netzwerk-/Ladezustaende konsumieren koennen.
 */
export const getActiveOrganizationTheme = (): OrganizationTheme => HAYS_ORGANIZATION_THEME;

export const PRODUCT_NAME = HAYS_ORGANIZATION_THEME.productName;
export const SHORT_PRODUCT_NAME = HAYS_ORGANIZATION_THEME.shortProductName;
export const PRODUCT_TAGLINE = HAYS_ORGANIZATION_THEME.tagline;
