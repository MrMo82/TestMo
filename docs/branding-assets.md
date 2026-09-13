# Branding Assets – Hays Test Hub

Dieses Dokument dokumentiert die benötigten offiziellen Hays-Brand-Assets gemäß der zentralen
Konfiguration in [`theme/brand.ts`](../theme/brand.ts) (`HAYS_BRAND_ASSETS`). Solange die unten
genannten Dateien nicht vorliegen, verwendet die App automatisch einen reinen Textfallback
(„Hays“, Produktname „Hays Test Hub“) – siehe [`components/BrandLogo.tsx`](../components/BrandLogo.tsx).
Es wird **kein** Ersatzlogo erzeugt oder von der öffentlichen Hays-Website extrahiert (Abschnitt FF/RR).

## Benötigte Logo-Dateien

| Datei | Vorgesehener Pfad | Erlaubter Einsatz | Variante | Status |
|---|---|---|---|---|
| Hauptlogo | `/public/brand/hays-logo-primary.svg` | Login, Onboarding, größere Markenkontexte | Light (auf hellem Hintergrund) | **fehlt – offizielles Asset erforderlich** |
| Sekundärlogo | `/public/brand/hays-logo-secondary.svg` | Nur wenn der verfügbare Platz das Hauptlogo nicht zulässt | Light | **fehlt – offizielles Asset erforderlich** |
| Hays Symbol | `/public/brand/hays-symbol.svg` | Favicon, kompakter App-Header, mobile Darstellung, App-Icon/Manifest | Light | **fehlt – offizielles Asset erforderlich** |
| Reversed Logo | `/public/brand/hays-logo-reversed.svg` | Nur auf offiziell vorgesehenem dunklem Hintergrund (z.B. Login-Banner) | Dark | **fehlt – offizielles Asset erforderlich** |
| Favicon | `/public/brand/favicon.svg` | Browser-Tab-Icon | Light | **fehlt – offizielles Asset erforderlich** |

## Grundsätze

- Keine Logo-Manipulation: kein Nachzeichnen, Umfärben, Verzerren, Beschneiden, Rotieren,
  keine Schatten/Effekte, kein zusätzliches Kästchen, keine veränderte interne Proportion,
  keine selbst erfundene Strapline (Abschnitt FF).
- Kein CSS-Filter zur automatischen Invertierung/Umfärbung des Logos für Dark Mode – dafür wird
  ausschließlich die offizielle „Reversed“-Variante verwendet, sobald sie vorliegt (Abschnitt LL).
- Assets werden kontrolliert ins Repository gelegt (`/public/brand/`), versioniert über Git und
  nicht zur Laufzeit von externen URLs geladen (Abschnitt RR).
- Herkunft: ausschließlich offiziell durch Hays BrandCom freigegebene Original-Dateien.

## Favicon / App-Icon / Manifest

- `index.html` verlinkt `/brand/favicon.svg` (fehlt aktuell, kein Laufzeitfehler – Browser zeigt
  lediglich kein Icon an).
- `public/manifest.webmanifest` referenziert `/brand/hays-symbol.svg` als App-Icon.
- Theme Color: `#0A0532` (Midnight Blue). Background Color: `#FFFFFF`.

## Schrift- und Lizenzstatus

- Keine offiziell freigegebene, lizenzierte Hays-Webfont liegt aktuell im Repository oder einer
  freigegebenen internen Asset-Quelle vor.
- Es werden daher **keine** externen Font-Requests (auch keine Google Fonts) mehr geladen; der
  zuvor eingebundene Google-Fonts-Link („Inter“) wurde entfernt.
- Aktiver Font-Stack: `Arial, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  (siehe `theme/brand.ts` → `SAFE_FONT_STACK`).
- Sobald eine freigegebene Hays-Webfont mit geklärter Lizenz bereitgestellt wird, ist sie lokal
  (self-hosted, kein CDN) unter `/public/fonts/` einzubinden und `SAFE_FONT_STACK` entsprechend zu
  erweitern (Fallback-Kette beibehalten).

## Fehlende Assets (Zusammenfassung)

Alle fünf oben gelisteten Dateien fehlen aktuell. Bis zur Bereitstellung zeigt die App
ausschließlich den Textnamen „Hays“ bzw. „Hays Test Hub“ als Fallback.

## Freigabeprozess

Neue/aktualisierte Assets werden ausschließlich nach interner Freigabe durch das zuständige
Hays-BrandCom-Team in `/public/brand/` eingespielt und per Pull Request versioniert. Keine
personenbezogenen Kontaktdaten werden in diesem Dokument hartcodiert – die verantwortliche Stelle
ist im internen Hays-Markenportal zu erfragen.
