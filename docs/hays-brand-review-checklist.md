# Brand-Review-Checkliste – Hays Test Hub

Checkliste für die interne Review mit BrandCom vor Freigabe. Status: **Entwurf / technische
Umsetzung abgeschlossen, offizielle Assets ausstehend** (siehe `docs/branding-assets.md`).

| Bereich | Prüfpunkt | Status |
|---|---|---|
| Sichtbarer Produktname | „Hays Test Hub“ in Header, Login, Browser-Titel, Manifest | ✅ umgesetzt |
| Logoquelle | Offizielle Hays-SVG-Assets vorhanden | ⏳ offen – keine Assets im Repo |
| Logovariante | Primär/Symbol/Reversed korrekt kontextabhängig verwendet | ✅ Logik implementiert, ⏳ Assets ausstehend |
| Logoabstände | Keine Verzerrung/Beschneidung/Effekte | ✅ (Bild wird unverändert gerendert, sobald Asset vorhanden) |
| Favicon | Offizielles Hays-Symbol als Favicon | ⏳ offen – Platzhalterpfad verlinkt |
| Primärfarben | Midnight Blue `#0A0532`, Azure Blue `#2173FF` als Tokens | ✅ umgesetzt (`theme/brand.ts`) |
| Sekundärfarben | Teal, Deep Teal, Orange, Lilac, Mint als Tokens | ✅ umgesetzt |
| Semantische Farben | Getrennt von Markenfarben, für Status/Aktionen | ✅ umgesetzt (CSS Custom Properties) |
| Typografie | Sicherer Font-Stack (Arial/system-ui), keine externen Font-Requests | ✅ umgesetzt |
| Überschriften | Keine Standard-Großschreibung, sachliche technische Titel bleiben unverändert | ✅ |
| Navigation | „Projekte / Übersicht / Testfälle / Neuer Testfall / Import“, Azure-Blue-Aktivzustand | ✅ umgesetzt |
| Buttons | Primary/Secondary/Tertiary/Destructive/Success über Design-System-Seite dokumentiert | ✅ Referenz vorhanden, ⏳ nicht in allen Altkomponenten migriert |
| Formulare | Abschnitte, Pflichtfeld-Kennzeichnung, Hilfetexte | ⏳ teilweise (Projektformulare bereits gruppiert) |
| Tabellen | Klarer Hover/Fokus, responsive | ⏳ nicht vollständig migriert |
| Statusfarben | Icon + Text + aria-label statt reiner Farbe | ✅ `StatusBadge`-Komponente |
| Charts | Zentrale Hays-Chart-Palette | ✅ Palette in `theme/brand.ts` definiert, ⏳ Recharts-Komponenten noch nicht vollständig umgestellt |
| Empty States | Hays-konformes Wording („Erstes Testprojekt anlegen“) | ✅ umgesetzt (Projekte-Tab) |
| Login | „Willkommen im Hays Test Hub“, kein Leistungsversprechen | ✅ umgesetzt |
| Mobile | Responsive Grundlayout (Tailwind), keine dedizierte Mobile-Navigation | ⏳ Basis vorhanden, kein zusätzliches Mobile-Menü umgesetzt |
| Dark Mode | Eigene Dark-Tokens, kein reines Schwarz, kein CSS-Filter auf Logo | ✅ umgesetzt |
| Accessibility | Sichtbarer Fokus, `prefers-reduced-motion`, Status nie nur über Farbe | ✅ Basis umgesetzt, ⏳ keine automatisierte Kontrastprüfung in CI |
| Screenshots der Hauptansichten | Header, Übersicht, Testfälle, Login, Design-System-Seite | ⏳ offen (keine Screenshot-Pipeline in dieser Iteration) |
| Offene Abweichungen | Siehe Abschlussbericht im Chat | ⏳ dokumentiert |
| Interner Freigabestatus | Noch nicht durch BrandCom freigegeben | ⏳ offen |
