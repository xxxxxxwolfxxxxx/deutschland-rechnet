import { describe, it, expect } from 'vitest';
import { berechneUeberstunden } from '../../public/scripts/ueberstunden.js';

describe('berechneUeberstunden', () => {
  it('berechnet Stundenlohn korrekt', () => {
    // 3000 € / (40h × 52 / 12) = 3000 / 173.33 ≈ 17.31 €/h
    const r = berechneUeberstunden({ bruttoMonat: 3000, stundenProWoche: 40, ueberstunden: 10, zuschlagProzent: 0 });
    expect(r.stundenlohn).toBeGreaterThan(17);
    expect(r.stundenlohn).toBeLessThan(18);
  });
  it('25% Zuschlag verdoppelt nicht aber erhöht', () => {
    const ohne = berechneUeberstunden({ bruttoMonat: 3000, stundenProWoche: 40, ueberstunden: 10, zuschlagProzent: 0 });
    const mit = berechneUeberstunden({ bruttoMonat: 3000, stundenProWoche: 40, ueberstunden: 10, zuschlagProzent: 25 });
    expect(mit.vergütung).toBeGreaterThan(ohne.vergütung);
  });
});
