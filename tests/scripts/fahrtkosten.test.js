import { describe, it, expect } from 'vitest';
import { berechnefahrtkosten } from '../../public/scripts/fahrtkosten.js';

describe('berechnefahrtkosten', () => {
  it('20 km → 0,30 × 20 = 6,00 €/Tag', () => {
    const r = berechnefahrtkosten({ entfernungKm: 20 });
    expect(r.pauschaleTaeglich).toBe(6.00);
  });
  it('30 km → 0,30 × 20 + 0,38 × 10 = 9,80 €/Tag', () => {
    const r = berechnefahrtkosten({ entfernungKm: 30 });
    expect(r.pauschaleTaeglich).toBe(9.80);
  });
  it('jahresabzug = taeglich × arbeitstage', () => {
    const r = berechnefahrtkosten({ entfernungKm: 20, arbeitstageProJahr: 220 });
    expect(r.jahresabzug).toBe(6.00 * 220);
  });
});
