import { describe, it, expect } from 'vitest';
import { berechneInflation } from '../../public/scripts/inflation.js';

describe('berechneInflation', () => {
  it('0% Inflation → kein Verlust', () => {
    const r = berechneInflation({ betrag: 1000, inflationsrateProzent: 0, jahre: 10 });
    expect(r.verlust).toBe(0);
    expect(r.kaufkraftHeute).toBe(1000);
  });
  it('100% Inflation über 1 Jahr → Hälfte der Kaufkraft', () => {
    const r = berechneInflation({ betrag: 1000, inflationsrateProzent: 100, jahre: 1 });
    expect(r.kaufkraftHeute).toBe(500);
  });
  it('verlustProzent ist positiv bei positiver Inflation', () => {
    const r = berechneInflation({ betrag: 1000, inflationsrateProzent: 5, jahre: 10 });
    expect(r.verlustProzent).toBeGreaterThan(0);
  });
});
