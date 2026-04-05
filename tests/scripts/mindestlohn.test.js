import { describe, it, expect } from 'vitest';
import { berechneMindestlohn } from '../../public/scripts/mindestlohn.js';

describe('berechneMindestlohn', () => {
  it('40h/Woche → ca. 2224 €/Monat', () => {
    const r = berechneMindestlohn({ stundenProWoche: 40 });
    // 40 × 52 / 12 = 173.33h × 12.82 = 2221.87
    expect(r.monat).toBeGreaterThan(2200);
    expect(r.monat).toBeLessThan(2300);
  });
  it('mindestlohn ist 12.82', () => {
    const r = berechneMindestlohn({ stundenProWoche: 20 });
    expect(r.mindestlohn).toBe(12.82);
  });
});
