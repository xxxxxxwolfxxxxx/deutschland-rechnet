import { describe, it, expect } from 'vitest';
import { berechneElterngeld } from '../../public/scripts/elterngeld.js';

describe('berechneElterngeld', () => {
  it('67% des Nettoeinkommens bei 2000 € netto', () => {
    const r = berechneElterngeld({ nettoMonat: 2000 });
    expect(r.elterngeld).toBe(1340);
  });
  it('Minimum 300 € bei sehr niedrigem Einkommen', () => {
    const r = berechneElterngeld({ nettoMonat: 300 });
    expect(r.elterngeld).toBe(300);
  });
  it('Maximum 1800 € bei sehr hohem Einkommen', () => {
    const r = berechneElterngeld({ nettoMonat: 5000 });
    expect(r.elterngeld).toBe(1800);
  });
  it('ElterngeldPlus ist die Hälfte', () => {
    const r = berechneElterngeld({ nettoMonat: 2000 });
    expect(r.elterngeldPlus).toBe(670);
  });
});
