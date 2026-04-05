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
