# Design-Dokument: Deutschland rechnet

**Datum:** 2026-04-05
**Status:** Genehmigt
**Projektname:** Deutschland rechnet
**Domain:** GitHub Pages (`https://[username].github.io/deutschland-rechnet`) — Custom-Domain später möglich

---

## Ziel

Eine kostenlose, werbefreie Sammlung von Online-Rechnern und Konvertern mit Deutschland-Bezug. Jeder Rechner hat eine eigene SEO-optimierte Landing-Page. Keine Registrierung, keine persönlichen Daten, sofortiges Ergebnis.

---

## Tech-Stack

| Technologie | Zweck |
|---|---|
| **Astro** | Static Site Generator — generiert reines HTML |
| **GitHub Pages** | Hosting (kostenlos) |
| **GitHub Actions** | CI/CD — automatischer Build + Deploy bei jedem Push |
| **Vanilla JS** | Rechner-Logik als `<script>`-Tags direkt in `.astro`-Dateien |
| `@astrojs/sitemap` | Automatische Sitemap für SEO |

---

## Astro-Konfiguration (`astro.config.mjs`)

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://[username].github.io',
  base: '/deutschland-rechnet',
  trailingSlash: 'always',   // URLs: /geld/brutto-netto-rechner/
  integrations: [sitemap()],
});
```

`trailingSlash: 'always'` stellt sicher, dass generierte URLs konsistent mit der SEO-Strategie sind. Bei Custom-Domain wird `base` entfernt und `site` angepasst.

---

## JavaScript-Strategie

Rechner-Logik wird als inline `<script>`-Tag direkt in der jeweiligen `.astro`-Seite geschrieben — kein Astro-Bundling, kein Import aus `src/scripts/`. Das stellt sicher dass:
- Kein Framework-JS im Bundle landet
- Jede Seite nur ihr eigenes Script lädt
- Kein Build-Problem bei Astro's Client-Direktiven

Für komplexere Rechner (Brutto-Netto mit vielen Tabellen) wird die Logik als ES-Modul in `src/scripts/[rechner].js` abgelegt und per `<script src="/scripts/[rechner].js">` eingebunden.

---

## Projektstruktur

```
deutschland-rechnet/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── layouts/
│   │   └── Layout.astro            ← Globales Layout: Header, Footer, Meta-Tags, Canonical
│   ├── components/
│   │   ├── CalculatorShell.astro   ← Wrapper: SEO-Text oben, Rechner-UI, RelatedLinks unten
│   │   ├── CategoryGrid.astro      ← Kachelansicht der Kategorien (Startseite)
│   │   ├── CalculatorCard.astro    ← Einzelne Rechner-Vorschaukarte
│   │   └── RelatedLinks.astro      ← "Das könnte dich auch interessieren"-Leiste
│   ├── data/
│   │   └── calculators.ts          ← Zentrale Liste aller Rechner (Titel, URL, Kategorie, Tags)
│   ├── pages/
│   │   ├── index.astro             ← Startseite: Intro + 7 Kategorie-Kacheln
│   │   ├── geld/
│   │   │   ├── index.astro
│   │   │   ├── brutto-netto-rechner.astro
│   │   │   ├── unterhaltsrechner.astro
│   │   │   ├── elterngeld-rechner.astro
│   │   │   ├── kurzarbeitergeld-rechner.astro
│   │   │   ├── pfaendungsfreigrenze-rechner.astro
│   │   │   ├── abfindungsrechner.astro
│   │   │   ├── mindestlohn-rechner.astro
│   │   │   ├── kuendigungsfrist-rechner.astro
│   │   │   ├── ueberstunden-rechner.astro
│   │   │   └── steuerklassen-vergleich.astro
│   │   ├── wohnen/
│   │   │   ├── index.astro
│   │   │   ├── mietpreisbremse-rechner.astro
│   │   │   ├── nebenkosten-rechner.astro
│   │   │   ├── grunderwerbsteuer-rechner.astro
│   │   │   ├── immobilienkauf-nebenkosten.astro
│   │   │   └── tilgungs-kreditrechner.astro
│   │   ├── energie/
│   │   │   ├── index.astro
│   │   │   ├── stromkosten-rechner.astro
│   │   │   ├── heizkosten-rechner.astro
│   │   │   └── photovoltaik-rechner.astro
│   │   ├── auto/
│   │   │   ├── index.astro
│   │   │   ├── kfz-steuer-rechner.astro
│   │   │   ├── spritkosten-rechner.astro
│   │   │   └── fahrtkosten-rechner.astro
│   │   ├── familie/
│   │   │   ├── index.astro
│   │   │   ├── kindergeld-rechner.astro
│   │   │   ├── wohngeld-rechner.astro
│   │   │   ├── rentenpunkte-rechner.astro
│   │   │   └── mutterschutz-rechner.astro
│   │   ├── gesundheit/
│   │   │   ├── index.astro
│   │   │   ├── bmi-rechner.astro
│   │   │   ├── kalorien-rechner.astro
│   │   │   └── promille-rechner.astro
│   │   └── einheiten/
│   │       ├── index.astro
│   │       ├── einheitenrechner.astro
│   │       └── inflationsrechner.astro
│   ├── scripts/
│   │   ├── brutto-netto.js         ← Komplexe Rechner-Logik als ES-Modul
│   │   └── unterhalt.js
│   └── styles/
│       └── global.css
├── public/
│   ├── favicon.svg
│   └── robots.txt                  ← Manuell gepflegt: erlaubt alle Crawler
├── astro.config.mjs
└── package.json
```

---

## RelatedLinks-Logik

`calculators.ts` ist die zentrale Datenquelle: eine Liste aller Rechner mit `slug`, `title`, `category` und optionalen `tags`. `RelatedLinks.astro` erhält die aktuelle Kategorie als Prop und filtert daraus die verwandten Rechner:

- Zeigt alle anderen Rechner derselben Kategorie (max. 6)
- Falls weniger als 3 vorhanden: füllt mit den meistgesuchten Rechnern aus anderen Kategorien auf (definiert als `featured: true` in `calculators.ts`)
- Kein Edge-Case-Problem, da die Logik deklarativ über die Datendatei gesteuert wird

---

## Jede Rechner-Seite (Template)

1. **`<head>`**: Einzigartiger `<title>`, `<meta name="description">`, OpenGraph-Tags, `<link rel="canonical">`
2. **H1**: Keyword-optimiert, Jahr dynamisch via `new Date().getFullYear()` — z.B. "Brutto-Netto-Rechner 2026 – kostenlos & aktuell"
3. **Einleitungstext**: 50–80 Wörter, erklärt was der Rechner tut und für wen er nützlich ist
4. **Rechner-UI**: Sofort sichtbar ohne Scroll, Ergebnis erscheint live beim Eingeben
5. **RelatedLinks**: Verwandte Rechner aus derselben Kategorie
6. **Footer-Text**: Kurze Erklärung zur Berechnungsgrundlage inkl. Quellenhinweis (gut für SEO + Vertrauen)
7. **`<noscript>`**: Hinweistext "Bitte JavaScript aktivieren, um den Rechner zu nutzen."

---

## Kategorien & Rechner (35 gesamt, MVP: erste 10)

### MVP (erste Version)
1. Brutto-Netto-Rechner (Steuerklasse, Bundesland, Kirchensteuer)
2. Unterhaltsrechner (Düsseldorfer Tabelle 2026, nach Bundesland)
3. Elterngeld-Rechner
4. Kreditrechner / Tilgungsrechner
5. Stromkosten-Rechner
6. Kfz-Steuer-Rechner
7. BMI-Rechner
8. Kalorien-Rechner
9. Einheitenrechner
10. Grunderwerbsteuer nach Bundesland

### Iterativ danach
Alle weiteren 25 Rechner wie oben aufgelistet.

---

## Berechnungsgrundlagen (MVP)

Alle Rechner basieren auf öffentlich zugänglichen deutschen Gesetzen und Behördendaten. Daten werden als Konstanten im jeweiligen Script hardkodiert und müssen bei Gesetzesänderungen manuell aktualisiert werden.

| Rechner | Datenquelle |
|---|---|
| Brutto-Netto | § 32a EStG (Einkommensteuertarif), aktueller SV-Beitragssatz BMAS, Kirchensteuersätze je Bundesland |
| Unterhalt | Düsseldorfer Tabelle 2026 (OLG Düsseldorf) |
| Elterngeld | BEEG § 2 (67% des Nettoeinkommens, Min. 300 €, Max. 1.800 €) |
| Grunderwerbsteuer | Länderspezifische Steuersätze (3,5–6,5%) per Bundesland |
| Kfz-Steuer | KraftStG: 2 €/100 ccm (Benzin) / 9,50 €/100 ccm (Diesel) + CO2-Aufschlag |
| Kreditrechner | Standardformel Annuitätendarlehen |
| Stromkosten | Nutzereingabe kWh + Preis — keine externen Daten |
| BMI | WHO-Formel: kg / m² |
| Kalorien | Mifflin-St-Jeor-Formel (DE-Standard) |
| Einheitenrechner | SI-Einheiten, keine externen Daten |

---

## SEO-Strategie

- URL-Struktur: `/geld/brutto-netto-rechner/` (Kategorie + Keyword, Trailing Slash)
- Jede Seite: einzigartiger Title-Tag, Meta-Description, H1
- Canonical-Tag in jedem `<head>` (verhindert Duplikat-Content-Probleme bei Domain-Wechsel)
- `@astrojs/sitemap` generiert `sitemap.xml` automatisch
- `robots.txt` in `public/` erlaubt alle Crawler
- Seitentitel-Schema: `[Rechner-Name] [Jahr] – kostenlos | Deutschland rechnet` (Jahr dynamisch)
- Ladezeit: Ziel < 1 Sekunde (reines HTML, minimales CSS, JS nur pro Seite)

---

## Deployment (vollständige GitHub Actions YAML)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

Einmaliges Setup: GitHub Repository Settings → Pages → Source: **GitHub Actions**.

---

## CSS-Strategie

- `global.css`: CSS-Reset (box-sizing, margin 0), CSS-Variablen für Farben und Abstände, Basis-Typografie
- Komponenten-spezifisches Styling: Astro Scoped Styles (`<style>` in `.astro`-Dateien)
- Responsive Breakpoints: Mobile-first, ein Breakpoint bei 768px
- Keine externen Fonts — System-Font-Stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Farb-Variablen: `--color-black: #1a1a1a`, `--color-red: #DD0000`, `--color-gold: #FFCE00`

---

## Design-Prinzipien

- Kein Paywall, kein Login, kein Cookie-Banner (keine Tracking-Cookies)
- Farben: Schwarz/Weiß/Deutschlandfarben (Schwarz, Rot, Gold) als Akzent
- Mobile-first: alle Rechner funktionieren auf dem Handy
- Schrift: System-Font-Stack (schnell, kein externer Font-Load)
- Kein Framework-JavaScript im Bundle — nur was der Rechner wirklich braucht

---

## Nicht im Scope (vorerst)

- Benutzerkonten / gespeicherte Berechnungen
- PDF/Datei-Konvertierung (spätere Phase, erfordert Backend)
- Mehrsprachigkeit
- Werbung oder Monetarisierung
- Automatische Aktualisierung von Steuersätzen (manuelle Pflege bei Gesetzesänderungen)
