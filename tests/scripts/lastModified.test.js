import { describe, it, expect } from 'vitest';
import {
  toRoutePath,
  artikelImporte,
  vereinigeDaten,
  buildLastModifiedMap,
  lookupLastModified,
} from '../../src/utils/lastModified.mjs';

describe('toRoutePath', () => {
  it('macht aus der Seitendatei den ausgelieferten Pfad', () => {
    expect(toRoutePath('src/pages/auto/km-kostenrechner.astro')).toBe('/auto/km-kostenrechner/');
    expect(toRoutePath('src/pages/auto/index.astro')).toBe('/auto/');
    expect(toRoutePath('src/pages/index.astro')).toBe('/');
  });

  it('ignoriert alles ausserhalb von src/pages', () => {
    expect(toRoutePath('src/components/artikel/bmi.astro')).toBeNull();
    expect(toRoutePath('src/pages/auto/foo.ts')).toBeNull();
  });
});

describe('artikelImporte', () => {
  it('findet die eingebundene Artikeldatei im Quelltext einer Seite', () => {
    const quelle = `---
import Layout from '../../layouts/Layout.astro';
import ArtikelBmi from '../../components/artikel/bmi-punkt-kilogramm.astro';
---`;
    expect(artikelImporte(quelle)).toEqual(['src/components/artikel/bmi-punkt-kilogramm.astro']);
  });

  it('findet mehrere und ignoriert andere Importe', () => {
    const quelle = `
import CalculatorShell from '../../components/CalculatorShell.astro';
import A from '../../components/artikel/eins.astro';
import B from '../../components/artikel/zwei.astro';
`;
    expect(artikelImporte(quelle)).toEqual([
      'src/components/artikel/eins.astro',
      'src/components/artikel/zwei.astro',
    ]);
  });

  it('liefert eine leere Liste, wenn die Seite keinen Artikel einbindet', () => {
    expect(artikelImporte('import Layout from "../../layouts/Layout.astro";')).toEqual([]);
  });
});

describe('vereinigeDaten', () => {
  const abhaengig = new Map([['/gesundheit/bmi-rechner/', ['src/components/artikel/bmi.astro']]]);

  it('nimmt das spaetere der beiden Daten', () => {
    const seiten = new Map([['/gesundheit/bmi-rechner/', '2026-01-01T00:00:00+01:00']]);
    const artikel = new Map([['src/components/artikel/bmi.astro', '2026-06-01T00:00:00+02:00']]);
    expect(vereinigeDaten(seiten, artikel, abhaengig).get('/gesundheit/bmi-rechner/'))
      .toBe('2026-06-01T00:00:00+02:00');
  });

  it('behaelt das Seitendatum, wenn die Seite juenger ist', () => {
    const seiten = new Map([['/gesundheit/bmi-rechner/', '2026-09-01T00:00:00+02:00']]);
    const artikel = new Map([['src/components/artikel/bmi.astro', '2026-06-01T00:00:00+02:00']]);
    expect(vereinigeDaten(seiten, artikel, abhaengig).get('/gesundheit/bmi-rechner/'))
      .toBe('2026-09-01T00:00:00+02:00');
  });

  it('vergleicht ueber Zeitzonen hinweg nach echtem Zeitpunkt, nicht alphabetisch', () => {
    // 2026-06-01T00:30+02:00 ist FRUEHER als 2026-06-01T00:00-05:00.
    const seiten = new Map([['/gesundheit/bmi-rechner/', '2026-06-01T00:30:00+02:00']]);
    const artikel = new Map([['src/components/artikel/bmi.astro', '2026-06-01T00:00:00-05:00']]);
    expect(vereinigeDaten(seiten, artikel, abhaengig).get('/gesundheit/bmi-rechner/'))
      .toBe('2026-06-01T00:00:00-05:00');
  });

  it('laesst Seiten ohne Artikel unberuehrt', () => {
    const seiten = new Map([['/auto/kfz-steuer-rechner/', '2026-03-01T00:00:00+01:00']]);
    expect(vereinigeDaten(seiten, new Map(), new Map()).get('/auto/kfz-steuer-rechner/'))
      .toBe('2026-03-01T00:00:00+01:00');
  });

  it('nimmt das Artikeldatum auch dann, wenn die Seite gar keines hat', () => {
    const artikel = new Map([['src/components/artikel/bmi.astro', '2026-06-01T00:00:00+02:00']]);
    expect(vereinigeDaten(new Map(), artikel, abhaengig).get('/gesundheit/bmi-rechner/'))
      .toBe('2026-06-01T00:00:00+02:00');
  });

  it('nimmt bei mehreren Artikeln den juengsten', () => {
    const mehr = new Map([['/x/', ['src/components/artikel/a.astro', 'src/components/artikel/b.astro']]]);
    const artikel = new Map([
      ['src/components/artikel/a.astro', '2026-02-01T00:00:00+01:00'],
      ['src/components/artikel/b.astro', '2026-08-01T00:00:00+02:00'],
    ]);
    expect(vereinigeDaten(new Map(), artikel, mehr).get('/x/')).toBe('2026-08-01T00:00:00+02:00');
  });
});

describe('buildLastModifiedMap – gegen die echte Historie', () => {
  const map = buildLastModifiedMap();

  it('kennt Routen und liefert gueltige ISO-Zeitstempel', () => {
    expect(map.size).toBeGreaterThan(50);
    for (const [route, datum] of map) {
      expect(route.startsWith('/')).toBe(true);
      expect(route.endsWith('/')).toBe(true);
      expect(Number.isNaN(Date.parse(datum))).toBe(false);
    }
  });

  it('meldet keine Zukunftsdaten', () => {
    const jetzt = Date.now() + 60_000;
    for (const datum of map.values()) expect(Date.parse(datum)).toBeLessThan(jetzt);
  });
});

describe('lookupLastModified', () => {
  it('findet den Eintrag ueber die volle URL', () => {
    const map = new Map([['/auto/km-kostenrechner/', '2026-05-01T00:00:00+02:00']]);
    expect(lookupLastModified(map, 'https://deutschland-rechnet.de/auto/km-kostenrechner/'))
      .toBe('2026-05-01T00:00:00+02:00');
  });

  it('gibt undefined bei unbekannter oder kaputter URL', () => {
    expect(lookupLastModified(new Map(), 'https://deutschland-rechnet.de/gibts-nicht/')).toBeUndefined();
    expect(lookupLastModified(new Map(), 'kein-url')).toBeUndefined();
  });
});
