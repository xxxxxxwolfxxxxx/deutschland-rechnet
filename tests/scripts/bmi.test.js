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

describe('berechneBMI an den Klassengrenzen', () => {
  it('ordnet den auf zwei Stellen gerundeten Wert ein', () => {
    // 76,5 kg bei 1,75 m = 24,9796 → 24,98, also noch Normalgewicht
    expect(berechneBMI({ gewichtKg: 76.5, groesseCm: 175 })).toEqual({ bmi: 24.98, kategorie: 'Normalgewicht' });
  });
  it('genau 25 zählt als Übergewicht', () => {
    expect(berechneBMI({ gewichtKg: 25 * 1.6 * 1.6, groesseCm: 160 }).kategorie).toBe('Übergewicht');
  });
  it('genau 18,5 zählt als Normalgewicht', () => {
    expect(berechneBMI({ gewichtKg: 18.5 * 2 * 2, groesseCm: 200 }).kategorie).toBe('Normalgewicht');
  });
});
