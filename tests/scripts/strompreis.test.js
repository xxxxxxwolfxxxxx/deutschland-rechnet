import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  STROMPREIS_QUELLE,
  STROMPREIS_QUELLE_URL,
  STROMPREIS_DATENSTAND,
  STROMPREIS_ABGERUFEN_AM,
  STROMPREIS_REFERENZVERBRAUCH_KWH,
  STROMPREIS_CENT_PRO_KWH,
  STROMPREIS_EURO_PRO_KWH,
  STROMPREIS_BESTANDTEILE,
  STROMPREIS_UMLAGEN,
  STROMPREIS_AMTLICH,
  stromkostenProJahr,
  WAERMEPUMPENSTROM_CENT_PRO_KWH,
  WAERMEPUMPENSTROM_EURO_PRO_KWH,
  WAERMEPUMPENSTROM_SPANNE,
  WAERMEPUMPENSTROM_NEUKUNDEN,
  WAERMEPUMPENSTROM_QUELLE,
  LADESTROM_HEIM_CENT_PRO_KWH,
  LADESTROM_HEIM_EURO_PRO_KWH,
  LADESTROM_AC_CENT_PRO_KWH,
  LADESTROM_AC_EURO_PRO_KWH,
  LADESTROM_DC_CENT_PRO_KWH,
  LADESTROM_DC_EURO_PRO_KWH,
  LADESTROM_ADHOC_AUTOBAHN_CENT_PRO_KWH,
  LADESTROM_QUELLE,
  LADESTROM_QUELLE_URL,
  LADESTROM_DATENSTAND,
} from '../../public/scripts/strompreis.js';

