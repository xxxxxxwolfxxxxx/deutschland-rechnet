import { describe, it, expect } from 'vitest';
import { berechneNettoGehalt, STEUERKLASSEN } from '../../public/scripts/brutto-netto.js';

describe('berechneNettoGehalt', () => {
  it('Steuerklasse 1, 3000 brutto, keine Kirche, Westdeutschland', () => {
    const ergebnis = berechneNettoGehalt({
      bruttoMonat: 3000, steuerklasse: 1, kirchensteuer: false, bundesland: 'nw',
    });
    expect(ergebnis.netto).toBeGreaterThan(2000);
    expect(ergebnis.netto).toBeLessThan(2500);
    expect(ergebnis.sozialversicherung).toBeGreaterThan(0);
    expect(ergebnis.lohnsteuer).toBeGreaterThan(0);
    expect(ergebnis.kirchensteuer).toBe(0);
  });
  it('Steuerklasse 3 hat weniger Lohnsteuer als Klasse 1', () => {
    const basis = { bruttoMonat: 4000, kirchensteuer: false, bundesland: 'by' };
    const sk1 = berechneNettoGehalt({ ...basis, steuerklasse: 1 });
    const sk3 = berechneNettoGehalt({ ...basis, steuerklasse: 3 });
    expect(sk3.lohnsteuer).toBeLessThan(sk1.lohnsteuer);
  });
  it('Mit Kirchensteuer ergibt mehr Abzüge', () => {
    const basis = { bruttoMonat: 3000, steuerklasse: 1, bundesland: 'by' };
    const ohneKi = berechneNettoGehalt({ ...basis, kirchensteuer: false });
    const mitKi  = berechneNettoGehalt({ ...basis, kirchensteuer: true });
    expect(mitKi.netto).toBeLessThan(ohneKi.netto);
    expect(mitKi.kirchensteuer).toBeGreaterThan(0);
  });
  it('Gibt alle erwarteten Felder zurück', () => {
    const r = berechneNettoGehalt({ bruttoMonat: 2500, steuerklasse: 1, kirchensteuer: false, bundesland: 'be' });
    expect(r).toHaveProperty('netto');
    expect(r).toHaveProperty('lohnsteuer');
    expect(r).toHaveProperty('soli');
    expect(r).toHaveProperty('kirchensteuer');
    expect(r).toHaveProperty('sozialversicherung');
    expect(r).toHaveProperty('krankenversicherung');
    expect(r).toHaveProperty('rentenversicherung');
    expect(r).toHaveProperty('arbeitslosenversicherung');
    expect(r).toHaveProperty('pflegeversicherung');
  });
});
