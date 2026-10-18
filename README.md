# Deutschland rechnet

Rechnerportal mit 146 Seiten in 15 Themenbereichen: Geld und Steuern, Auto, Wohnen, Familie, Energie, Gesundheit, Versicherungen u. a.

**Live:** <https://deutschland-rechnet.de>

## Was drin ist

- Rechner als Astro-Seiten unter `src/pages/<Themenbereich>/`, zum Beispiel Brutto-Netto, Einkommensteuer, Elterngeld, Grunderwerbsteuer, Kfz-Steuer, ETF-Sparplan, BMI
- Die Rechenlogik der Rechner wird mit Vitest getestet (rund 90 Testdateien unter `tests/`)
- Ratgeber-Artikel und Kategorien in `src/content/` und `src/data/`
- Sitemap mit dem echten Commit-Datum je Seite als `lastmod`; Seiten mit `noindex` bleiben draußen (`src/data/noindex.mjs`)

## Tech-Stack

Astro 6 (statische Ausgabe) · JavaScript/TypeScript · Vitest · GitHub Actions (Build + Test) · Netlify

## Lokal starten

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Vitest
npm run build      # statischer Build nach dist/
npm run preview
```

Die CI (`.github/workflows/deploy.yml`) führt bei jedem Push auf `main` `npm ci`, `npm test` und `npm run build` mit Node 22 aus.

## Fachdaten und Quellen

Steuer- und Sozialrechner stützen sich auf die jeweiligen Gesetzestexte (zum Beispiel EStG, etwa § 32a). Die Paragrafen stehen bei den einzelnen Rechnern im Code und auf der Seite.
Kostenwerte aus Drittquellen sind mit Quelle und Stand angegeben, etwa die ADAC Autokostenübersicht bei den Autorechnern.

Die Ergebnisse sind Orientierungswerte und keine Steuer-, Rechts- oder Anlageberatung. Zahlen ändern sich mit der Gesetzeslage; maßgeblich sind die Angaben der Behörden.

## Lizenz

Es ist keine Lizenz hinterlegt. Der Quellcode steht zur Ansicht; ohne ausdrückliche Lizenz sind Nutzung und Weitergabe nicht erlaubt.
