import { describe, it, expect } from 'vitest';
import { berechneKredit } from '../../public/scripts/kredit.js';

describe('berechneKredit', () => {
  it('200.000 € bei 3% über 20 Jahre', () => {
    const r = berechneKredit({ betrag: 200000, zinssatz: 3, laufzeitJahre: 20 });
    expect(r.monatsrate).toBeGreaterThan(1000);
    expect(r.monatsrate).toBeLessThan(1200);
    expect(r.gesamtkosten).toBeGreaterThan(200000);
    expect(r.gesamtzinsen).toBeGreaterThan(0);
  });
  it('Keine Zinsen → Monatsrate = Betrag / Monate', () => {
    const r = berechneKredit({ betrag: 12000, zinssatz: 0, laufzeitJahre: 1 });
    expect(r.monatsrate).toBe(1000);
  });
});
