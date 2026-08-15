import { describe, it, expect } from 'vitest';
import {
  berechnePromille,
  alkoholGramm,
  abbaudauerStunden,
  VERTEILUNGSFAKTOR,
  ABBAU_PRO_STUNDE,
} from '../../public/scripts/promille.js';

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

// Die Kennzahlen sind seit dem Ratgeber-Artikel exportiert, damit Artikel und
// Rechner nicht auseinanderlaufen können.
describe('exportierte Kennzahlen', () => {
  it('Verteilungsfaktoren nach Widmark', () => {
    expect(VERTEILUNGSFAKTOR).toEqual({ m: 0.7, w: 0.6 });
  });

  it('Abbau von 0,15 Promille je Stunde', () => {
    expect(ABBAU_PRO_STUNDE).toBe(0.15);
  });

  it('alkoholGramm rechnet Volumenprozent in Masse um', () => {
    expect(alkoholGramm({ mengeML: 500, volProzent: 5 })).toBeCloseTo(20, 5);
    expect(alkoholGramm({ mengeML: 40, volProzent: 40 })).toBeCloseTo(12.8, 5);
  });

  it('abbaudauerStunden: 1,0 Promille braucht rund 6,7 Stunden bis null', () => {
    expect(abbaudauerStunden(1.0)).toBeCloseTo(6.667, 2);
    expect(abbaudauerStunden(1.0, 0.5)).toBeCloseTo(3.333, 2);
  });

  it('abbaudauerStunden wird nicht negativ', () => {
    expect(abbaudauerStunden(0.3, 0.5)).toBe(0);
  });

  it('deckt sich mit dem Abbau, den berechnePromille abzieht', () => {
    const stunden = 4;
    const r = berechnePromille({
      getraenke: [{ mengeML: 500, volProzent: 5 }],
      gewichtKg: 80,
      geschlecht: 'm',
      stundenNachBeginn: stunden,
    });
    expect(r.abbau).toBeCloseTo(stunden * ABBAU_PRO_STUNDE, 5);
  });
});
