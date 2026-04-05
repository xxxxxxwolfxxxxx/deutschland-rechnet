import { describe, it, expect } from 'vitest';
import { berechneRentenpunkte } from '../../public/scripts/rentenpunkte.js';

describe('berechneRentenpunkte', () => {
  it('Durchschnittseinkommen ergibt genau 1 Entgeltpunkt', () => {
    const r = berechneRentenpunkte({ bruttoJahr: 45358 });
    expect(r.entgeltpunkte).toBe(1.00);
  });
  it('Doppeltes Einkommen → 2 Entgeltpunkte', () => {
    const r = berechneRentenpunkte({ bruttoJahr: 90716 });
    expect(r.entgeltpunkte).toBe(2.00);
  });
  it('über mehrere Jahre addiert sich', () => {
    const r = berechneRentenpunkte({ bruttoJahr: 45358, jahre: 10 });
    expect(r.entgeltpunkteGesamt).toBe(10.00);
  });
});
