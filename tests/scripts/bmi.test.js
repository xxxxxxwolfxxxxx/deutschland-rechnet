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
