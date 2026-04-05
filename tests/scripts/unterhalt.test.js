import { describe, it, expect } from 'vitest';
import { berechneUnterhalt } from '../../public/scripts/unterhalt.js';

describe('berechneUnterhalt', () => {
  it('Kind 5 Jahre, Einkommen 2000 netto → Tabellenwert Gruppe 1', () => {
    const r = berechneUnterhalt({ alterKind: 5, nettoEinkommen: 2000 });
    expect(r.unterhalt).toBeGreaterThan(0);
    expect(r.einkommensgruppe).toBe(1);
  });
  it('Höheres Einkommen → höhere Gruppe', () => {
    const r1 = berechneUnterhalt({ alterKind: 8, nettoEinkommen: 2000 });
    const r2 = berechneUnterhalt({ alterKind: 8, nettoEinkommen: 4000 });
    expect(r2.unterhalt).toBeGreaterThan(r1.unterhalt);
  });
  it('Älteres Kind → höherer Unterhalt', () => {
    const r1 = berechneUnterhalt({ alterKind: 4, nettoEinkommen: 2500 });
    const r2 = berechneUnterhalt({ alterKind: 14, nettoEinkommen: 2500 });
    expect(r2.unterhalt).toBeGreaterThan(r1.unterhalt);
  });
});
