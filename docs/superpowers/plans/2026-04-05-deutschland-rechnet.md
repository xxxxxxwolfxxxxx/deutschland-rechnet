# Deutschland rechnet – Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Astro-basierte statische Website mit 10 SEO-Landing-Pages für deutsche Onlinerechner, deployt auf GitHub Pages.

**Architecture:** Astro generiert reines statisches HTML. Jeder Rechner ist eine eigene `.astro`-Seite mit inline JavaScript-Logik. Komplexe Rechner (Brutto-Netto, Unterhalt) haben ihre Logik in testbaren ES-Modulen unter `public/scripts/` — diese Dateien werden vom Browser direkt unter `/deutschland-rechnet/scripts/[name].js` geladen und von Vitest aus `../../public/scripts/` importiert. Einfache Rechner (Strom, Einheiten) haben die Logik vollständig inline. Zentrales `calculators.ts` steuert Navigation und RelatedLinks.

**Tech Stack:** Astro 4.x, Vanilla JS, Vitest (Unit-Tests), GitHub Actions, GitHub Pages

---

## Dateiübersicht

| Datei | Zweck |
|---|---|
| `astro.config.mjs` | Site-URL, base-Pfad, trailingSlash, Sitemap |
| `.github/workflows/deploy.yml` | Build + Deploy auf GitHub Pages |
| `public/robots.txt` | SEO: alle Crawler erlaubt |
| `public/favicon.svg` | Favicon (DE-Flagge als SVG) |
| `src/layouts/Layout.astro` | Globales HTML-Gerüst: Meta, Canonical, Header, Footer |
| `src/data/calculators.ts` | Liste aller Rechner (slug, title, category, featured) |
| `src/components/CalculatorCard.astro` | Einzelne Kachel auf Kategorie-/Startseite |
| `src/components/CategoryGrid.astro` | Kachelraster für Kategorien |
| `src/components/RelatedLinks.astro` | "Das könnte dich auch interessieren" |
| `src/components/CalculatorShell.astro` | Wrapper: SEO-Text + Rechner-UI + RelatedLinks |
| `src/styles/global.css` | CSS-Reset, Variablen, Basis-Typografie |
| `src/pages/index.astro` | Startseite |
| `src/pages/[kategorie]/index.astro` | 6 Kategorie-Übersichtsseiten |
| `src/pages/geld/brutto-netto-rechner.astro` | Seite + inline UI |
| `public/scripts/brutto-netto.js` | Rechenlogik (testbar, vom Browser direkt geladen) |
| `src/pages/geld/unterhaltsrechner.astro` | Seite + inline UI |
| `public/scripts/unterhalt.js` | Rechenlogik (testbar) |
| `src/pages/geld/elterngeld-rechner.astro` | Seite + inline UI |
| `public/scripts/elterngeld.js` | Rechenlogik (testbar) |
| `src/pages/wohnen/tilgungs-kreditrechner.astro` | Seite + inline UI |
| `public/scripts/kredit.js` | Rechenlogik (testbar) |
| `src/pages/wohnen/grunderwerbsteuer-rechner.astro` | Seite + inline UI |
| `public/scripts/grunderwerbsteuer.js` | Rechenlogik (testbar) |
| `src/pages/energie/stromkosten-rechner.astro` | Seite + inline UI (kein separates Script) |
| `src/pages/auto/kfz-steuer-rechner.astro` | Seite + inline UI |
| `public/scripts/kfz-steuer.js` | Rechenlogik (testbar) |
| `src/pages/gesundheit/bmi-rechner.astro` | Seite + inline UI |
| `public/scripts/bmi.js` | Rechenlogik (testbar) |
| `src/pages/gesundheit/kalorien-rechner.astro` | Seite + inline UI |
| `public/scripts/kalorien.js` | Rechenlogik (testbar) |
| `src/pages/einheiten/einheitenrechner.astro` | Seite + inline UI (kein separates Script) |
| `tests/scripts/*.test.js` | Vitest-Tests — importieren aus `../../public/scripts/` |

---

## Task 1: Projekt-Setup

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `vitest.config.js`

- [ ] **Schritt 1: Astro-Projekt initialisieren**

Im Verzeichnis `/Users/matthiasduhrkop/Documents/deutschland-rechnet/` ausführen:

```bash
npm create astro@latest . -- --template minimal --no-git --install --typescript strict
```

Wenn interaktiv gefragt wird: TypeScript `strict`, kein Git (haben wir bereits).

- [ ] **Schritt 2: Sitemap-Plugin installieren**

```bash
npm install @astrojs/sitemap
```

- [ ] **Schritt 3: Vitest installieren**

```bash
npm install --save-dev vitest
```

- [ ] **Schritt 4: `astro.config.mjs` überschreiben**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://[USERNAME].github.io',
  base: '/deutschland-rechnet',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
```

**WICHTIG:** `[USERNAME]` durch den echten GitHub-Benutzernamen ersetzen. Bei Custom-Domain: `site` auf Domain setzen, `base` entfernen.

- [ ] **Schritt 5: `vitest.config.js` erstellen**

```js
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Schritt 6: Test-Verzeichnis anlegen**

```bash
mkdir -p tests/scripts
```

- [ ] **Schritt 7: `package.json` Scripts prüfen/ergänzen**

Sicherstellen dass `package.json` diese Scripts enthält:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run"
  }
}
```

- [ ] **Schritt 8: Build prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: `dist/` wird erstellt, keine Fehler.

- [ ] **Schritt 9: Commit**

```bash
git add package.json package-lock.json astro.config.mjs vitest.config.js tsconfig.json
git commit -m "feat: initialize Astro project with sitemap and Vitest"
```

---

## Task 2: GitHub Repo + Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `public/robots.txt`
- Create: `public/favicon.svg`

- [ ] **Schritt 1: GitHub-Repo erstellen und `[USERNAME]` ersetzen**

```bash
# GitHub-Benutzernamen ermitteln:
USERNAME=$(gh api user --jq '.login')
echo "Benutzername: $USERNAME"

gh repo create deutschland-rechnet --public --description "Kostenlose Rechner und Konverter für Deutschland"
git remote add origin https://github.com/$USERNAME/deutschland-rechnet.git
git push -u origin main
```

Dann `[USERNAME]` in beiden Dateien ersetzen:
- `astro.config.mjs`: `site: 'https://[USERNAME].github.io'` → `site: "https://$USERNAME.github.io"`
- `public/robots.txt`: Sitemap-URL anpassen

- [ ] **Schritt 2: GitHub Pages aktivieren**

```bash
gh api repos/[USERNAME]/deutschland-rechnet/pages \
  --method POST \
  --field build_type=workflow
```

Alternativ: GitHub.com → Repository → Settings → Pages → Source: **GitHub Actions**.

- [ ] **Schritt 3: `deploy.yml` erstellen**

```bash
mkdir -p .github/workflows
```

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

concurrency:
  group: pages
  cancel-in-progress: false

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
      - run: npm test
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

- [ ] **Schritt 4: `robots.txt` erstellen**

```
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://[USERNAME].github.io/deutschland-rechnet/sitemap-index.xml
```

- [ ] **Schritt 5: `favicon.svg` erstellen**

```svg
<!-- public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="10.67" y="0" fill="#1a1a1a"/>
  <rect width="32" height="10.67" y="10.67" fill="#DD0000"/>
  <rect width="32" height="10.66" y="21.34" fill="#FFCE00"/>
</svg>
```

- [ ] **Schritt 6: Commit + Push**

```bash
git add .github/ public/
git commit -m "feat: add GitHub Actions deploy workflow, robots.txt and favicon"
git push
```

Erwartetes Ergebnis: GitHub Actions startet automatisch, Deploy schlägt noch fehl (keine Seiten) — das ist OK.

---

## Task 3: Datendatei und globale Styles

**Files:**
- Create: `src/data/calculators.ts`
- Create: `src/styles/global.css`

- [ ] **Schritt 1: `src/data/calculators.ts` erstellen**

```typescript
// src/data/calculators.ts
export type Category =
  | 'geld'
  | 'wohnen'
  | 'energie'
  | 'auto'
  | 'familie'
  | 'gesundheit'
  | 'einheiten';

export interface Calculator {
  slug: string;         // URL-Segment: 'brutto-netto-rechner'
  title: string;        // Anzeigename: 'Brutto-Netto-Rechner'
  description: string;  // Kurzbeschreibung für Cards
  category: Category;
  featured?: boolean;   // Erscheint in RelatedLinks anderer Kategorien
  live?: boolean;       // Nur live=true werden in Navigation gezeigt
}

export const CATEGORIES: Record<Category, { label: string; emoji: string; description: string }> = {
  geld:      { label: 'Geld & Gehalt',        emoji: '💰', description: 'Gehalt, Steuern, Sozialleistungen' },
  wohnen:    { label: 'Wohnen & Immobilien',  emoji: '🏠', description: 'Miete, Kauf, Kredit, Nebenkosten' },
  energie:   { label: 'Energie',              emoji: '⚡', description: 'Strom, Heizung, Photovoltaik' },
  auto:      { label: 'Auto & Mobilität',     emoji: '🚗', description: 'Kfz-Steuer, Sprit, Fahrtkosten' },
  familie:   { label: 'Familie & Soziales',   emoji: '👨‍👩‍👧', description: 'Elterngeld, Kindergeld, Rente' },
  gesundheit:{ label: 'Gesundheit & Fitness', emoji: '🏃', description: 'BMI, Kalorien, Promille' },
  einheiten: { label: 'Einheiten & Mathe',    emoji: '📐', description: 'Länge, Gewicht, Temperatur, Inflation' },
};