describe('Durchschnittlicher Haushaltsstrompreis nach BDEW-Strompreisanalyse', () => {
  it('rechnet mit 37,0 ct/kWh', () => {
    expect(STROMPREIS_CENT_PRO_KWH).toBe(37.0);
  });

  it('führt denselben Wert in Euro, ohne zweite Zahl im Quelltext', () => {
    expect(STROMPREIS_EURO_PRO_KWH).toBeCloseTo(0.37, 10);
    expect(STROMPREIS_EURO_PRO_KWH).toBe(STROMPREIS_CENT_PRO_KWH / 100);
  });

  it('gilt für den Musterhaushalt mit 3.500 kWh Jahresverbrauch', () => {
    expect(STROMPREIS_REFERENZVERBRAUCH_KWH).toBe(3500);
  });

  it('benennt Quelle, Datenstand und Abrufdatum', () => {
    expect(STROMPREIS_QUELLE).toMatch(/BDEW/);
    expect(STROMPREIS_QUELLE_URL).toMatch(/^https:\/\/www\.bdew\.de\//);
    expect(STROMPREIS_DATENSTAND).toBe('April 2026');
    expect(STROMPREIS_ABGERUFEN_AM).toBe('2026-08-12');
  });
});

describe('Preisbestandteile', () => {
  it('summiert Beschaffung, Netzentgelt und Abgaben auf den Gesamtpreis', () => {
    const summe =
      STROMPREIS_BESTANDTEILE.beschaffungUndVertrieb +
      STROMPREIS_BESTANDTEILE.netzentgelt +
      STROMPREIS_BESTANDTEILE.steuernAbgabenUmlagen;
    // BDEW weist die Bestandteile mit mehr Stellen aus als den Gesamtpreis und
    // weist selbst auf Rundungsdifferenzen hin.
    expect(Math.round(summe * 10) / 10).toBe(STROMPREIS_CENT_PRO_KWH);
  });

  it('leitet die Steuern, Abgaben und Umlagen aus den Einzelposten ab (12,6 ct/kWh)', () => {
    const summe = Object.values(STROMPREIS_UMLAGEN).reduce((a, b) => a + b, 0);
    expect(STROMPREIS_BESTANDTEILE.steuernAbgabenUmlagen).toBeCloseTo(summe, 10);
    expect(Math.round(summe * 10) / 10).toBe(12.6);
  });

  it('kennt keine EEG-Umlage mehr – sie ist seit 1. Juli 2022 auf null', () => {
    expect(STROMPREIS_UMLAGEN).not.toHaveProperty('eegUmlage');
  });

  it('nennt die Mehrwertsteuer als größten Einzelposten der Abgaben', () => {
    const posten = Object.entries(STROMPREIS_UMLAGEN).sort((a, b) => b[1] - a[1]);
    expect(posten[0][0]).toBe('mehrwertsteuer');
  });
});

describe('Amtlicher Vergleichswert des Statistischen Bundesamts', () => {
  it('führt den Halbjahreswert getrennt vom BDEW-Wert', () => {
    expect(STROMPREIS_AMTLICH.centProKwh).toBe(40.55);
    expect(STROMPREIS_AMTLICH.zeitraum).toBe('2. Halbjahr 2025');
    expect(STROMPREIS_AMTLICH.quelleUrl).toMatch(/^https:\/\/www\.destatis\.de\//);
  });

  it('liegt über dem BDEW-Wert, weil er Bestandsverträge einschließt', () => {
    expect(STROMPREIS_AMTLICH.centProKwh).toBeGreaterThan(STROMPREIS_CENT_PRO_KWH);
  });
});

describe('stromkostenProJahr', () => {
  it('rechnet den Musterhaushalt auf 1.295 Euro im Jahr', () => {
    const r = stromkostenProJahr({ verbrauchKwh: STROMPREIS_REFERENZVERBRAUCH_KWH });
    expect(r.jahr).toBe(1295);
    expect(r.monat).toBeCloseTo(107.92, 2);
  });

  it('nimmt einen abweichenden Preis entgegen', () => {
    expect(stromkostenProJahr({ verbrauchKwh: 1000, centProKwh: 30 }).jahr).toBe(300);
  });

  it('rundet auf Cent', () => {
    expect(stromkostenProJahr({ verbrauchKwh: 1234, centProKwh: 37 }).jahr).toBe(456.58);
  });

  it('behandelt fehlende oder unsinnige Eingaben als null', () => {
    expect(stromkostenProJahr({ verbrauchKwh: undefined }).jahr).toBe(0);
    expect(stromkostenProJahr({ verbrauchKwh: -500 }).jahr).toBe(0);
    expect(stromkostenProJahr({ verbrauchKwh: 3500, centProKwh: NaN }).jahr).toBe(0);
  });
});

describe('Wärmepumpenstrom als eigener Markt', () => {
  it('liegt deutlich unter dem Haushaltsstrompreis', () => {
    expect(WAERMEPUMPENSTROM_CENT_PRO_KWH).toBeLessThan(STROMPREIS_CENT_PRO_KWH);
  });

  it('rechnet mit 26,0 ct/kWh – der Obergrenze der belegten Marktspanne', () => {
    expect(WAERMEPUMPENSTROM_CENT_PRO_KWH).toBe(26.0);
    expect(WAERMEPUMPENSTROM_CENT_PRO_KWH).toBe(WAERMEPUMPENSTROM_SPANNE.max);
  });

  it('führt die Marktspanne spezieller Wärmepumpentarife', () => {
    expect(WAERMEPUMPENSTROM_SPANNE.min).toBe(20);
    expect(WAERMEPUMPENSTROM_SPANNE.max).toBe(26);
    expect(WAERMEPUMPENSTROM_SPANNE.min).toBeLessThan(WAERMEPUMPENSTROM_SPANNE.max);
  });

  it('hält den Neukunden-Bestpreis getrennt vom Rechenwert', () => {
    expect(WAERMEPUMPENSTROM_NEUKUNDEN.centProKwh).toBe(20.66);
    expect(WAERMEPUMPENSTROM_NEUKUNDEN.stichtag).toBe('2026-07-13');
    expect(WAERMEPUMPENSTROM_NEUKUNDEN.referenzverbrauchKwh).toBe(7500);
    // Ein Bestpreis darf den Rechenwert nicht ersetzen: Er würde die
    // Wärmepumpe gegen Marktdurchschnitte anderer Brennstoffe bevorteilen.
    expect(WAERMEPUMPENSTROM_NEUKUNDEN.centProKwh).toBeLessThan(WAERMEPUMPENSTROM_CENT_PRO_KWH);
  });

  it('benennt Quelle und Datenstand', () => {
    expect(WAERMEPUMPENSTROM_QUELLE).toMatch(/Verivox/);
    expect(WAERMEPUMPENSTROM_NEUKUNDEN.quelleUrl).toMatch(/^https:\/\/www\.verivox\.de\//);
  });

  it('liegt im Euro-Wert bei demselben Preis', () => {
    expect(WAERMEPUMPENSTROM_EURO_PRO_KWH).toBe(WAERMEPUMPENSTROM_CENT_PRO_KWH / 100);
  });
});

describe('Ladestrom für Elektroautos als eigener Markt', () => {
  it('lädt zu Hause zum Haushaltsstrompreis', () => {
    expect(LADESTROM_HEIM_CENT_PRO_KWH).toBe(STROMPREIS_CENT_PRO_KWH);
    expect(LADESTROM_HEIM_EURO_PRO_KWH).toBe(STROMPREIS_EURO_PRO_KWH);
  });

  it('rechnet öffentliches AC-Laden mit 52 ct/kWh', () => {
    expect(LADESTROM_AC_CENT_PRO_KWH).toBe(52);
    expect(LADESTROM_AC_EURO_PRO_KWH).toBe(0.52);
  });

  it('rechnet DC-Schnellladen mit 60 ct/kWh', () => {
    expect(LADESTROM_DC_CENT_PRO_KWH).toBe(60);
    expect(LADESTROM_DC_EURO_PRO_KWH).toBe(0.6);
  });

  it('ordnet die drei Ladewege der Höhe nach', () => {
    expect(LADESTROM_HEIM_CENT_PRO_KWH).toBeLessThan(LADESTROM_AC_CENT_PRO_KWH);
    expect(LADESTROM_AC_CENT_PRO_KWH).toBeLessThan(LADESTROM_DC_CENT_PRO_KWH);
    expect(LADESTROM_DC_CENT_PRO_KWH).toBeLessThan(LADESTROM_ADHOC_AUTOBAHN_CENT_PRO_KWH);
  });

  it('führt den Ad-hoc-Preis an der Autobahn als belegten Extremwert', () => {
    expect(LADESTROM_ADHOC_AUTOBAHN_CENT_PRO_KWH).toBe(84);
  });

  it('benennt Quelle und Datenstand der Ladepreise', () => {
    expect(LADESTROM_QUELLE).toMatch(/Ladesäulencheck/);
    expect(LADESTROM_QUELLE_URL).toMatch(/^https:\/\/www\.lichtblick\.de\//);
    expect(LADESTROM_DATENSTAND).toBe('Juni 2025');
  });
});

// Der Anlass für dieses Modul: Eingabefeld, Fließtext, FAQ und Tabelle standen
// auf drei verschiedenen Strompreisen. Diese Prüfung hält die Seiten am Modul.
describe('Seiten mit Strompreis-Annahme', () => {
  const SEITEN = [
    'src/pages/energie/stromkosten-rechner.astro',
    'src/pages/energie/photovoltaik-rechner.astro',
    'src/pages/energie/waermepumpe-rechner.astro',
    'src/pages/energie/stromspeicher-rechner.astro',
    'src/pages/energie/solarspeicher-dimensionierung.astro',
    'src/pages/energie/jahresenergieverbrauch.astro',
  ];

  it.each(SEITEN)('%s bezieht den Strompreis aus dem gemeinsamen Modul', (pfad) => {
    const quelltext = readFileSync(new URL(`../../${pfad}`, import.meta.url), 'utf8');
    expect(quelltext).toContain('public/scripts/strompreis.js');
    expect(quelltext).toContain('STROMPREIS_CENT_PRO_KWH');
  });

  it.each(SEITEN)('%s enthält keinen fest verdrahteten Strompreis mehr', (pfad) => {
    const quelltext = readFileSync(new URL(`../../${pfad}`, import.meta.url), 'utf8');
    expect(quelltext).not.toMatch(/36-40 ct/);
    expect(quelltext).not.toMatch(/value="31"/);
    expect(quelltext).not.toMatch(/value="0\.31"/);
    expect(quelltext).not.toMatch(/31 ct\/kWh/);
    // Die Werte, die vor der Vereinheitlichung auf diesen Seiten standen.
    // Der Blick zurück muss an einer Dezimalstelle enden, sonst schlägt die
    // Prüfung auf Einspeisesätze wie "7,35 ct/kWh" an.
    expect(quelltext).not.toMatch(/(?<![,.\d])3[0-9] ?ct\/kWh/);
    expect(quelltext).not.toMatch(/value="35"/);
  });
});

describe('Auto-Seiten mit Ladestrom-Annahme', () => {
  const SEITEN = [
    'src/pages/auto/elektroauto-tco-rechner.astro',
    'src/pages/auto/e-auto-leasing-kostenrechner.astro',
    'src/pages/auto/km-kostenrechner.astro',
    'src/pages/auto/spritkosten-vergleich.astro',
  ];

  it.each(SEITEN)('%s bezieht den Ladestrom aus dem gemeinsamen Modul', (pfad) => {
    const quelltext = readFileSync(new URL(`../../${pfad}`, import.meta.url), 'utf8');
    expect(quelltext).toContain('public/scripts/strompreis.js');
    expect(quelltext).toMatch(/LADESTROM_/);
  });

  it.each(SEITEN)('%s trägt keinen frei gewählten Ladepreis mehr', (pfad) => {
    const quelltext = readFileSync(new URL(`../../${pfad}`, import.meta.url), 'utf8');
    expect(quelltext).not.toMatch(/value="0\.3[0-9]"/);
    expect(quelltext).not.toMatch(/\|\| ?0\.3[0-9]/);
    expect(quelltext).not.toMatch(/0,30-0,35 Euro/);
  });
});

// Nicht jede Energie-Seite braucht den Haushaltsstrompreis. Die
// Sanierungsseite rechnet eingesparte HEIZenergie: Gedämmt wird gegen Gas und
// Öl, nicht gegen Haushaltsstrom. Ein Default von 37 ct wäre dort so falsch
// wie die 25 ct, die vorher ohne Herkunft im Feld standen.
describe('co2-einsparung-renovierung rechnet mit Heizenergie, nicht mit Haushaltsstrom', () => {
  const quelltext = () =>
    readFileSync(
      new URL('../../src/pages/energie/co2-einsparung-renovierung.astro', import.meta.url),
      'utf8',
    );

  it('bezieht den Energiepreis aus dem Heizkosten-Modul', () => {
    expect(quelltext()).toContain('public/scripts/heizkosten.js');
    expect(quelltext()).toContain('BRENNSTOFFE');
  });

  it('trägt keinen Haushaltsstrompreis und keinen frei gewählten Wert mehr', () => {
    expect(quelltext()).not.toContain('STROMPREIS_CENT_PRO_KWH');
    expect(quelltext()).not.toMatch(/value="25"/);
    expect(quelltext()).not.toMatch(/\|\| ?25/);
  });
});

describe('heizkosten.js führt keinen eigenen Strompreis mehr', () => {
  it('bezieht den Wärmepumpen-Arbeitspreis aus dem Strompreis-Modul', () => {
    const quelltext = readFileSync(new URL('../../public/scripts/heizkosten.js', import.meta.url), 'utf8');
    expect(quelltext).toContain('strompreis.js');
    expect(quelltext).toContain('WAERMEPUMPENSTROM_CENT_PRO_KWH');
    expect(quelltext).not.toMatch(/arbeitspreisCent: 26\.0/);
  });
});
