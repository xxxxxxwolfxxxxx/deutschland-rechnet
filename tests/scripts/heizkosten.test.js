import { describe, it, expect } from 'vitest';
import { berechneHeizkosten } from '../../public/scripts/heizkosten.js';

describe('berechneHeizkosten', () => {
  it('berechnet Jahreskosten korrekt', () => {
    // 10.000 kWh × 10 ct = 1.000 €
    const r = berechneHeizkosten({ verbrauchKwh: 10000, preisCent: 10 });
    expect(r.kosten).toBe(1000);
  });
  it('berechnet Monatskosten korrekt', () => {
    const r = berechneHeizkosten({ verbrauchKwh: 12000, preisCent: 10 });
    expect(r.monat).toBe(100);
  });
  it('rundet auf Cent', () => {
    const r = berechneHeizkosten({ verbrauchKwh: 1000, preisCent: 9.9 });
    expect(r.kosten).toBe(99);
  });
});