export const CALCULATORS: Calculator[] = [
  // GELD
  { slug: 'brutto-netto-rechner',      title: 'Brutto-Netto-Rechner',      description: 'Nettolohn aus Bruttogehalt berechnen – mit Steuerklasse und Bundesland.',    category: 'geld',      featured: true,  live: true },
  { slug: 'unterhaltsrechner',         title: 'Unterhaltsrechner',         description: 'Kindesunterhalt nach Düsseldorfer Tabelle 2026 berechnen.',                  category: 'geld',      featured: true,  live: true },
  { slug: 'elterngeld-rechner',        title: 'Elterngeld-Rechner',        description: 'Elterngeld und ElterngeldPlus nach BEEG berechnen.',                         category: 'geld',      featured: false, live: true },
  { slug: 'kurzarbeitergeld-rechner',  title: 'Kurzarbeitergeld-Rechner',  description: 'Kurzarbeitergeld Höhe berechnen.',                                           category: 'geld',      featured: false, live: false },
  { slug: 'abfindungsrechner',         title: 'Abfindungsrechner',         description: 'Abfindung bei Kündigung berechnen.',                                         category: 'geld',      featured: false, live: false },
  { slug: 'mindestlohn-rechner',       title: 'Mindestlohn-Rechner',       description: 'Stunden in Mindestlohn-Gehalt umrechnen.',                                   category: 'geld',      featured: false, live: false },
  { slug: 'kuendigungsfrist-rechner',  title: 'Kündigungsfrist-Rechner',   description: 'Gesetzliche Kündigungsfrist nach Betriebszugehörigkeit.',                   category: 'geld',      featured: false, live: false },
  { slug: 'ueberstunden-rechner',      title: 'Überstunden-Rechner',       description: 'Überstundenvergütung berechnen.',                                           category: 'geld',      featured: false, live: false },
  { slug: 'steuerklassen-vergleich',   title: 'Steuerklassen-Vergleich',   description: 'Steuerklassen I–VI vergleichen.',                                           category: 'geld',      featured: false, live: false },
  { slug: 'pfaendungsfreigrenze-rechner', title: 'Pfändungsfreigrenze',    description: 'Pfändbares Einkommen berechnen.',                                           category: 'geld',      featured: false, live: false },
  // WOHNEN
  { slug: 'tilgungs-kreditrechner',    title: 'Kreditrechner',             description: 'Monatliche Rate, Zinsen und Tilgung für Darlehen berechnen.',               category: 'wohnen',    featured: true,  live: true },
  { slug: 'grunderwerbsteuer-rechner', title: 'Grunderwerbsteuer-Rechner', description: 'Grunderwerbsteuer nach Bundesland berechnen.',                              category: 'wohnen',    featured: true,  live: true },
  { slug: 'mietpreisbremse-rechner',   title: 'Mietpreisbremse-Rechner',   description: 'Zulässige Miethöhe nach Mietpreisbremse prüfen.',                           category: 'wohnen',    featured: false, live: false },
  { slug: 'nebenkosten-rechner',       title: 'Nebenkosten-Rechner',       description: 'Monatliche Nebenkosten für Wohnungen berechnen.',                           category: 'wohnen',    featured: false, live: false },
  { slug: 'immobilienkauf-nebenkosten',title: 'Immobilienkauf-Nebenkosten','Notar, Makler und Grunderwerbsteuer beim Immobilienkauf.',                               category: 'wohnen',    featured: false, live: false },
  // ENERGIE
  { slug: 'stromkosten-rechner',       title: 'Stromkosten-Rechner',       description: 'Stromkosten aus kWh-Verbrauch und Preis berechnen.',                        category: 'energie',   featured: true,  live: true },
  { slug: 'heizkosten-rechner',        title: 'Heizkosten-Rechner',        description: 'Jährliche Heizkosten berechnen.',                                           category: 'energie',   featured: false, live: false },
  { slug: 'photovoltaik-rechner',      title: 'Photovoltaik-Rechner',      description: 'Amortisationszeit einer PV-Anlage berechnen.',                             category: 'energie',   featured: false, live: false },
  // AUTO
  { slug: 'kfz-steuer-rechner',        title: 'Kfz-Steuer-Rechner',        description: 'Kfz-Steuer für Benziner, Diesel und Elektro berechnen.',                  category: 'auto',      featured: true,  live: true },
  { slug: 'spritkosten-rechner',       title: 'Spritkosten-Rechner',       description: 'Kraftstoffkosten für eine Fahrt berechnen.',                               category: 'auto',      featured: false, live: false },
  { slug: 'fahrtkosten-rechner',       title: 'Fahrtkosten-Rechner',       description: 'Steuerliche Kilometerpauschale berechnen.',                                category: 'auto',      featured: false, live: false },
  // FAMILIE
  { slug: 'kindergeld-rechner',        title: 'Kindergeld-Rechner',        description: 'Kindergeld nach Anzahl der Kinder berechnen.',                             category: 'familie',   featured: false, live: false },
  { slug: 'wohngeld-rechner',          title: 'Wohngeld-Rechner',          description: 'Anspruch auf Wohngeld prüfen.',                                            category: 'familie',   featured: false, live: false },
  { slug: 'rentenpunkte-rechner',      title: 'Rentenpunkte-Rechner',      description: 'Entgeltpunkte und Rentenanspruch berechnen.',                              category: 'familie',   featured: false, live: false },
  { slug: 'mutterschutz-rechner',      title: 'Mutterschutz-Rechner',      description: 'Mutterschutz-Beginn und -Ende aus Geburtstermin berechnen.',              category: 'familie',   featured: false, live: false },
  // GESUNDHEIT
  { slug: 'bmi-rechner',               title: 'BMI-Rechner',               description: 'Body-Mass-Index nach WHO-Formel berechnen.',                               category: 'gesundheit',featured: true,  live: true },
  { slug: 'kalorien-rechner',          title: 'Kalorien-Rechner',          description: 'Täglichen Kalorienbedarf nach Mifflin-St-Jeor berechnen.',                category: 'gesundheit',featured: false, live: true },
  { slug: 'promille-rechner',          title: 'Promille-Rechner',          description: 'Blutalkohol nach Widmark-Formel berechnen.',                              category: 'gesundheit',featured: false, live: false },
  // EINHEITEN
  { slug: 'einheitenrechner',          title: 'Einheitenrechner',          description: 'Länge, Gewicht, Temperatur, Volumen umrechnen.',                          category: 'einheiten', featured: true,  live: true },
  { slug: 'inflationsrechner',         title: 'Inflationsrechner',         description: 'Kaufkraftverlust durch Inflation berechnen.',                             category: 'einheiten', featured: false, live: false },
];

export function getByCategory(category: Category): Calculator[] {
  return CALCULATORS.filter(c => c.category === category && c.live);
}

export function getRelated(current: Calculator, limit = 6): Calculator[] {
  const same = CALCULATORS.filter(c => c.category === current.category && c.slug !== current.slug && c.live);
  if (same.length >= 3) return same.slice(0, limit);
  const featured = CALCULATORS.filter(c => c.featured && c.slug !== current.slug && c.live && c.category !== current.category);
  return [...same, ...featured].slice(0, limit);
}
```

- [ ] **Schritt 2: `src/styles/global.css` erstellen**

```css
/* src/styles/global.css */
:root {
  --color-black: #1a1a1a;
  --color-red: #DD0000;
  --color-gold: #FFCE00;
  --color-white: #ffffff;
  --color-bg: #f8f8f8;
  --color-border: #e0e0e0;
  --color-text: #1a1a1a;
  --color-text-muted: #666666;
  --color-link: #CC0000;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --max-width: 900px;
  --radius: 8px;
  --shadow: 0 1px 4px rgba(0,0,0,0.1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; scroll-behavior: smooth; }

body {
  font-family: var(--font);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
}

a { color: var(--color-link); }
a:hover { text-decoration: none; }

h1 { font-size: 1.75rem; font-weight: 700; line-height: 1.2; margin-bottom: 0.75rem; }
h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
p  { margin-bottom: 1rem; }

.container { max-width: var(--max-width); margin: 0 auto; padding: 0 1rem; }

/* Calculator UI shared styles */
.calc-group { margin-bottom: 1rem; }
.calc-group label { display: block; font-weight: 500; margin-bottom: 0.25rem; font-size: 0.9rem; }
.calc-group input,
.calc-group select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 1rem;
  font-family: var(--font);
  background: white;
}
.calc-group input:focus,
.calc-group select:focus { outline: 2px solid var(--color-red); border-color: var(--color-red); }

.calc-result {
  background: var(--color-black);
  color: var(--color-white);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  margin-top: 1.25rem;
  font-size: 1.5rem;
  font-weight: 700;
}
.calc-result .label { font-size: 0.85rem; font-weight: 400; color: #aaa; margin-bottom: 0.25rem; }

@media (min-width: 768px) {
  h1 { font-size: 2rem; }
  .calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
}
```

- [ ] **Schritt 3: Commit**

```bash
git add src/data/ src/styles/
git commit -m "feat: add calculators data file and global CSS"
```

---

## Task 4: Layout und Komponenten

**Files:**
- Create: `src/layouts/Layout.astro`
- Create: `src/components/CalculatorCard.astro`
- Create: `src/components/CategoryGrid.astro`
- Create: `src/components/RelatedLinks.astro`
- Create: `src/components/CalculatorShell.astro`

- [ ] **Schritt 1: `src/layouts/Layout.astro` erstellen**

```astro
---
// src/layouts/Layout.astro
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  canonicalPath: string;  // z.B. '/geld/brutto-netto-rechner/'
}

const { title, description, canonicalPath } = Astro.props;
const siteUrl = import.meta.env.SITE ?? 'https://deutschland-rechnet.de';
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const canonical = `${siteUrl}${base}${canonicalPath}`;
const year = new Date().getFullYear();
---
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} – kostenlos | Deutschland rechnet</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <link rel="icon" type="image/svg+xml" href={`${base}/favicon.svg`} />
  <link rel="sitemap" href={`${base}/sitemap-index.xml`} />
  <meta property="og:title" content={`${title} – kostenlos | Deutschland rechnet`} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
</head>
<body>
  <header>
    <div class="container">
      <nav>
        <a href={`${base}/`} class="logo">🇩🇪 Deutschland rechnet</a>
        <span class="tagline">Kostenlose Rechner für Deutschland</span>
      </nav>
    </div>
  </header>
  <main class="container">
    <slot />
  </main>
  <footer>
    <div class="container">
      <p>© {year} Deutschland rechnet · Kostenlos · Keine Werbung · Kein Login</p>
      <p><a href={`${base}/`}>Alle Rechner</a></p>
    </div>
  </footer>
  <noscript>
    <style>.calc-form { display: none; }</style>
    <p style="background:#fff3cd;padding:1rem;border-radius:8px;margin:1rem 0;">
      Bitte JavaScript aktivieren, um den Rechner zu nutzen.
    </p>
  </noscript>
</body>
</html>

