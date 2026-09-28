import { describe, it, expect } from 'vitest';
import { berechneSpritkosten } from '../../public/scripts/spritkosten.js';

describe('berechneSpritkosten', () => {
  it('berechnet Gesamtkosten korrekt', () => {
    // 100 km, 8 L/100km, 1,80 €/L → 8 L × 1,80 = 14,40 €
    const r = berechneSpritkosten({ streckeKm: 100, verbrauchL100: 8, preisEuroL: 1.80 });
    expect(r.kosten).toBe(14.40);
  });
  it('berechnet Liter korrekt', () => {
    const r = berechneSpritkosten({ streckeKm: 500, verbrauchL100: 7, preisEuroL: 1.75 });
    expect(r.liter).toBe(35);
  });
  it('berechnet Kosten pro 100km korrekt', () => {
    const r = berechneSpritkosten({ streckeKm: 100, verbrauchL100: 6, preisEuroL: 2.00 });
    expect(r.kostenPro100km).toBe(12.00);
  });
});

// Nachtrag 23.09.2026: Der Kilometerpreis wurde auf zwei Nachkommastellen
// gerundet, die Seite zeigt ihn aber mit dreien – die dritte Stelle war
// deshalb immer 0, und die beiden Detailwerte widersprachen sich.
describe('kostenProKm – ungerundet, die Anzeige rundet', () => {
  it('liefert den exakten Wert statt zwei Nachkommastellen', () => {
    const r = berechneSpritkosten({ streckeKm: 500, verbrauchL100: 7.5, preisEuroL: 1.75 });
    expect(r.kostenProKm).toBeCloseTo(0.13125, 10);
  });

  it('passt zum Hundertkilometerpreis', () => {
    const r = berechneSpritkosten({ streckeKm: 500, verbrauchL100: 7.5, preisEuroL: 1.75 });
    // 0,131 × 100 = 13,10 – gegen 13,13 bleibt nur die Rundung der dritten Stelle,
    // vorher klafften 13,00 gegen 13,13.
    expect(Math.abs(r.kostenProKm * 100 - r.kostenPro100km)).toBeLessThan(0.05);
  });

  it('rundet einen glatten Wert nicht kaputt', () => {
    const r = berechneSpritkosten({ streckeKm: 100, verbrauchL100: 5, preisEuroL: 1.75 });
    expect(r.kostenProKm).toBeCloseTo(0.0875, 10);
  });
});
