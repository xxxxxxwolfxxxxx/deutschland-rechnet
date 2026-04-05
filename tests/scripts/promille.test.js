import { describe, it, expect } from 'vitest';
import { berechnePromille } from '../../public/scripts/promille.js';

describe('berechnePromille', () => {
  it('1 Bier (0,5L, 5%) für 80kg Mann, 0h', () => {
    // Alkohol: 500 × 0.05 × 0.8 = 20g; BAK = 20 / (80 × 0.7) = 0.36‰
    const r = berechnePromille({
      getraenke: [{ mengeML: 500, volProzent: 5 }],
      gewichtKg: 80,
      geschlecht: 'm',
      stundenNachBeginn: 0,
    });
    expect(r.bak).toBeCloseTo(0.36, 1);
  });
  it('Abbau nach 2h', () => {
    const r = berechnePromille({
      getraenke: [{ mengeML: 500, volProzent: 5 }],
      gewichtKg: 80,
      geschlecht: 'm',
      stundenNachBeginn: 2,
    });
    // 0.36 - 0.30 = 0.06‰
    expect(r.bak).toBeGreaterThanOrEqual(0);
    expect(r.bak).toBeLessThan(0.36);
  });
  it('BAK ist nie negativ', () => {
    const r = berechnePromille({
      getraenke: [{ mengeML: 100, volProzent: 5 }],
      gewichtKg: 80,
      geschlecht: 'm',
      stundenNachBeginn: 10,
    });
    expect(r.bak).toBe(0);
  });
});
