import { describe, it, expect } from 'vitest';
import { berechneAbfindung } from '../../public/scripts/abfindung.js';

describe('berechneAbfindung', () => {
  it('3000 € × 10 Jahre = 15.000 €', () => {
    const r = berechneAbfindung({ bruttoMonat: 3000, dienstjahre: 10 });
    expect(r.abfindung).toBe(15000);
  });
  it('monatsgehaelter = dienstjahre × 0.5', () => {
    const r = berechneAbfindung({ bruttoMonat: 4000, dienstjahre: 6 });
    expect(r.monatsgehaelter).toBe(3);
    expect(r.abfindung).toBe(12000);
  });
});
