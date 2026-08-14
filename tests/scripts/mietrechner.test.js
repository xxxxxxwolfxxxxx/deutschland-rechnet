import { describe, it, expect } from 'vitest';
import { berechneMietrechner } from '../../public/scripts/mietrechner.js';

// Schätzmodell für die Warmmiete. Heiz- und Betriebskosten sind
// Erfahrungswerte je Quadratmeter und Jahr, gestaffelt nach Baujahr und
// Heizart; sie werden auf den Monat umgelegt. Es sind keine Rechtswerte,
// sondern Anhaltspunkte in der Größenordnung des Betriebskostenspiegels.

describe('berechneMietrechner – Zusammensetzung', () => {
  it('addiert Heiz-, Betriebs- und Warmwasserkosten zur Kaltmiete', () => {
    // Neubau, Gas: 9 €/m²/Jahr Heizung, 2,50 €/m²/Jahr Betriebskosten
    // Heizung: 80 × 9 / 12 = 60,00
    // Betrieb: 80 × 2,50 / 12 = 16,67
    // Warmwasser: 2 × 15 = 30,00
    const r = berechneMietrechner({
      kaltmiete: 800,
      flaeche: 80,
      personen: 2,
      baujahr: 'post2002',
      heizung: 'gas',
      warmwasser: 'ja',
    });

    expect(r.heizkosten).toBe(60);
    expect(r.betriebskosten).toBe(16.67);
    expect(r.warmwasserKosten).toBe(30);
    expect(r.nebenkosten).toBe(106.67);
    expect(r.warmmiete).toBe(906.67);
  });

  it('lässt die Warmwasserkosten weg, wenn sie in der Heizung enthalten sind', () => {
    const r = berechneMietrechner({
      kaltmiete: 800,
      flaeche: 80,
      personen: 2,
      baujahr: 'post2002',
      heizung: 'gas',
      warmwasser: 'nein',
    });

    expect(r.warmwasserKosten).toBe(0);
    expect(r.nebenkosten).toBe(76.67);
  });
});

describe('berechneMietrechner – Baujahr und Heizart', () => {
  it('Altbau vor 1978 kostet mehr Heizenergie als ein Neubau', () => {
    const basis = { kaltmiete: 700, flaeche: 70, personen: 1, heizung: 'gas', warmwasser: 'nein' };
    const altbau = berechneMietrechner({ ...basis, baujahr: 'pre1978' });
    const neubau = berechneMietrechner({ ...basis, baujahr: 'post2002' });

    expect(altbau.heizkosten).toBeGreaterThan(neubau.heizkosten);
    expect(altbau.betriebskosten).toBeGreaterThan(neubau.betriebskosten);
  });

  it('die Wärmepumpe ist in jeder Baualtersklasse die günstigste Heizart', () => {
    for (const baujahr of ['pre1978', '1978_2002', 'post2002']) {
      const basis = { kaltmiete: 700, flaeche: 70, personen: 1, baujahr, warmwasser: 'nein' };
      const waermepumpe = berechneMietrechner({ ...basis, heizung: 'heatpump' });

      for (const heizung of ['gas', 'oil', 'district', 'other']) {
        expect(waermepumpe.heizkosten).toBeLessThanOrEqual(
          berechneMietrechner({ ...basis, heizung }).heizkosten,
        );
      }
    }
  });

  it('Öl ist teurer als Gas', () => {
    const basis = { kaltmiete: 700, flaeche: 70, personen: 1, baujahr: 'pre1978', warmwasser: 'nein' };

    expect(berechneMietrechner({ ...basis, heizung: 'oil' }).heizkosten).toBeGreaterThan(
      berechneMietrechner({ ...basis, heizung: 'gas' }).heizkosten,
    );
  });
});

describe('berechneMietrechner – Rückfallwerte', () => {
  it('unbekanntes Baujahr rechnet mit 12 €/m² Heizung und 3 €/m² Betriebskosten', () => {
    const r = berechneMietrechner({
      kaltmiete: 600,
      flaeche: 60,
      personen: 1,
      baujahr: 'unbekannt',
      heizung: 'gas',
      warmwasser: 'nein',
    });

    expect(r.heizkosten).toBe(60);
    expect(r.betriebskosten).toBe(15);
  });

  it('unbekannte Heizart rechnet mit 12 €/m²', () => {
    const r = berechneMietrechner({
      kaltmiete: 600,
      flaeche: 60,
      personen: 1,
      baujahr: 'post2002',
      heizung: 'pellets',
      warmwasser: 'nein',
    });

    expect(r.heizkosten).toBe(60);
  });
});

describe('berechneMietrechner – Skalierung', () => {
  it('doppelte Fläche verdoppelt Heiz- und Betriebskosten', () => {
    const basis = { kaltmiete: 500, personen: 1, baujahr: 'post2002', heizung: 'gas', warmwasser: 'nein' };
    const klein = berechneMietrechner({ ...basis, flaeche: 50 });
    const gross = berechneMietrechner({ ...basis, flaeche: 100 });

    // Toleranz von einem Cent, weil beide Beträge einzeln gerundet werden.
    expect(gross.heizkosten).toBeCloseTo(klein.heizkosten * 2, 1);
    expect(gross.betriebskosten).toBeCloseTo(klein.betriebskosten * 2, 1);
  });

  it('jede weitere Person kostet 15 € Warmwasser im Monat', () => {
    const basis = {
      kaltmiete: 500,
      flaeche: 60,
      baujahr: 'post2002',
      heizung: 'gas',
      warmwasser: 'ja',
    };

    expect(berechneMietrechner({ ...basis, personen: 4 }).warmwasserKosten).toBe(60);
    expect(berechneMietrechner({ ...basis, personen: 1 }).warmwasserKosten).toBe(15);
  });
});
