import { describe, it, expect } from 'vitest';
import { berechneGrunderwerbsteuer, STEUERSAETZE } from '../../public/scripts/grunderwerbsteuer.js';

describe('berechneGrunderwerbsteuer', () => {
  it('Bayern: 3,5% auf 300.000 € = 10.500 €', () => {
    const r = berechneGrunderwerbsteuer({ kaufpreis: 300000, bundesland: 'by' });
    expect(r.steuer).toBe(10500);
    expect(r.satz).toBe(3.5);
  });
  it('NRW: 6,5% auf 400.000 € = 26.000 €', () => {
    const r = berechneGrunderwerbsteuer({ kaufpreis: 400000, bundesland: 'nw' });
    expect(r.steuer).toBe(26000);
  });
  it('STEUERSAETZE enthält alle 16 Bundesländer', () => {
    expect(Object.keys(STEUERSAETZE).length).toBe(16);
  });
});