<style>
header {
  background: var(--color-black);
  color: white;
  padding: 0.75rem 0;
  margin-bottom: 2rem;
}
header nav { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.logo { color: white; text-decoration: none; font-weight: 700; font-size: 1.1rem; }
.tagline { color: #aaa; font-size: 0.85rem; }
footer { margin-top: 3rem; padding: 1.5rem 0; border-top: 2px solid var(--color-gold); background: var(--color-black); color: #aaa; font-size: 0.85rem; }
footer a { color: var(--color-gold); }
footer p { margin-bottom: 0.25rem; }
</style>
```

- [ ] **Schritt 2: `src/components/CalculatorCard.astro` erstellen**

```astro
---
// src/components/CalculatorCard.astro
interface Props {
  title: string;
  description: string;
  href: string;
  emoji?: string;
}
const { title, description, href, emoji = '🔢' } = Astro.props;
---
<a href={href} class="card">
  <span class="card-emoji">{emoji}</span>
  <div>
    <strong>{title}</strong>
    <p>{description}</p>
  </div>
</a>

<style>
.card {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem;
  background: white;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--color-text);
  box-shadow: var(--shadow);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.card:hover { border-color: var(--color-red); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.card-emoji { font-size: 1.5rem; flex-shrink: 0; }
.card strong { display: block; margin-bottom: 0.2rem; }
.card p { font-size: 0.85rem; color: var(--color-text-muted); margin: 0; }
</style>
```

- [ ] **Schritt 3: `src/components/CategoryGrid.astro` erstellen**

```astro
---
// src/components/CategoryGrid.astro
import { CATEGORIES, getByCategory, type Category } from '../data/calculators';
import CalculatorCard from './CalculatorCard.astro';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const categories = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][];
---
<div class="cat-grid">
  {categories.map(([key, cat]) => {
    const calcs = getByCategory(key);
    return (
      <div class="cat-section">
        <h2><a href={`${base}/${key}/`}>{cat.emoji} {cat.label}</a></h2>
        <p class="cat-desc">{cat.description}</p>
        <div class="calc-list">
          {calcs.map(c => (
            <CalculatorCard
              title={c.title}
              description={c.description}
              href={`${base}/${c.category}/${c.slug}/`}
            />
          ))}
        </div>
        {calcs.length === 0 && <p class="coming-soon">Demnächst verfügbar</p>}
      </div>
    );
  })}
</div>

<style>
.cat-grid { display: flex; flex-direction: column; gap: 2.5rem; }
.cat-section h2 a { color: var(--color-text); text-decoration: none; }
.cat-section h2 a:hover { color: var(--color-red); }
.cat-desc { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 0.75rem; }
.calc-list { display: grid; gap: 0.75rem; }
.coming-soon { color: var(--color-text-muted); font-style: italic; font-size: 0.9rem; }
@media (min-width: 768px) { .calc-list { grid-template-columns: 1fr 1fr; } }
</style>
```

- [ ] **Schritt 4: `src/components/RelatedLinks.astro` erstellen**

```astro
---
// src/components/RelatedLinks.astro
import { getRelated, CATEGORIES, type Calculator } from '../data/calculators';
import CalculatorCard from './CalculatorCard.astro';

interface Props { current: Calculator; }
const { current } = Astro.props;
const related = getRelated(current);
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---
{related.length > 0 && (
  <section class="related">
    <h2>Das könnte dich auch interessieren</h2>
    <div class="related-grid">
      {related.map(c => (
        <CalculatorCard
          title={c.title}
          description={c.description}
          href={`${base}/${c.category}/${c.slug}/`}
          emoji={CATEGORIES[c.category].emoji}
        />
      ))}
    </div>
  </section>
)}

<style>
.related { margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid var(--color-border); }
.related h2 { margin-bottom: 1rem; }
.related-grid { display: grid; gap: 0.75rem; }
@media (min-width: 768px) { .related-grid { grid-template-columns: 1fr 1fr 1fr; } }
</style>
```

- [ ] **Schritt 5: `src/components/CalculatorShell.astro` erstellen**

```astro
---
// src/components/CalculatorShell.astro
import RelatedLinks from './RelatedLinks.astro';
import { type Calculator } from '../data/calculators';

interface Props {
  calculator: Calculator;
  intro: string;        // 50-80 Wörter SEO-Text
  sourceNote: string;   // Quellen-Hinweis für Footer
}
const { calculator, intro, sourceNote } = Astro.props;
---
<article>
  <p class="intro">{intro}</p>

  <div class="calc-box">
    <slot />
  </div>

  <p class="source-note">{sourceNote}</p>

  <RelatedLinks current={calculator} />
</article>

<style>
.intro { color: var(--color-text-muted); margin-bottom: 1.5rem; }
.calc-box {
  background: white;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 1rem;
}
.source-note { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.5rem; }
</style>
```

- [ ] **Schritt 6: Build prüfen**

```bash
npm run build
```

Erwartetes Ergebnis: Kompiliert ohne Fehler (noch keine Pages außer evtl. index.astro).

- [ ] **Schritt 7: Commit**

```bash
git add src/
git commit -m "feat: add Layout, CalculatorCard, CategoryGrid, RelatedLinks, CalculatorShell components"
```

---

## Task 5: Startseite und Kategorie-Übersichtsseiten

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/pages/geld/index.astro`
- Create: `src/pages/wohnen/index.astro`
- Create: `src/pages/energie/index.astro`
- Create: `src/pages/auto/index.astro`
- Create: `src/pages/familie/index.astro`
- Create: `src/pages/gesundheit/index.astro`
- Create: `src/pages/einheiten/index.astro`

- [ ] **Schritt 1: `src/pages/index.astro` erstellen**

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import CategoryGrid from '../components/CategoryGrid.astro';
---
<Layout
  title="Kostenlose Rechner für Deutschland"
  description="Brutto-Netto, Unterhalt, Elterngeld, Stromkosten und viele weitere kostenlose Rechner mit Deutschland-Bezug. Kein Login, sofortiges Ergebnis."
  canonicalPath="/"
>
  <h1>Kostenlose Rechner für Deutschland</h1>
  <p class="subtitle">Kein Login · Keine Werbung · Sofortiges Ergebnis</p>
  <CategoryGrid />
</Layout>

<style>
.subtitle { color: var(--color-text-muted); margin-bottom: 2rem; font-size: 1rem; }
</style>
```

- [ ] **Schritt 2: Kategorie-Index-Seiten erstellen**

Muster für alle 7 Kategorien. Hier Geld als Beispiel — andere analog erstellen:

```astro
---
// src/pages/geld/index.astro
import Layout from '../../layouts/Layout.astro';
import CalculatorCard from '../../components/CalculatorCard.astro';
import { getByCategory, CATEGORIES } from '../../data/calculators';

const cat = CATEGORIES['geld'];
const calcs = getByCategory('geld');
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<Layout
  title={cat.label}
  description={`Alle kostenlosen ${cat.label}-Rechner: ${calcs.map(c => c.title).join(', ')}.`}
  canonicalPath="/geld/"
>
  <a href={`${base}/`}>← Alle Kategorien</a>
  <h1>{cat.emoji} {cat.label}</h1>
  <p>{cat.description}</p>
  <div class="grid">
    {calcs.map(c => (
      <CalculatorCard title={c.title} description={c.description} href={`${base}/${c.category}/${c.slug}/`} />
    ))}
  </div>
</Layout>

<style>
.grid { display: grid; gap: 0.75rem; margin-top: 1.5rem; }
@media (min-width: 768px) { .grid { grid-template-columns: 1fr 1fr; } }
</style>
```

Gleiches Muster für: `wohnen/index.astro`, `energie/index.astro`, `auto/index.astro`, `familie/index.astro`, `gesundheit/index.astro`, `einheiten/index.astro` — jeweils `category`-Key und `canonicalPath` anpassen.

- [ ] **Schritt 3: Build + lokale Vorschau**

```bash
npm run build && npm run preview
```

Öffne `http://localhost:4321/deutschland-rechnet/` — Startseite sollte Kategorie-Kacheln zeigen.

- [ ] **Schritt 4: Commit**

```bash
git add src/pages/
git commit -m "feat: add homepage and category index pages"
git push
```

---

## Task 6: Brutto-Netto-Rechner

**Files:**
- Create: `public/scripts/brutto-netto.js`
- Create: `tests/scripts/brutto-netto.test.js`
- Create: `src/pages/geld/brutto-netto-rechner.astro`

- [ ] **Schritt 1: Test schreiben (failing)**

```js
// tests/scripts/brutto-netto.test.js
import { describe, it, expect } from 'vitest';
import { berechneNettoGehalt, STEUERKLASSEN } from '../../public/scripts/brutto-netto.js';

describe('berechneNettoGehalt', () => {
  it('Steuerklasse 1, 3000 brutto, keine Kirche, Westdeutschland', () => {
    const ergebnis = berechneNettoGehalt({
      bruttoMonat: 3000,
      steuerklasse: 1,
      kirchensteuer: false,
      bundesland: 'nw',  // Nordrhein-Westfalen: 9% KiSt, aber wir testen ohne
    });
    // Netto sollte zwischen 2000 und 2500 liegen (Plausibilitätsprüfung)
    expect(ergebnis.netto).toBeGreaterThan(2000);
    expect(ergebnis.netto).toBeLessThan(2500);
    expect(ergebnis.sozialversicherung).toBeGreaterThan(0);
    expect(ergebnis.lohnsteuer).toBeGreaterThan(0);
    expect(ergebnis.kirchensteuer).toBe(0);
  });

  it('Steuerklasse 3 hat weniger Lohnsteuer als Klasse 1', () => {
    const basis = { bruttoMonat: 4000, kirchensteuer: false, bundesland: 'by' };
    const sk1 = berechneNettoGehalt({ ...basis, steuerklasse: 1 });
    const sk3 = berechneNettoGehalt({ ...basis, steuerklasse: 3 });
    expect(sk3.lohnsteuer).toBeLessThan(sk1.lohnsteuer);
  });

  it('Mit Kirchensteuer ergibt mehr Abzüge', () => {
    const basis = { bruttoMonat: 3000, steuerklasse: 1, bundesland: 'by' };
    const ohneKi = berechneNettoGehalt({ ...basis, kirchensteuer: false });
    const mitKi  = berechneNettoGehalt({ ...basis, kirchensteuer: true });
    expect(mitKi.netto).toBeLessThan(ohneKi.netto);
    expect(mitKi.kirchensteuer).toBeGreaterThan(0);
  });

  it('Gibt alle erwarteten Felder zurück', () => {
    const r = berechneNettoGehalt({ bruttoMonat: 2500, steuerklasse: 1, kirchensteuer: false, bundesland: 'be' });
    expect(r).toHaveProperty('netto');
    expect(r).toHaveProperty('lohnsteuer');
    expect(r).toHaveProperty('soli');
    expect(r).toHaveProperty('kirchensteuer');
    expect(r).toHaveProperty('sozialversicherung');
    expect(r).toHaveProperty('krankenversicherung');
    expect(r).toHaveProperty('rentenversicherung');
    expect(r).toHaveProperty('arbeitslosenversicherung');
    expect(r).toHaveProperty('pflegeversicherung');
  });
});
```

- [ ] **Schritt 2: Test ausführen (soll FAIL)**

```bash
npm test -- tests/scripts/brutto-netto.test.js
```

Erwartetes Ergebnis: FAIL – "Cannot find module"

- [ ] **Schritt 3: `public/scripts/brutto-netto.js` implementieren**

```js
// public/scripts/brutto-netto.js
// Berechnungsgrundlage: § 32a EStG 2025, BMAS SV-Beitragssätze 2025
// Bei Gesetzesänderungen: Konstanten unten aktualisieren.

// Sozialversicherung 2025 (Arbeitnehmeranteil)
const SV = {
  krankenversicherung: 0.073 + 0.009,   // GKV-Beitrag 14,6% + ø Zusatzbeitrag 1,8% → AN-Anteil
  rentenversicherung: 0.093,             // 18,6% → AN-Anteil 9,3%
  arbeitslosenversicherung: 0.013,       // 2,6% → AN-Anteil 1,3%
  pflegeversicherung: 0.018,             // 3,6% → AN-Anteil 1,8% (ohne Kinder-Zuschlag)
  kvBBG: 5512.50,                        // KV/PV Beitragsbemessungsgrenze monatlich
  rvBBG: 7550,                           // RV/AV West monatlich
};

// Kirchensteuersätze nach Bundesland
const KIST = {
  by: 0.08, bw: 0.08,  // Bayern, Baden-Württemberg: 8%
  // alle anderen: 9%
};

// Jährlicher Einkommensteuertarif § 32a EStG 2025
// Grundfreibetrag 2025: 12.096 €
function einkommensteuerJahr(zvE) {
  if (zvE <= 12096) return 0;
  if (zvE <= 17005) {
    const y = (zvE - 12096) / 10000;
    return Math.round((979.18 * y + 1400) * y);
  }
  if (zvE <= 66760) {
    const z = (zvE - 17005) / 10000;
    return Math.round((192.59 * z + 2397) * z + 966.53);
  }
  if (zvE <= 277825) {
    return Math.round(0.42 * zvE - 10911.92);
  }
  return Math.round(0.45 * zvE - 19246.67);
}

// Steuerklassen-Faktoren (vereinfacht für Lohnsteuerberechnung)
const SK_FAKTOREN = {
  1: { freibetrag: 12096 },
  2: { freibetrag: 15900 },  // mit Entlastungsbetrag Alleinerziehende
  3: { freibetrag: 24192 },  // Doppelter Grundfreibetrag
  4: { freibetrag: 12096 },
  5: { freibetrag: 0 },
  6: { freibetrag: 0 },
};

export const STEUERKLASSEN = [1, 2, 3, 4, 5, 6];

export function berechneNettoGehalt({ bruttoMonat, steuerklasse, kirchensteuer, bundesland }) {
  const bruttoJahr = bruttoMonat * 12;
  const freibetrag = SK_FAKTOREN[steuerklasse]?.freibetrag ?? 12096;

  // Sozialversicherung (monatlich)
  const kvBasis = Math.min(bruttoMonat, SV.kvBBG);
  const rvBasis = Math.min(bruttoMonat, SV.rvBBG);
  const kv = Math.round(kvBasis * SV.krankenversicherung * 100) / 100;
  const rv = Math.round(rvBasis * SV.rentenversicherung * 100) / 100;
  const av = Math.round(rvBasis * SV.arbeitslosenversicherung * 100) / 100;
  const pv = Math.round(kvBasis * SV.pflegeversicherung * 100) / 100;
  const svGesamt = kv + rv + av + pv;

  // Lohnsteuer (Jahresmethode)
  const svJahr = svGesamt * 12;
  const zvE = Math.max(0, bruttoJahr - freibetrag - svJahr);
  const estJahr = einkommensteuerJahr(zvE);
  const lohnsteuerMonat = Math.round(estJahr / 12 * 100) / 100;

  // Solidaritätszuschlag (Freigrenze 2025: 18.130 € ESt)
  let soliMonat = 0;
  if (estJahr > 18130) {
    soliMonat = Math.round((estJahr * 0.055) / 12 * 100) / 100;
  }

  // Kirchensteuer
  let kistMonat = 0;
  if (kirchensteuer) {
    const satz = KIST[bundesland] ?? 0.09;
    kistMonat = Math.round(lohnsteuerMonat * satz * 100) / 100;
  }

  const abzuege = svGesamt + lohnsteuerMonat + soliMonat + kistMonat;
  const netto = Math.round((bruttoMonat - abzuege) * 100) / 100;

  return {
    netto,
    lohnsteuer: lohnsteuerMonat,
    soli: soliMonat,
    kirchensteuer: kistMonat,
    sozialversicherung: Math.round(svGesamt * 100) / 100,
    krankenversicherung: kv,
    rentenversicherung: rv,
    arbeitslosenversicherung: av,
    pflegeversicherung: pv,
  };
}
```

- [ ] **Schritt 4: Tests ausführen (sollen PASS)**

```bash
npm test -- tests/scripts/brutto-netto.test.js
```

Erwartetes Ergebnis: 4/4 Tests PASS.

- [ ] **Schritt 5: `src/pages/geld/brutto-netto-rechner.astro` erstellen**

```astro
---
// src/pages/geld/brutto-netto-rechner.astro
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';

const calc = CALCULATORS.find(c => c.slug === 'brutto-netto-rechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`Brutto-Netto-Rechner ${year}`}
  description="Nettolohn aus Bruttogehalt berechnen – kostenlos, mit Steuerklasse, Bundesland und Kirchensteuer. Sofortiges Ergebnis."
  canonicalPath="/geld/brutto-netto-rechner/"
>
  <a href={`${import.meta.env.BASE_URL}geld/`}>← Geld & Gehalt</a>
  <h1>Brutto-Netto-Rechner {year} – kostenlos & aktuell</h1>

  <CalculatorShell
    calculator={calc}
    intro="Mit dem Brutto-Netto-Rechner berechnen Sie schnell und kostenlos Ihr monatliches Nettoeinkommen. Geben Sie Ihr Bruttogehalt, Ihre Steuerklasse und Ihr Bundesland ein – alle Abzüge wie Lohnsteuer, Solidaritätszuschlag und Sozialversicherungsbeiträge werden automatisch berücksichtigt."
    sourceNote="Berechnung nach § 32a EStG 2025, aktuellen SV-Beitragssätzen (BMAS) und länderspezifischen Kirchensteuersätzen. Ohne Gewähr – für verbindliche Auskünfte wenden Sie sich an das Finanzamt."
  >
    <div class="calc-form">
      <div class="calc-grid">
        <div class="calc-group">
          <label for="brutto">Bruttogehalt (monatlich, €)</label>
          <input type="number" id="brutto" min="0" max="100000" value="3000" step="50" />
        </div>
        <div class="calc-group">
          <label for="steuerklasse">Steuerklasse</label>
          <select id="steuerklasse">
            <option value="1">I – Ledig, getrennt lebend</option>
            <option value="2">II – Alleinerziehend</option>
            <option value="3">III – Verheiratet, höheres Einkommen</option>
            <option value="4" selected>IV – Verheiratet, ähnliches Einkommen</option>
            <option value="5">V – Verheiratet, geringeres Einkommen</option>
            <option value="6">VI – Zweites Arbeitsverhältnis</option>
          </select>
        </div>
        <div class="calc-group">
          <label for="bundesland">Bundesland</label>
          <select id="bundesland">
            <option value="bw">Baden-Württemberg</option>
            <option value="by">Bayern</option>
            <option value="be">Berlin</option>
            <option value="bb">Brandenburg</option>
            <option value="hb">Bremen</option>
            <option value="hh">Hamburg</option>
            <option value="he">Hessen</option>
            <option value="mv">Mecklenburg-Vorpommern</option>
            <option value="ni">Niedersachsen</option>
            <option value="nw" selected>Nordrhein-Westfalen</option>
            <option value="rp">Rheinland-Pfalz</option>
            <option value="sl">Saarland</option>
            <option value="sn">Sachsen</option>
            <option value="st">Sachsen-Anhalt</option>
            <option value="sh">Schleswig-Holstein</option>
            <option value="th">Thüringen</option>
          </select>
        </div>
        <div class="calc-group">
          <label for="kirche">Kirchensteuer</label>
          <select id="kirche">
            <option value="nein" selected>Nein</option>
            <option value="ja">Ja</option>
          </select>
        </div>
      </div>

      <div class="calc-result" id="ergebnis">
        <div class="label">Nettolohn monatlich</div>
        <div id="netto-wert">— €</div>
      </div>

      <details class="details">
        <summary>Aufschlüsselung</summary>
        <table id="aufschluss">
          <tr><td>Bruttogehalt</td><td id="r-brutto">—</td></tr>
          <tr><td>Lohnsteuer</td><td id="r-lst">—</td></tr>
          <tr><td>Solidaritätszuschlag</td><td id="r-soli">—</td></tr>
          <tr><td>Kirchensteuer</td><td id="r-ki">—</td></tr>
          <tr><td>Krankenversicherung</td><td id="r-kv">—</td></tr>
          <tr><td>Rentenversicherung</td><td id="r-rv">—</td></tr>
          <tr><td>Arbeitslosenversicherung</td><td id="r-av">—</td></tr>
          <tr><td>Pflegeversicherung</td><td id="r-pv">—</td></tr>
          <tr class="total"><td><strong>Nettolohn</strong></td><td id="r-netto"><strong>—</strong></td></tr>
        </table>
      </details>
    </div>
  </CalculatorShell>
</Layout>

<script type="module">
// import.meta.env.BASE_URL wird von Astro/Vite zur Build-Zeit durch den konfigurierten base-Pfad ersetzt
const { berechneNettoGehalt } = await import(import.meta.env.BASE_URL + 'scripts/brutto-netto.js');

function fmt(n) { return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }

function berechne() {
  const brutto = parseFloat(document.getElementById('brutto').value) || 0;
  const sk = parseInt(document.getElementById('steuerklasse').value);
  const bl = document.getElementById('bundesland').value;
  const ki = document.getElementById('kirche').value === 'ja';
  const r = berechneNettoGehalt({ bruttoMonat: brutto, steuerklasse: sk, bundesland: bl, kirchensteuer: ki });
  document.getElementById('netto-wert').textContent = fmt(r.netto);
  document.getElementById('r-brutto').textContent = fmt(brutto);
  document.getElementById('r-lst').textContent = '− ' + fmt(r.lohnsteuer);
  document.getElementById('r-soli').textContent = '− ' + fmt(r.soli);
  document.getElementById('r-ki').textContent = '− ' + fmt(r.kirchensteuer);
  document.getElementById('r-kv').textContent = '− ' + fmt(r.krankenversicherung);
  document.getElementById('r-rv').textContent = '− ' + fmt(r.rentenversicherung);
  document.getElementById('r-av').textContent = '− ' + fmt(r.arbeitslosenversicherung);
  document.getElementById('r-pv').textContent = '− ' + fmt(r.pflegeversicherung);
  document.getElementById('r-netto').innerHTML = '<strong>' + fmt(r.netto) + '</strong>';
}

document.querySelectorAll('#brutto, #steuerklasse, #bundesland, #kirche').forEach(el => el.addEventListener('input', berechne));
berechne();
</script>

<style>
.details { margin-top: 1rem; }
.details summary { cursor: pointer; color: var(--color-text-muted); font-size: 0.9rem; }
table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.9rem; }
td { padding: 0.3rem 0.5rem; border-bottom: 1px solid var(--color-border); }
td:last-child { text-align: right; }
tr.total td { border-top: 2px solid var(--color-black); border-bottom: none; }
</style>
```

**Hinweis:** Das Script-Import-Pfad `/deutschland-rechnet/scripts/brutto-netto.js` erfordert, dass die Datei unter `public/scripts/` liegt ODER Astro das Modul im Build exposed. Einfachste Lösung: Logik als inline Script wiederholen (den Import durch die Funktion selbst ersetzen). Alternative: `src/scripts/brutto-netto.js` auch nach `public/scripts/` kopieren via `public/`-Symlink oder das Script vollständig inlinen.

**Empfehlung:** Für die Seite die Logik direkt inline duplizieren (YAGNI — Tests laufen auf `src/scripts/`, die Seite ist standalone). Das ermöglicht auch einfache Updates.

- [ ] **Schritt 6: Alle Tests ausführen**

```bash
npm test
```

Erwartetes Ergebnis: Alle Tests PASS.

- [ ] **Schritt 7: Build prüfen**

```bash
npm run build
```

- [ ] **Schritt 8: Commit**

```bash
git add public/scripts/brutto-netto.js src/pages/geld/ tests/
git commit -m "feat: add Brutto-Netto-Rechner with tests"
git push
```

---

## Task 7: Unterhaltsrechner

**Files:**
- Create: `public/scripts/unterhalt.js`
- Create: `tests/scripts/unterhalt.test.js`
- Create: `src/pages/geld/unterhaltsrechner.astro`

- [ ] **Schritt 1: Test schreiben**

```js
// tests/scripts/unterhalt.test.js
import { describe, it, expect } from 'vitest';
import { berechneUnterhalt } from '../../public/scripts/unterhalt.js';

describe('berechneUnterhalt', () => {
  it('Kind 5 Jahre, Einkommen 2000 netto → Tabellenwert Gruppe 1', () => {
    const r = berechneUnterhalt({ alterKind: 5, nettoEinkommen: 2000 });
    expect(r.unterhalt).toBeGreaterThan(0);
    expect(r.einkommensgruppe).toBe(1);
  });

  it('Höheres Einkommen → höhere Gruppe', () => {
    const r1 = berechneUnterhalt({ alterKind: 8, nettoEinkommen: 2000 });
    const r2 = berechneUnterhalt({ alterKind: 8, nettoEinkommen: 4000 });
    expect(r2.unterhalt).toBeGreaterThan(r1.unterhalt);
  });

  it('Älteres Kind → höherer Unterhalt', () => {
    const r1 = berechneUnterhalt({ alterKind: 4, nettoEinkommen: 2500 });
    const r2 = berechneUnterhalt({ alterKind: 14, nettoEinkommen: 2500 });
    expect(r2.unterhalt).toBeGreaterThan(r1.unterhalt);
  });
});
```

- [ ] **Schritt 2: Test ausführen (FAIL)**

```bash
npm test -- tests/scripts/unterhalt.test.js
```

- [ ] **Schritt 3: `src/scripts/unterhalt.js` implementieren**

```js
// public/scripts/unterhalt.js
// Düsseldorfer Tabelle 2026 – Kindesunterhalt
// Quelle: OLG Düsseldorf, https://www.olg-duesseldorf.nrw.de

// Tabelle: [nettoEinkommenBis, [0-5, 6-11, 12-17, ab18]]
const TABELLE = [
  [1900,  [480,  551,  645,  693]],
  [2300,  [504,  579,  677,  728]],
  [2700,  [534,  614,  718,  772]],
  [3100,  [564,  648,  759,  816]],
  [3700,  [602,  692,  810,  870]],
  [4300,  [643,  739,  865,  930]],
  [4900,  [684,  787,  921,  990]],
  [5500,  [726,  835,  978, 1052]],
  [6400,  [790,  909, 1064, 1145]],
  [7500,  [857,  986, 1154, 1241]],
  [Infinity, [927, 1067, 1249, 1343]],
];

function getAltersstufe(alter) {
  if (alter <= 5)  return 0;
  if (alter <= 11) return 1;
  if (alter <= 17) return 2;
  return 3;
}

export function berechneUnterhalt({ alterKind, nettoEinkommen }) {
  const stufe = getAltersstufe(alterKind);
  let gruppenIndex = 0;
  let unterhalt = 0;

  for (let i = 0; i < TABELLE.length; i++) {
    const [grenze, betraege] = TABELLE[i];
    if (nettoEinkommen <= grenze) {
      gruppenIndex = i;
      unterhalt = betraege[stufe];
      break;
    }
  }

  return {
    unterhalt,
    einkommensgruppe: gruppenIndex + 1,
    altersstufe: stufe + 1,
  };
}
```

- [ ] **Schritt 4: Tests ausführen (PASS)**

```bash
npm test -- tests/scripts/unterhalt.test.js
```

- [ ] **Schritt 5: Seite erstellen**

```astro
---
// src/pages/geld/unterhaltsrechner.astro
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';
const calc = CALCULATORS.find(c => c.slug === 'unterhaltsrechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`Unterhaltsrechner ${year}`}
  description="Kindesunterhalt nach Düsseldorfer Tabelle 2026 berechnen – kostenlos, nach Alter und Nettoeinkommen. Sofortiges Ergebnis."
  canonicalPath="/geld/unterhaltsrechner/"
>
  <a href={`${import.meta.env.BASE_URL}geld/`}>← Geld & Gehalt</a>
  <h1>Unterhaltsrechner {year} – Düsseldorfer Tabelle</h1>

  <CalculatorShell
    calculator={calc}
    intro="Berechnen Sie den monatlichen Kindesunterhalt nach der aktuellen Düsseldorfer Tabelle. Geben Sie das Alter des Kindes und das monatliche Nettoeinkommen des Unterhaltspflichtigen ein. Der Rechner berücksichtigt alle Altersgruppen und Einkommensgruppen der Tabelle 2026."
    sourceNote="Grundlage: Düsseldorfer Tabelle 2026 (OLG Düsseldorf). Ohne Gewähr. Für den tatsächlichen Unterhalt können weitere Faktoren wie Selbstbehalt und Einkommen des betreuenden Elternteils relevant sein."
  >
    <div class="calc-form">
      <div class="calc-grid">
        <div class="calc-group">
          <label for="alter">Alter des Kindes</label>
          <input type="number" id="alter" min="0" max="25" value="8" />
        </div>
        <div class="calc-group">
          <label for="einkommen">Nettoeinkommen Unterhaltspflichtiger (€/Monat)</label>
          <input type="number" id="einkommen" min="0" max="20000" value="2500" step="100" />
        </div>
      </div>
      <div class="calc-result">
        <div class="label">Monatlicher Unterhalt</div>
        <div id="ergebnis">— €</div>
      </div>
      <p id="info" style="margin-top:0.5rem;font-size:0.85rem;color:#666;"></p>
    </div>
  </CalculatorShell>
</Layout>

<script>
// Düsseldorfer Tabelle 2026 (inline)
const TABELLE = [
  [1900,  [480,  551,  645,  693]],
  [2300,  [504,  579,  677,  728]],
  [2700,  [534,  614,  718,  772]],
  [3100,  [564,  648,  759,  816]],
  [3700,  [602,  692,  810,  870]],
  [4300,  [643,  739,  865,  930]],
  [4900,  [684,  787,  921,  990]],
  [5500,  [726,  835,  978, 1052]],
  [6400,  [790,  909, 1064, 1145]],
  [7500,  [857,  986, 1154, 1241]],
  [Infinity, [927, 1067, 1249, 1343]],
];
function stufe(alter) { return alter<=5?0:alter<=11?1:alter<=17?2:3; }
const STUFEN = ['0–5 Jahre', '6–11 Jahre', '12–17 Jahre', 'ab 18 Jahre'];

function berechne() {
  const alter = parseInt(document.getElementById('alter').value)||0;
  const einkommen = parseFloat(document.getElementById('einkommen').value)||0;
  const s = stufe(alter);
  let gruppe = 0, betrag = 0;
  for (let i=0; i<TABELLE.length; i++) {
    if (einkommen <= TABELLE[i][0]) { gruppe=i+1; betrag=TABELLE[i][1][s]; break; }
  }
  document.getElementById('ergebnis').textContent = betrag.toLocaleString('de-DE') + ' €';
  document.getElementById('info').textContent = `Altersgruppe: ${STUFEN[s]} · Einkommensgruppe: ${gruppe}`;
}

document.getElementById('alter').addEventListener('input', berechne);
document.getElementById('einkommen').addEventListener('input', berechne);
berechne();
</script>
```

- [ ] **Schritt 6: Alle Tests + Build**

```bash
npm test && npm run build
```

- [ ] **Schritt 7: Commit**

```bash
git add public/scripts/unterhalt.js src/pages/geld/unterhaltsrechner.astro tests/scripts/unterhalt.test.js
git commit -m "feat: add Unterhaltsrechner (Düsseldorfer Tabelle 2026) with tests"
git push
```

---

## Task 8: Elterngeld-Rechner

**Files:**
- Create: `public/scripts/elterngeld.js`
- Create: `tests/scripts/elterngeld.test.js`
- Create: `src/pages/geld/elterngeld-rechner.astro`

- [ ] **Schritt 1: Test schreiben**

```js
// tests/scripts/elterngeld.test.js
import { describe, it, expect } from 'vitest';
import { berechneElterngeld } from '../../public/scripts/elterngeld.js';

describe('berechneElterngeld', () => {
  it('67% des Nettoeinkommens bei 2000 € netto', () => {
    const r = berechneElterngeld({ nettoMonat: 2000 });
    expect(r.elterngeld).toBe(1340);
  });
  it('Minimum 300 € bei sehr niedrigem Einkommen', () => {
    const r = berechneElterngeld({ nettoMonat: 300 });
    expect(r.elterngeld).toBe(300);
  });
  it('Maximum 1800 € bei sehr hohem Einkommen', () => {
    const r = berechneElterngeld({ nettoMonat: 5000 });
    expect(r.elterngeld).toBe(1800);
  });
  it('ElterngeldPlus ist die Hälfte, doppelte Bezugsdauer', () => {
    const r = berechneElterngeld({ nettoMonat: 2000 });
    expect(r.elterngeldPlus).toBe(670);
  });
});
```

- [ ] **Schritt 2: Test ausführen (FAIL)**

```bash
npm test -- tests/scripts/elterngeld.test.js
```

- [ ] **Schritt 3: Implementieren**

```js
// public/scripts/elterngeld.js
// Grundlage: BEEG § 2 (67% des Nettoeinkommens, Min 300 €, Max 1800 €)

export function berechneElterngeld({ nettoMonat }) {
  const berechnet = Math.round(nettoMonat * 0.67);
  const elterngeld = Math.min(1800, Math.max(300, berechnet));
  const elterngeldPlus = Math.round(elterngeld / 2);
  return { elterngeld, elterngeldPlus };
}
```

- [ ] **Schritt 4: Tests ausführen (PASS)**

```bash
npm test -- tests/scripts/elterngeld.test.js
```

- [ ] **Schritt 5: Seite erstellen**

```astro
---
// src/pages/geld/elterngeld-rechner.astro
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';
const calc = CALCULATORS.find(c => c.slug === 'elterngeld-rechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`Elterngeld-Rechner ${year}`}
  description="Elterngeld und ElterngeldPlus kostenlos berechnen. Sofortiges Ergebnis nach BEEG – ohne Anmeldung."
  canonicalPath="/geld/elterngeld-rechner/"
>
  <a href={`${import.meta.env.BASE_URL}geld/`}>← Geld & Gehalt</a>
  <h1>Elterngeld-Rechner {year} – kostenlos berechnen</h1>

  <CalculatorShell
    calculator={calc}
    intro="Berechnen Sie Ihr monatliches Elterngeld schnell und kostenlos. Grundlage ist das Nettoeinkommen der letzten 12 Monate vor der Geburt. Das Elterngeld beträgt 67 % des Nettoeinkommens, mindestens 300 € und maximal 1.800 € pro Monat."
    sourceNote="Berechnung nach BEEG § 2. Vereinfachte Berechnung – tatsächliches Elterngeld hängt vom Durchschnitt der letzten 12 Monate vor Geburt ab. Zuständig: Elterngeldstelle des Wohnorts."
  >
    <div class="calc-form">
      <div class="calc-group">
        <label for="netto">Monatliches Nettoeinkommen vor Geburt (€)</label>
        <input type="number" id="netto" min="0" max="20000" value="2500" step="50" />
      </div>
      <div class="calc-result">
        <div class="label">Elterngeld monatlich</div>
        <div id="ergebnis">— €</div>
      </div>
      <p id="plus" style="margin-top:0.75rem;font-size:0.95rem;"></p>
    </div>
  </CalculatorShell>
</Layout>

<script>
function berechne() {
  const netto = parseFloat(document.getElementById('netto').value)||0;
  const eg = Math.min(1800, Math.max(300, Math.round(netto * 0.67)));
  const egPlus = Math.round(eg / 2);
  document.getElementById('ergebnis').textContent = eg.toLocaleString('de-DE') + ' €';
  document.getElementById('plus').textContent = `ElterngeldPlus: ${egPlus.toLocaleString('de-DE')} € / Monat (doppelte Bezugsdauer)`;
}
document.getElementById('netto').addEventListener('input', berechne);
berechne();
</script>
```

- [ ] **Schritt 6: Tests + Commit**

```bash
npm test && npm run build
git add src/ tests/
git commit -m "feat: add Elterngeld-Rechner with tests"
git push
```

---

## Task 9: Kreditrechner / Tilgungsrechner

**Files:**
- Create: `src/scripts/kredit.js`
- Create: `tests/scripts/kredit.test.js`
- Create: `src/pages/wohnen/tilgungs-kreditrechner.astro`

- [ ] **Schritt 1: Test schreiben**

```js
// tests/scripts/kredit.test.js
import { describe, it, expect } from 'vitest';
import { berechneKredit } from '../../src/scripts/kredit.js';

describe('berechneKredit', () => {
  it('200.000 € bei 3% über 20 Jahre', () => {
    const r = berechneKredit({ betrag: 200000, zinssatz: 3, laufzeitJahre: 20 });
    expect(r.monatsrate).toBeGreaterThan(1000);
    expect(r.monatsrate).toBeLessThan(1200);
    expect(r.gesamtkosten).toBeGreaterThan(200000);
    expect(r.gesamtzinsen).toBeGreaterThan(0);
  });
  it('Keine Zinsen → Monatsrate = Betrag / Monate', () => {
    const r = berechneKredit({ betrag: 12000, zinssatz: 0, laufzeitJahre: 1 });
    expect(r.monatsrate).toBe(1000);
  });
});
```

- [ ] **Schritt 2: Test ausführen (FAIL)**

```bash
npm test -- tests/scripts/kredit.test.js
```

- [ ] **Schritt 3: Implementieren**

```js
// src/scripts/kredit.js
// Annuitätendarlehen: Standardformel für Tilgungs- und Kreditrechner

export function berechneKredit({ betrag, zinssatz, laufzeitJahre }) {
  const n = laufzeitJahre * 12;
  const r = zinssatz / 100 / 12;

  let monatsrate;
  if (r === 0) {
    monatsrate = betrag / n;
  } else {
    monatsrate = betrag * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  monatsrate = Math.round(monatsrate * 100) / 100;
  const gesamtkosten = Math.round(monatsrate * n * 100) / 100;
  const gesamtzinsen = Math.round((gesamtkosten - betrag) * 100) / 100;

  return { monatsrate, gesamtkosten, gesamtzinsen };
}
```

- [ ] **Schritt 4: Tests ausführen (PASS)**

```bash
npm test -- tests/scripts/kredit.test.js
```

- [ ] **Schritt 5: `src/pages/wohnen/tilgungs-kreditrechner.astro` erstellen**

```astro
---
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';
const calc = CALCULATORS.find(c => c.slug === 'tilgungs-kreditrechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`Kreditrechner ${year}`}
  description="Monatliche Kreditrate, Gesamtkosten und Zinsen für Annuitätendarlehen berechnen – kostenlos. Für Hypotheken, Autokredite und Ratenkredite."
  canonicalPath="/wohnen/tilgungs-kreditrechner/"
>
  <a href={`${import.meta.env.BASE_URL}wohnen/`}>← Wohnen & Immobilien</a>
  <h1>Kreditrechner {year} – Rate und Zinsen berechnen</h1>
  <CalculatorShell
    calculator={calc}
    intro="Berechnen Sie die monatliche Rate, die Gesamtkosten und die Zinslast für Ihren Kredit. Geben Sie Darlehensbetrag, Zinssatz und Laufzeit ein – das Ergebnis erscheint sofort. Geeignet für Hypotheken, Autokredite und Ratenkredite."
    sourceNote="Berechnung nach Annuitätendarlehen-Formel. Ohne Berücksichtigung von Bearbeitungsgebühren oder Sondertilgungen."
  >
    <div class="calc-form">
      <div class="calc-grid">
        <div class="calc-group">
          <label for="betrag">Darlehensbetrag (€)</label>
          <input type="number" id="betrag" min="0" max="10000000" value="200000" step="1000" />
        </div>
        <div class="calc-group">
          <label for="zins">Zinssatz (% p.a.)</label>
          <input type="number" id="zins" min="0" max="20" value="3.5" step="0.1" />
        </div>
        <div class="calc-group">
          <label for="laufzeit">Laufzeit (Jahre)</label>
          <input type="number" id="laufzeit" min="1" max="50" value="20" />
        </div>
      </div>
      <div class="calc-result">
        <div class="label">Monatliche Rate</div>
        <div id="rate">— €</div>
      </div>
      <div class="detail-grid">
        <div><span>Gesamtkosten:</span> <strong id="gesamt">—</strong></div>
        <div><span>Davon Zinsen:</span> <strong id="zinsen">—</strong></div>
      </div>
    </div>
  </CalculatorShell>
</Layout>

<script>
function fmt(n) { return n.toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' €'; }
function berechne() {
  const betrag = parseFloat(document.getElementById('betrag').value)||0;
  const zinssatz = parseFloat(document.getElementById('zins').value)||0;
  const jahre = parseInt(document.getElementById('laufzeit').value)||1;
  const n = jahre * 12;
  const r = zinssatz / 100 / 12;
  let rate;
  if (r === 0) { rate = betrag / n; }
  else { rate = betrag * (r * Math.pow(1+r,n)) / (Math.pow(1+r,n) - 1); }
  rate = Math.round(rate * 100) / 100;
  const gesamt = Math.round(rate * n * 100) / 100;
  const zinsen = Math.round((gesamt - betrag) * 100) / 100;
  document.getElementById('rate').textContent = fmt(rate);
  document.getElementById('gesamt').textContent = fmt(gesamt);
  document.getElementById('zinsen').textContent = fmt(zinsen);
}
['betrag','zins','laufzeit'].forEach(id => document.getElementById(id).addEventListener('input', berechne));
berechne();
</script>

<style>
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.75rem; font-size: 0.9rem; }
.detail-grid span { color: var(--color-text-muted); }
</style>
```

- [ ] **Schritt 6: Alle Tests + Build + Commit**

```bash
npm test && npm run build
git add public/scripts/kredit.js src/pages/wohnen/tilgungs-kreditrechner.astro tests/scripts/kredit.test.js
git commit -m "feat: add Kreditrechner (Annuitätendarlehen) with tests"
git push
```

---

## Task 10: Stromkosten-Rechner

**Files:**
- Create: `src/pages/energie/stromkosten-rechner.astro`

*(Kein separates Script – einfache Multiplikation, direkt inline)*

- [ ] **Schritt 1: Seite erstellen**

```astro
---
// src/pages/energie/stromkosten-rechner.astro
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';
const calc = CALCULATORS.find(c => c.slug === 'stromkosten-rechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`Stromkosten-Rechner ${year}`}
  description="Stromkosten aus Verbrauch (kWh) und Strompreis berechnen – kostenlos. Jahres- und Monatskosten auf einen Blick."
  canonicalPath="/energie/stromkosten-rechner/"
>
  <a href={`${import.meta.env.BASE_URL}energie/`}>← Energie</a>
  <h1>Stromkosten-Rechner {year} – kWh in Euro umrechnen</h1>

  <CalculatorShell
    calculator={calc}
    intro="Berechnen Sie Ihre jährlichen und monatlichen Stromkosten kostenlos. Geben Sie Ihren Jahresverbrauch in kWh und den aktuellen Strompreis pro kWh ein. Der bundesdeutsche Durchschnittshaushalt verbraucht ca. 3.500 kWh pro Jahr."
    sourceNote="Berechnung: Verbrauch (kWh) × Preis (ct/kWh). Durchschnittsstrompreis 2025 laut BDEW ca. 31 ct/kWh. Ohne Grundgebühr."
  >
    <div class="calc-form">
      <div class="calc-grid">
        <div class="calc-group">
          <label for="kwh">Jahresverbrauch (kWh)</label>
          <input type="number" id="kwh" min="0" max="100000" value="3500" step="100" />
        </div>
        <div class="calc-group">
          <label for="preis">Strompreis (Cent/kWh)</label>
          <input type="number" id="preis" min="0" max="100" value="31" step="0.1" />
        </div>
      </div>
      <div class="calc-result">
        <div class="label">Stromkosten pro Jahr</div>
        <div id="jahr">— €</div>
      </div>
      <p id="monat" style="margin-top:0.5rem;font-size:0.95rem;color:#666;"></p>
    </div>
  </CalculatorShell>
</Layout>

<script>
function berechne() {
  const kwh = parseFloat(document.getElementById('kwh').value)||0;
  const preis = parseFloat(document.getElementById('preis').value)||0;
  const jahr = Math.round(kwh * preis) / 100;
  document.getElementById('jahr').textContent = jahr.toLocaleString('de-DE', {minimumFractionDigits:2}) + ' €';
  document.getElementById('monat').textContent = 'Pro Monat: ' + (jahr/12).toLocaleString('de-DE', {minimumFractionDigits:2}) + ' €';
}
['kwh','preis'].forEach(id => document.getElementById(id).addEventListener('input', berechne));
berechne();
</script>
```

- [ ] **Schritt 2: Build + Commit**

```bash
npm run build
git add src/pages/energie/
git commit -m "feat: add Stromkosten-Rechner"
git push
```

---

## Task 11: Kfz-Steuer-Rechner

**Files:**
- Create: `public/scripts/kfz-steuer.js`
- Create: `tests/scripts/kfz-steuer.test.js`
- Create: `src/pages/auto/kfz-steuer-rechner.astro`

- [ ] **Schritt 1: Test schreiben**

```js
// tests/scripts/kfz-steuer.test.js
import { describe, it, expect } from 'vitest';
import { berechneKfzSteuer } from '../../public/scripts/kfz-steuer.js';

describe('berechneKfzSteuer', () => {
  it('Benziner 1400 ccm, kein CO2-Aufschlag alt', () => {
    const r = berechneKfzSteuer({ antrieb: 'benzin', hubraum: 1400, co2: 0 });
    expect(r.steuerJahr).toBeGreaterThan(0);
  });
  it('Diesel hat höheren Grundsteuersatz', () => {
    const b = berechneKfzSteuer({ antrieb: 'benzin', hubraum: 1400, co2: 120 });
    const d = berechneKfzSteuer({ antrieb: 'diesel', hubraum: 1400, co2: 120 });
    expect(d.steuerJahr).toBeGreaterThan(b.steuerJahr);
  });
  it('Elektro: keine Steuer bis 2030 (0 €)', () => {
    const r = berechneKfzSteuer({ antrieb: 'elektro', hubraum: 0, co2: 0 });
    expect(r.steuerJahr).toBe(0);
  });
});
```

- [ ] **Schritt 2: Test ausführen (FAIL)**

```bash
npm test -- tests/scripts/kfz-steuer.test.js
```

- [ ] **Schritt 3: Implementieren**

```js
// public/scripts/kfz-steuer.js
// Grundlage: KraftStG
// Benzin: 2,00 €/100 ccm · Diesel: 9,50 €/100 ccm · CO2: 2 €/g ab 96 g/km

const SATZ = { benzin: 2.00, diesel: 9.50 };

// CO2-Staffel (€/g/km) ab 2021
const CO2_STAFFEL = [
  [95,  0],
  [115, 2],
  [135, 2.20],
  [155, 2.50],
  [175, 2.90],
  [195, 3.40],
  [Infinity, 4.00],
];

function co2Steuer(co2) {
  let steuer = 0;
  let prev = 0;
  for (const [grenze, satz] of CO2_STAFFEL) {
    if (co2 <= grenze) {
      steuer += (co2 - prev) * satz;
      break;
    }
    steuer += (grenze - prev) * satz;
    prev = grenze;
  }
  return Math.round(steuer * 100) / 100;
}

export function berechneKfzSteuer({ antrieb, hubraum, co2 }) {
  if (antrieb === 'elektro') return { steuerJahr: 0, steuerMonat: 0, hinweis: 'Steuerfrei bis 2030' };

  const satz = SATZ[antrieb] ?? SATZ.benzin;
  const hubraumSteuer = Math.ceil(hubraum / 100) * satz;
  const co2Anteil = antrieb !== 'elektro' ? co2Steuer(co2) : 0;
  const steuerJahr = Math.round((hubraumSteuer + co2Anteil) * 100) / 100;

  return { steuerJahr, steuerMonat: Math.round(steuerJahr / 12 * 100) / 100, hinweis: '' };
}
```

- [ ] **Schritt 4: Tests ausführen (PASS)**

```bash
npm test -- tests/scripts/kfz-steuer.test.js
```

- [ ] **Schritt 5: `src/pages/auto/kfz-steuer-rechner.astro` erstellen**

```astro
---
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';
const calc = CALCULATORS.find(c => c.slug === 'kfz-steuer-rechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`Kfz-Steuer-Rechner ${year}`}
  description="Kfz-Steuer für Benziner, Diesel und Elektrofahrzeuge kostenlos berechnen. Jahres- und Monatssteuer nach KraftStG."
  canonicalPath="/auto/kfz-steuer-rechner/"
>
  <a href={`${import.meta.env.BASE_URL}auto/`}>← Auto & Mobilität</a>
  <h1>Kfz-Steuer-Rechner {year} – kostenlos berechnen</h1>
  <CalculatorShell
    calculator={calc}
    intro="Berechnen Sie Ihre jährliche Kfz-Steuer kostenlos nach aktuellem KraftStG. Wählen Sie die Antriebsart, geben Sie Hubraum und CO2-Ausstoß ein – das Ergebnis erscheint sofort. Elektrofahrzeuge sind bis 2030 von der Kfz-Steuer befreit."
    sourceNote="Berechnung nach KraftStG: 2,00 €/100 ccm (Benzin), 9,50 €/100 ccm (Diesel) + CO2-Staffel ab 96 g/km. Stand 2025."
  >
    <div class="calc-form">
      <div class="calc-grid">
        <div class="calc-group">
          <label for="antrieb">Antriebsart</label>
          <select id="antrieb">
            <option value="benzin">Benzin</option>
            <option value="diesel">Diesel</option>
            <option value="elektro">Elektro</option>
          </select>
        </div>
        <div class="calc-group" id="hubraum-group">
          <label for="hubraum">Hubraum (ccm)</label>
          <input type="number" id="hubraum" min="0" max="10000" value="1400" step="50" />
        </div>
        <div class="calc-group" id="co2-group">
          <label for="co2">CO2-Ausstoß (g/km)</label>
          <input type="number" id="co2" min="0" max="500" value="120" />
        </div>
      </div>
      <div class="calc-result">
        <div class="label">Kfz-Steuer pro Jahr</div>
        <div id="steuer-jahr">— €</div>
      </div>
      <p id="steuer-monat" style="margin-top:0.5rem;font-size:0.85rem;color:#666;"></p>
    </div>
  </CalculatorShell>
</Layout>

<script type="module">
const { berechneKfzSteuer } = await import(import.meta.env.BASE_URL + 'scripts/kfz-steuer.js');
function fmt(n) { return n.toLocaleString('de-DE', {minimumFractionDigits:2}) + ' €'; }
function berechne() {
  const antrieb = document.getElementById('antrieb').value;
  const hubraum = parseInt(document.getElementById('hubraum').value)||0;
  const co2 = parseInt(document.getElementById('co2').value)||0;
  document.getElementById('hubraum-group').style.display = antrieb==='elektro' ? 'none' : '';
  document.getElementById('co2-group').style.display = antrieb==='elektro' ? 'none' : '';
  const r = berechneKfzSteuer({ antrieb, hubraum, co2 });
  document.getElementById('steuer-jahr').textContent = r.hinweis || fmt(r.steuerJahr);
  document.getElementById('steuer-monat').textContent = r.hinweis ? '' : 'Pro Monat: ' + fmt(r.steuerMonat);
}
['antrieb','hubraum','co2'].forEach(id => document.getElementById(id).addEventListener('input', berechne));
berechne();
</script>
```

- [ ] **Schritt 6: Alle Tests + Build + Commit**

```bash
npm test && npm run build
git add public/scripts/kfz-steuer.js src/pages/auto/kfz-steuer-rechner.astro tests/scripts/kfz-steuer.test.js
git commit -m "feat: add Kfz-Steuer-Rechner with tests"
git push
```

---

## Task 12: Grunderwerbsteuer-Rechner

**Files:**
- Create: `public/scripts/grunderwerbsteuer.js`
- Create: `tests/scripts/grunderwerbsteuer.test.js`
- Create: `src/pages/wohnen/grunderwerbsteuer-rechner.astro`

- [ ] **Schritt 1: Test schreiben**

```js
// tests/scripts/grunderwerbsteuer.test.js
import { describe, it, expect } from 'vitest';
import { berechneGrunderwerbsteuer, STEUERSAETZE } from '../../public/scripts/grunderwerbsteuer.js';

describe('berechneGrunderwerbsteuer', () => {
  it('Bayern: 3,5% auf 300.000 € = 10.500 €', () => {
    const r = berechneGrunderwerbsteuer({ kaufpreis: 300000, bundesland: 'by' });
    expect(r.steuer).toBe(10500);
    expect(r.satz).toBe(3.5);
  });
  it('NRW: 6,5% auf 400.000 € = 26.000 €', () => {
    const r = berechneGrunderwerbsteuer({ kaufpreis: 400000, bundesland: 'nw' });
    expect(r.steuer).toBe(26000);
  });
  it('STEUERSAETZE enthält alle 16 Bundesländer', () => {
    expect(Object.keys(STEUERSAETZE).length).toBe(16);
  });
});
```

- [ ] **Schritt 2: Test ausführen (FAIL)**

```bash
npm test -- tests/scripts/grunderwerbsteuer.test.js
```

- [ ] **Schritt 3: Implementieren**

```js
// public/scripts/grunderwerbsteuer.js
// Stand 2025 – länderspezifische Grunderwerbsteuersätze

export const STEUERSAETZE = {
  bw: 5.0, by: 3.5, be: 6.0, bb: 6.5, hb: 5.0, hh: 5.5,
  he: 6.0, mv: 6.0, ni: 5.0, nw: 6.5, rp: 5.0, sl: 6.5,
  sn: 5.5, st: 5.0, sh: 6.5, th: 6.5,
};

export function berechneGrunderwerbsteuer({ kaufpreis, bundesland }) {
  const satz = STEUERSAETZE[bundesland] ?? 5.0;
  const steuer = Math.round(kaufpreis * satz / 100);
  return { steuer, satz };
}
```

- [ ] **Schritt 4: Tests ausführen (PASS)**

```bash
npm test -- tests/scripts/grunderwerbsteuer.test.js
```

- [ ] **Schritt 5: `src/pages/wohnen/grunderwerbsteuer-rechner.astro` erstellen**

```astro
---
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';
const calc = CALCULATORS.find(c => c.slug === 'grunderwerbsteuer-rechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`Grunderwerbsteuer-Rechner ${year}`}
  description="Grunderwerbsteuer nach Bundesland kostenlos berechnen. Alle 16 Bundesländer, aktuelle Steuersätze 3,5–6,5 %."
  canonicalPath="/wohnen/grunderwerbsteuer-rechner/"
>
  <a href={`${import.meta.env.BASE_URL}wohnen/`}>← Wohnen & Immobilien</a>
  <h1>Grunderwerbsteuer-Rechner {year} – nach Bundesland</h1>
  <CalculatorShell
    calculator={calc}
    intro="Berechnen Sie die Grunderwerbsteuer beim Immobilienkauf kostenlos nach Bundesland. Die Steuersätze variieren zwischen 3,5 % (Bayern) und 6,5 % (NRW, Schleswig-Holstein u.a.). Geben Sie Kaufpreis und Bundesland ein – das Ergebnis erscheint sofort."
    sourceNote="Steuersätze nach aktuellen Landesgesetzen (Stand 2025). Bayern und Sachsen 3,5 %, alle anderen 5,0–6,5 %."
  >
    <div class="calc-form">
      <div class="calc-grid">
        <div class="calc-group">
          <label for="kaufpreis">Kaufpreis (€)</label>
          <input type="number" id="kaufpreis" min="0" max="100000000" value="350000" step="5000" />
        </div>
        <div class="calc-group">
          <label for="bundesland">Bundesland</label>
          <select id="bundesland">
            <option value="bw">Baden-Württemberg (5,0 %)</option>
            <option value="by">Bayern (3,5 %)</option>
            <option value="be">Berlin (6,0 %)</option>
            <option value="bb">Brandenburg (6,5 %)</option>
            <option value="hb">Bremen (5,0 %)</option>
            <option value="hh">Hamburg (5,5 %)</option>
            <option value="he">Hessen (6,0 %)</option>
            <option value="mv">Mecklenburg-Vorpommern (6,0 %)</option>
            <option value="ni">Niedersachsen (5,0 %)</option>
            <option value="nw" selected>Nordrhein-Westfalen (6,5 %)</option>
            <option value="rp">Rheinland-Pfalz (5,0 %)</option>
            <option value="sl">Saarland (6,5 %)</option>
            <option value="sn">Sachsen (5,5 %)</option>
            <option value="st">Sachsen-Anhalt (5,0 %)</option>
            <option value="sh">Schleswig-Holstein (6,5 %)</option>
            <option value="th">Thüringen (6,5 %)</option>
          </select>
        </div>
      </div>
      <div class="calc-result">
        <div class="label">Grunderwerbsteuer</div>
        <div id="steuer">— €</div>
      </div>
      <p id="info" style="margin-top:0.5rem;font-size:0.85rem;color:#666;"></p>
    </div>
  </CalculatorShell>
</Layout>

<script type="module">
const { berechneGrunderwerbsteuer } = await import(import.meta.env.BASE_URL + 'scripts/grunderwerbsteuer.js');
function fmt(n) { return n.toLocaleString('de-DE', {minimumFractionDigits:2}) + ' €'; }
function berechne() {
  const kp = parseFloat(document.getElementById('kaufpreis').value)||0;
  const bl = document.getElementById('bundesland').value;
  const r = berechneGrunderwerbsteuer({ kaufpreis: kp, bundesland: bl });
  document.getElementById('steuer').textContent = fmt(r.steuer);
  document.getElementById('info').textContent = `Steuersatz: ${r.satz} % · Kaufpreis: ${fmt(kp)}`;
}
['kaufpreis','bundesland'].forEach(id => document.getElementById(id).addEventListener('input', berechne));
berechne();
</script>
```

- [ ] **Schritt 6: Alle Tests + Build + Commit**

```bash
npm test && npm run build
git add public/scripts/grunderwerbsteuer.js src/pages/wohnen/grunderwerbsteuer-rechner.astro tests/scripts/grunderwerbsteuer.test.js
git commit -m "feat: add Grunderwerbsteuer-Rechner with tests"
git push
```

---

## Task 13: BMI-Rechner

**Files:**
- Create: `public/scripts/bmi.js`
- Create: `tests/scripts/bmi.test.js`
- Create: `src/pages/gesundheit/bmi-rechner.astro`

- [ ] **Schritt 1: Test schreiben**

```js
// tests/scripts/bmi.test.js
import { describe, it, expect } from 'vitest';
import { berechneBMI } from '../../public/scripts/bmi.js';

describe('berechneBMI', () => {
  it('70 kg, 1,75 m → BMI ~22,9 (Normalgewicht)', () => {
    const r = berechneBMI({ gewichtKg: 70, groesseCm: 175 });
    expect(r.bmi).toBeCloseTo(22.86, 1);
    expect(r.kategorie).toBe('Normalgewicht');
  });
  it('Untergewicht bei BMI < 18,5', () => {
    const r = berechneBMI({ gewichtKg: 50, groesseCm: 175 });
    expect(r.kategorie).toBe('Untergewicht');
  });
  it('Adipositas Grad I bei BMI 30–35', () => {
    const r = berechneBMI({ gewichtKg: 95, groesseCm: 175 });
    expect(r.kategorie).toContain('Adipositas');
  });
});
```

- [ ] **Schritt 2: Test ausführen (FAIL)**

```bash
npm test -- tests/scripts/bmi.test.js
```

- [ ] **Schritt 3: Implementieren**

```js
// public/scripts/bmi.js
// WHO-Formel: BMI = Gewicht (kg) / Größe² (m)

const KATEGORIEN = [
  [16,   'Starkes Untergewicht'],
  [17,   'Mäßiges Untergewicht'],
  [18.5, 'Untergewicht'],
  [25,   'Normalgewicht'],
  [30,   'Übergewicht'],
  [35,   'Adipositas Grad I'],
  [40,   'Adipositas Grad II'],
  [Infinity, 'Adipositas Grad III'],
];

export function berechneBMI({ gewichtKg, groesseCm }) {
  const groesseM = groesseCm / 100;
  const bmi = Math.round((gewichtKg / (groesseM * groesseM)) * 100) / 100;
  const kategorie = KATEGORIEN.find(([grenze]) => bmi < grenze)?.[1] ?? 'Adipositas Grad III';
  return { bmi, kategorie };
}
```

- [ ] **Schritt 4: Tests ausführen (PASS)**

```bash
npm test -- tests/scripts/bmi.test.js
```

- [ ] **Schritt 5: `src/pages/gesundheit/bmi-rechner.astro` erstellen**

```astro
---
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';
const calc = CALCULATORS.find(c => c.slug === 'bmi-rechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`BMI-Rechner ${year}`}
  description="Body-Mass-Index nach WHO-Formel kostenlos berechnen. Sofortige Einordnung in Unter-, Normal- oder Übergewicht."
  canonicalPath="/gesundheit/bmi-rechner/"
>
  <a href={`${import.meta.env.BASE_URL}gesundheit/`}>← Gesundheit & Fitness</a>
  <h1>BMI-Rechner {year} – Body-Mass-Index berechnen</h1>
  <CalculatorShell
    calculator={calc}
    intro="Berechnen Sie Ihren Body-Mass-Index (BMI) kostenlos nach der WHO-Formel. Geben Sie Ihr Gewicht und Ihre Körpergröße ein – der BMI und die Einordnung nach WHO-Kategorien erscheint sofort. Der BMI ist ein Richtwert und ersetzt keine ärztliche Beratung."
    sourceNote="Berechnung: BMI = Gewicht (kg) ÷ Körpergröße² (m). Kategorien nach WHO-Standard."
  >
    <div class="calc-form">
      <div class="calc-grid">
        <div class="calc-group">
          <label for="gewicht">Gewicht (kg)</label>
          <input type="number" id="gewicht" min="1" max="500" value="75" step="0.5" />
        </div>
        <div class="calc-group">
          <label for="groesse">Körpergröße (cm)</label>
          <input type="number" id="groesse" min="50" max="250" value="175" />
        </div>
      </div>
      <div class="calc-result">
        <div class="label">BMI</div>
        <div id="bmi-wert">—</div>
      </div>
      <p id="kategorie" style="margin-top:0.75rem;font-size:1rem;font-weight:600;"></p>
    </div>
  </CalculatorShell>
</Layout>

<script type="module">
const { berechneBMI } = await import(import.meta.env.BASE_URL + 'scripts/bmi.js');
function berechne() {
  const g = parseFloat(document.getElementById('gewicht').value)||0;
  const gr = parseFloat(document.getElementById('groesse').value)||1;
  const r = berechneBMI({ gewichtKg: g, groesseCm: gr });
  document.getElementById('bmi-wert').textContent = r.bmi.toLocaleString('de-DE', {minimumFractionDigits:1, maximumFractionDigits:1});
  document.getElementById('kategorie').textContent = r.kategorie;
}
['gewicht','groesse'].forEach(id => document.getElementById(id).addEventListener('input', berechne));
berechne();
</script>
```

- [ ] **Schritt 6: Alle Tests + Build + Commit**

```bash
npm test && npm run build
git add public/scripts/bmi.js src/pages/gesundheit/bmi-rechner.astro tests/scripts/bmi.test.js
git commit -m "feat: add BMI-Rechner (WHO-Formel) with tests"
git push
```

---

## Task 14: Kalorien-Rechner

**Files:**
- Create: `public/scripts/kalorien.js`
- Create: `tests/scripts/kalorien.test.js`
- Create: `src/pages/gesundheit/kalorien-rechner.astro`

- [ ] **Schritt 1: Test schreiben**

```js
// tests/scripts/kalorien.test.js
import { describe, it, expect } from 'vitest';
import { berechneKalorienbedarf } from '../../public/scripts/kalorien.js';

describe('berechneKalorienbedarf', () => {
  it('Mann, 30 Jahre, 80 kg, 180 cm, wenig aktiv', () => {
    const r = berechneKalorienbedarf({ geschlecht: 'm', alter: 30, gewicht: 80, groesse: 180, aktivitaet: 1.375 });
    expect(r.tdee).toBeGreaterThan(2000);
    expect(r.tdee).toBeLessThan(3000);
    expect(r.bmr).toBeGreaterThan(1500);
  });
  it('Frau hat niedrigeren BMR als Mann bei gleichen Werten', () => {
    const basis = { alter: 30, gewicht: 70, groesse: 170, aktivitaet: 1.2 };
    const m = berechneKalorienbedarf({ ...basis, geschlecht: 'm' });
    const f = berechneKalorienbedarf({ ...basis, geschlecht: 'f' });
    expect(f.bmr).toBeLessThan(m.bmr);
  });
});
```

- [ ] **Schritt 2: Test ausführen (FAIL)**

```bash
npm test -- tests/scripts/kalorien.test.js
```

- [ ] **Schritt 3: Implementieren**

```js
// public/scripts/kalorien.js
// Mifflin-St-Jeor-Formel (Standard in Deutschland)

export function berechneKalorienbedarf({ geschlecht, alter, gewicht, groesse, aktivitaet }) {
  // BMR = Grundumsatz
  let bmr;
  if (geschlecht === 'm') {
    bmr = 10 * gewicht + 6.25 * groesse - 5 * alter + 5;
  } else {
    bmr = 10 * gewicht + 6.25 * groesse - 5 * alter - 161;
  }
  bmr = Math.round(bmr);
  const tdee = Math.round(bmr * aktivitaet);  // Gesamtumsatz
  return { bmr, tdee };
}
```

- [ ] **Schritt 4: Tests ausführen (PASS)**

```bash
npm test -- tests/scripts/kalorien.test.js
```

- [ ] **Schritt 5: `src/pages/gesundheit/kalorien-rechner.astro` erstellen**

```astro
---
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';
const calc = CALCULATORS.find(c => c.slug === 'kalorien-rechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`Kalorien-Rechner ${year}`}
  description="Täglichen Kalorienbedarf nach Mifflin-St-Jeor berechnen – kostenlos, nach Geschlecht, Alter, Gewicht und Aktivität."
  canonicalPath="/gesundheit/kalorien-rechner/"
>
  <a href={`${import.meta.env.BASE_URL}gesundheit/`}>← Gesundheit & Fitness</a>
  <h1>Kalorien-Rechner {year} – täglichen Bedarf berechnen</h1>
  <CalculatorShell
    calculator={calc}
    intro="Berechnen Sie Ihren täglichen Kalorienbedarf kostenlos nach der Mifflin-St-Jeor-Formel. Geben Sie Geschlecht, Alter, Gewicht, Größe und Aktivitätslevel ein. Das Ergebnis zeigt Grundumsatz (BMR) und Gesamtumsatz (TDEE)."
    sourceNote="Mifflin-St-Jeor-Formel (Goldstandard für Kalorienberechnung). Aktivitätsfaktoren nach PAL-Werten."
  >
    <div class="calc-form">
      <div class="calc-grid">
        <div class="calc-group">
          <label for="geschlecht">Geschlecht</label>
          <select id="geschlecht">
            <option value="m">Männlich</option>
            <option value="f">Weiblich</option>
          </select>
        </div>
        <div class="calc-group">
          <label for="alter">Alter (Jahre)</label>
          <input type="number" id="alter" min="1" max="120" value="30" />
        </div>
        <div class="calc-group">
          <label for="gewicht">Gewicht (kg)</label>
          <input type="number" id="gewicht" min="1" max="500" value="75" step="0.5" />
        </div>
        <div class="calc-group">
          <label for="groesse">Größe (cm)</label>
          <input type="number" id="groesse" min="50" max="250" value="175" />
        </div>
      </div>
      <div class="calc-group">
        <label for="aktivitaet">Aktivitätslevel</label>
        <select id="aktivitaet">
          <option value="1.2">Wenig aktiv (Bürojob, kein Sport)</option>
          <option value="1.375" selected>Leicht aktiv (1–3× Sport/Woche)</option>
          <option value="1.55">Mäßig aktiv (3–5× Sport/Woche)</option>
          <option value="1.725">Sehr aktiv (6–7× Sport/Woche)</option>
          <option value="1.9">Extrem aktiv (körperliche Arbeit + tägl. Sport)</option>
        </select>
      </div>
      <div class="calc-result">
        <div class="label">Täglicher Kalorienbedarf (TDEE)</div>
        <div id="tdee">— kcal</div>
      </div>
      <p id="bmr" style="margin-top:0.5rem;font-size:0.85rem;color:#666;"></p>
    </div>
  </CalculatorShell>
</Layout>

<script type="module">
const { berechneKalorienbedarf } = await import(import.meta.env.BASE_URL + 'scripts/kalorien.js');
function berechne() {
  const g = document.getElementById('geschlecht').value;
  const a = parseInt(document.getElementById('alter').value)||0;
  const w = parseFloat(document.getElementById('gewicht').value)||0;
  const h = parseFloat(document.getElementById('groesse').value)||0;
  const akt = parseFloat(document.getElementById('aktivitaet').value)||1.2;
  const r = berechneKalorienbedarf({ geschlecht: g, alter: a, gewicht: w, groesse: h, aktivitaet: akt });
  document.getElementById('tdee').textContent = r.tdee.toLocaleString('de-DE') + ' kcal';
  document.getElementById('bmr').textContent = 'Grundumsatz (BMR): ' + r.bmr.toLocaleString('de-DE') + ' kcal';
}
['geschlecht','alter','gewicht','groesse','aktivitaet'].forEach(id => document.getElementById(id).addEventListener('input', berechne));
berechne();
</script>
```

- [ ] **Schritt 6: Alle Tests + Build + Commit**

```bash
npm test && npm run build
git add public/scripts/kalorien.js src/pages/gesundheit/kalorien-rechner.astro tests/scripts/kalorien.test.js
git commit -m "feat: add Kalorien-Rechner (Mifflin-St-Jeor) with tests"
git push
```

---

## Task 15: Einheitenrechner

**Files:**
- Create: `src/pages/einheiten/einheitenrechner.astro`

*(Keine externe Logik — einfache Umrechnungstabellen inline)*

- [ ] **Schritt 1: Seite erstellen**

Tabs oder Dropdown für Kategorie (Länge, Gewicht, Temperatur, Volumen). Jede Kategorie hat Eingabe + Einheit-Dropdown, Ausgabe zeigt alle gängigen Einheiten.

```astro
---
// src/pages/einheiten/einheitenrechner.astro
import Layout from '../../layouts/Layout.astro';
import CalculatorShell from '../../components/CalculatorShell.astro';
import { CALCULATORS } from '../../data/calculators';
const calc = CALCULATORS.find(c => c.slug === 'einheitenrechner')!;
const year = new Date().getFullYear();
---
<Layout
  title={`Einheitenrechner ${year}`}
  description="Länge, Gewicht, Temperatur und Volumen kostenlos umrechnen. Meter, Kilometer, Zoll, Pfund, Celsius, Fahrenheit und viele mehr."
  canonicalPath="/einheiten/einheitenrechner/"
>
  <a href={`${import.meta.env.BASE_URL}einheiten/`}>← Einheiten & Mathe</a>
  <h1>Einheitenrechner {year} – alle Einheiten umrechnen</h1>

  <CalculatorShell
    calculator={calc}
    intro="Rechnen Sie kostenlos zwischen allen gängigen Maßeinheiten um: Länge (Meter, Kilometer, Meilen, Zoll), Gewicht (Kilogramm, Pfund, Gramm, Tonnen), Temperatur (Celsius, Fahrenheit, Kelvin) und Volumen (Liter, Milliliter, Gallonen). Kein Login, sofortiges Ergebnis."
    sourceNote="Umrechnungsfaktoren nach SI-Standard."
  >
    <div class="calc-form">
      <div class="calc-group">
        <label for="kategorie">Kategorie</label>
        <select id="kategorie">
          <option value="laenge">Länge</option>
          <option value="gewicht">Gewicht</option>
          <option value="temperatur">Temperatur</option>
          <option value="volumen">Volumen</option>
        </select>
      </div>
      <div class="calc-grid">
        <div class="calc-group">
          <label for="wert">Wert</label>
          <input type="number" id="wert" value="1" step="any" />
        </div>
        <div class="calc-group">
          <label for="von">Von</label>
          <select id="von"></select>
        </div>
      </div>
      <div id="ergebnis-liste" class="ergebnis-liste"></div>
    </div>
  </CalculatorShell>
</Layout>

<script>
const EINHEITEN = {
  laenge: {
    label: 'Länge',
    basis: 'm',
    einheiten: { m:1, km:1000, cm:0.01, mm:0.001, mi:1609.344, yd:0.9144, ft:0.3048, in:0.0254 },
    labels: { m:'Meter', km:'Kilometer', cm:'Zentimeter', mm:'Millimeter', mi:'Meilen', yd:'Yards', ft:'Fuß', in:'Zoll' },
  },
  gewicht: {
    label: 'Gewicht',
    basis: 'kg',
    einheiten: { kg:1, g:0.001, mg:0.000001, t:1000, lb:0.453592, oz:0.0283495 },
    labels: { kg:'Kilogramm', g:'Gramm', mg:'Milligramm', t:'Tonnen', lb:'Pfund', oz:'Unzen' },
  },
  temperatur: { label:'Temperatur', spezial: true },
  volumen: {
    label: 'Volumen',
    basis: 'l',
    einheiten: { l:1, ml:0.001, m3:1000, cl:0.01, gal:3.78541, fl_oz:0.0295735 },
    labels: { l:'Liter', ml:'Milliliter', m3:'Kubikmeter', cl:'Centiliter', gal:'Gallone (US)', fl_oz:'Fluid Ounce' },
  },
};

function toC(wert, von) {
  if (von==='c') return wert;
  if (von==='f') return (wert - 32) * 5/9;
  if (von==='k') return wert - 273.15;
}
function fromC(celsius, zu) {
  if (zu==='c') return celsius;
  if (zu==='f') return celsius * 9/5 + 32;
  if (zu==='k') return celsius + 273.15;
}

function updateEinheiten() {
  const kat = document.getElementById('kategorie').value;
  const vonSelect = document.getElementById('von');
  vonSelect.innerHTML = '';
  if (kat === 'temperatur') {
    [['c','Celsius'],['f','Fahrenheit'],['k','Kelvin']].forEach(([v,l]) => {
      const o = document.createElement('option'); o.value=v; o.textContent=l; vonSelect.appendChild(o);
    });
  } else {
    const e = EINHEITEN[kat];
    Object.keys(e.einheiten).forEach(k => {
      const o = document.createElement('option'); o.value=k; o.textContent=e.labels[k]||k; vonSelect.appendChild(o);
    });
  }
  berechne();
}

function berechne() {
  const kat = document.getElementById('kategorie').value;
  const wert = parseFloat(document.getElementById('wert').value)||0;
  const von  = document.getElementById('von').value;
  const liste = document.getElementById('ergebnis-liste');
  liste.innerHTML = '';

  if (kat === 'temperatur') {
    const celsius = toC(wert, von);
    [['c','Celsius'],['f','Fahrenheit'],['k','Kelvin']].forEach(([k,label]) => {
      if (k===von) return;
      const r = Math.round(fromC(celsius,k)*10000)/10000;
      liste.innerHTML += `<div class="conv-row"><span>${label}</span><strong>${r.toLocaleString('de-DE')}</strong></div>`;
    });
  } else {
    const e = EINHEITEN[kat];
    const inBasis = wert * (e.einheiten[von]||1);
    Object.keys(e.einheiten).forEach(k => {
      if (k===von) return;
      const r = Math.round(inBasis / e.einheiten[k] * 100000) / 100000;
      liste.innerHTML += `<div class="conv-row"><span>${e.labels[k]||k}</span><strong>${r.toLocaleString('de-DE')}</strong></div>`;
    });
  }
}

document.getElementById('kategorie').addEventListener('change', updateEinheiten);
document.getElementById('von').addEventListener('change', berechne);
document.getElementById('wert').addEventListener('input', berechne);
updateEinheiten();
</script>

<style>
.ergebnis-liste { margin-top: 1rem; display: grid; gap: 0.5rem; }
.conv-row { display: flex; justify-content: space-between; padding: 0.5rem 0.75rem; background: white; border-radius: var(--radius); border: 1px solid var(--color-border); }
</style>
```

- [ ] **Schritt 2: Build + Commit**

```bash
npm run build
git add src/pages/einheiten/
git commit -m "feat: add Einheitenrechner (Länge, Gewicht, Temperatur, Volumen)"
git push
```

---

## Task 16: Kategorie-Index-Seiten vervollständigen + Abschluss-Build

**Files:**
- Modify: alle noch fehlenden `[kategorie]/index.astro` Seiten (wohnen, energie, auto, familie, gesundheit, einheiten)

- [ ] **Schritt 1: Fehlende Index-Seiten erstellen**

Für jede der folgenden Kategorien eine `index.astro` nach dem Muster aus Task 5 Schritt 2 erstellen:

| Datei | `category`-Key | `canonicalPath` |
|---|---|---|
| `src/pages/wohnen/index.astro` | `'wohnen'` | `'/wohnen/'` |
| `src/pages/energie/index.astro` | `'energie'` | `'/energie/'` |
| `src/pages/auto/index.astro` | `'auto'` | `'/auto/'` |
| `src/pages/familie/index.astro` | `'familie'` | `'/familie/'` |
| `src/pages/gesundheit/index.astro` | `'gesundheit'` | `'/gesundheit/'` |
| `src/pages/einheiten/index.astro` | `'einheiten'` | `'/einheiten/'` |

Die Seite `src/pages/geld/index.astro` wurde bereits in Task 5 erstellt.

- [ ] **Schritt 2: Familie-Platzhalter-Seite**

Da Familie im MVP keine live Rechner hat, trotzdem Index-Seite erstellen — `CategoryGrid` gibt automatisch "Demnächst verfügbar" aus wenn `live=false`.

- [ ] **Schritt 3: Vollständigen Build ausführen**

```bash
npm test
```

Erwartetes Ergebnis: Alle Tests PASS.

```bash
npm run build
```

Erwartetes Ergebnis: Keine Fehler, `dist/` enthält alle Seiten.

- [ ] **Schritt 4: `[USERNAME]`-Platzhalter ersetzen**

**Hinweis:** Dieser Schritt sollte eigentlich bereits in Task 2 erledigt worden sein. Falls nicht, jetzt nachholen:

- `astro.config.mjs`: `site: 'https://[USERNAME].github.io'` → echter GitHub-Benutzername
- `public/robots.txt`: Sitemap-URL anpassen

```bash
# Aktuellen GitHub-Benutzernamen ermitteln:
gh api user --jq '.login'
```

- [ ] **Schritt 5: Finaler Commit + Push**

```bash
npm test && npm run build
git add .
git commit -m "feat: complete MVP – 10 Rechner, alle Kategorie-Seiten, bereit für Deployment"
git push
```

Erwartetes Ergebnis: GitHub Actions startet, Build läuft durch, Deploy auf GitHub Pages. URL: `https://[USERNAME].github.io/deutschland-rechnet/`

---

## Erfolgskriterien

- [ ] `npm test` läuft durch ohne Fehler (alle Calculator-Scripts getestet)
- [ ] `npm run build` läuft ohne Fehler
- [ ] GitHub Actions deployed erfolgreich
- [ ] Startseite erreichbar unter `https://[USERNAME].github.io/deutschland-rechnet/`
- [ ] Alle 10 MVP-Rechner haben eigene URLs
- [ ] Jede Seite hat einzigartigen Title-Tag und Meta-Description
- [ ] `sitemap.xml` wird unter `/sitemap-index.xml` ausgeliefert
- [ ] `robots.txt` erreichbar
- [ ] Rechner funktionieren auf Mobile (375px Breite)
