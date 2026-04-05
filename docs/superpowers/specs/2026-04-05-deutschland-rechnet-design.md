# Design-Dokument: Deutschland rechnet

**Datum:** 2026-04-05
**Status:** Genehmigt
**Projektname:** Deutschland rechnet
**Domain:** deutschland-rechnet (GitHub Pages)

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
| **Vanilla JS** | Rechner-Logik (keine Framework-Abhängigkeiten) |
| `@astrojs/sitemap` | Automatische Sitemap für SEO |

---

## Projektstruktur

```
deutschland-rechnet/
├── .github/
│   └── workflows/
│       └── deploy.yml              ← GitHub Actions: Build + Deploy auf Pages
├── src/
│   ├── layouts/
│   │   └── Layout.astro            ← Globales Layout: Header, Footer, Meta-Tags, Sidebar
│   ├── components/
│   │   ├── CalculatorShell.astro   ← Wrapper: SEO-Text oben, Rechner-UI, RelatedLinks unten
│   │   ├── CategoryGrid.astro      ← Kachelansicht der Kategorien (Startseite)
│   │   ├── CalculatorCard.astro    ← Einzelne Rechner-Vorschaukarte
│   │   └── RelatedLinks.astro      ← "Das könnte dich auch interessieren"-Leiste
│   ├── pages/
│   │   ├── index.astro             ← Startseite: Intro + 7 Kategorie-Kacheln
│   │   ├── geld/
│   │   │   ├── index.astro         ← Kategorie-Übersicht Geld & Gehalt
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
│   │   ├── brutto-netto.js         ← Reine Rechenlogik, kein DOM
│   │   ├── unterhalt.js
│   │   └── ...                     ← Je Rechner eine Datei
│   └── styles/
│       └── global.css              ← Minimal, schnell ladend
├── public/
│   └── favicon.svg
├── astro.config.mjs
└── package.json
```

---

## Jede Rechner-Seite (Template)

1. **`<head>`**: Einzigartiger `<title>`, `<meta name="description">`, OpenGraph-Tags
2. **H1**: Keyword-optimiert, z.B. "Brutto-Netto-Rechner 2025 – kostenlos & aktuell"
3. **Einleitungstext**: 50–80 Wörter, erklärt was der Rechner tut und für wen er nützlich ist
4. **Rechner-UI**: Sofort sichtbar ohne Scroll, Ergebnis erscheint live beim Eingeben
5. **RelatedLinks**: 5 verwandte Rechner aus derselben Kategorie + 3 Top-Rechner gesamt
6. **Footer-Text**: Kurze Erklärung zur Berechnung (gut für SEO + Vertrauen)

---

## Kategorien & Rechner (35 gesamt, MVP: erste 10)

### MVP (erste Version)
1. Brutto-Netto-Rechner (Steuerklasse, Bundesland, Kirchensteuer)
2. Unterhaltsrechner (Düsseldorfer Tabelle, nach Bundesland)
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

## SEO-Strategie

- URL-Struktur: `/geld/brutto-netto-rechner/` (Kategorie + Keyword)
- Jede Seite: einzigartiger Title-Tag, Meta-Description, H1
- `@astrojs/sitemap` generiert `sitemap.xml` automatisch
- `robots.txt` erlaubt alle Crawler
- Seitentitel-Schema: `[Rechner-Name] [Jahr] – kostenlos | Deutschland rechnet`
- Ladezeit: Ziel < 1 Sekunde (reines HTML, minimales CSS, JS nur wo nötig)

---

## Deployment

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    - npm install
    - npm run build        # astro build → dist/
    - Deploy dist/ → GitHub Pages
```

Einmaliges Setup: GitHub Repository Settings → Pages → Source: GitHub Actions.

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
