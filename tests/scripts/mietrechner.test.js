import { describe, it, expect } from 'vitest';
import { berechneMietrechner } from '../../public/scripts/mietrechner.js';
import { berechneNebenkosten } from '../../public/scripts/nebenkosten.js';

const basis = { kaltmiete: 800, flaeche: 70, betriebskosten: 150, heizkosten: 90 };

describe('berechneMietrechner – Warmmiete aus dem Vertrag', () => {
  it('addiert Kaltmiete und beide Vorauszahlungen', () => {
    const r = berechneMietrechner(basis);
    expect(r.warmmiete).toBe(1040);
    expect(r.vorauszahlung).toBe(240);
    expect(r.gesamt).toBe(1040);
    expect(r.jahr).toBe(12480);
  });

  it('rechnet Sonstiges nur in die Gesamtbelastung, nicht in die Warmmiete', () => {
    const r = berechneMietrechner({ ...basis, sonstiges: 60 });
    expect(r.warmmiete).toBe(1040);
    expect(r.gesamt).toBe(1100);
  });

  it('weist die Quadratmeterwerte aus', () => {
    const r = berechneMietrechner(basis);
    expect(r.kaltProQm).toBe(11.43);
    expect(r.warmProQm).toBe(14.86);
    expect(r.vorauszahlungProQm).toBe(3.43);
  });

  it('schätzt nichts mehr aus Baujahr, Heizart oder Personenzahl', () => {
    const a = berechneMietrechner({ ...basis, baujahr: 'pre1978', heizung: 'oil', personen: 5 });
    expect(a.warmmiete).toBe(berechneMietrechner(basis).warmmiete);
  });
});

describe('berechneMietrechner – Einordnung gegen den Betriebskostenspiegel', () => {
  it('ordnet die Vorauszahlung gegen den Spiegelwert derselben Ausstattung ein', () => {
    // 240 € auf 70 m² liegen deutlich über dem Wert ohne Ausstattung ...
    expect(berechneMietrechner(basis).einordnung.stufe).toBe('hoch');
    // ... aber im Bereich des Werts mit Aufzug, Garten und Hauswart.
    const voll = berechneMietrechner({ ...basis, aufzug: true, garten: true, hauswart: true });
    expect(voll.einordnung.stufe).toBe('passend');
  });

  it('widerspricht der Nachzahlungszeile nicht', () => {
    // Früher: „über dem Durchschnitt“ und zugleich 294 € Nachzahlung im Jahr.
    const r = berechneMietrechner({ ...basis, betriebskosten: 210, heizkosten: 0, aufzug: true, garten: true, hauswart: true });
    expect(r.spiegel.differenzMonat).toBeGreaterThan(0);
    expect(r.einordnung.stufe).not.toBe('hoch');
  });

  it('meldet eine deutlich zu niedrige Vorauszahlung', () => {
    const r = berechneMietrechner({ ...basis, betriebskosten: 80, heizkosten: 50 });
    expect(r.einordnung.stufe).toBe('niedrig');
  });

  it('vergleicht mit dem Spiegelwert für dieselbe Ausstattung', () => {
    const r = berechneMietrechner({ ...basis, aufzug: true });
    const erwartet = berechneNebenkosten({ flaeche: 70, aufzug: true }).gesamtMonat;
    expect(r.spiegel.erwartetMonat).toBe(erwartet);
    expect(r.spiegel.differenzMonat).toBeCloseTo(erwartet - 240, 2);
  });

  it('lässt die Einordnung ohne Wohnfläche weg', () => {
    const r = berechneMietrechner({ ...basis, flaeche: '' });
    expect(r.warmmiete).toBe(1040);
    expect(r.einordnung).toBeNull();
    expect(r.spiegel).toBeNull();
    expect(r.warmProQm).toBe(0);
  });
});
