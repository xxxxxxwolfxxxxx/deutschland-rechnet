import { describe, it, expect } from 'vitest';
import { berechneKalorienbedarf } from '../../public/scripts/kalorien.js';

describe('berechneKalorienbedarf', () => {
  it('Mann, 30 Jahre, 80 kg, 180 cm, wenig aktiv', () => {
    const r = berechneKalorienbedarf({ geschlecht: 'm', alter: 30, gewicht: 80, groesse: 180, aktivitaet: 1.375 });
    expect(r.tdee).toBeGreaterThan(2000);
    expect(r.tdee).toBeLessThan(3000);
    expect(r.bmr).toBeGreaterThan(1500);
  });
  it('Frau hat niedrigeren BMR als Mann bei gleichen Werten', () => {
    const basis = { alter: 30, gewicht: 70, groesse: 170, aktivitaet: 1.2 };
    const m = berechneKalorienbedarf({ ...basis, geschlecht: 'm' });
    const f = berechneKalorienbedarf({ ...basis, geschlecht: 'f' });
    expect(f.bmr).toBeLessThan(m.bmr);
  });
});
