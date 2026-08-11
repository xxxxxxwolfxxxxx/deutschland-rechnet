import { describe, it, expect } from 'vitest';
import { berechneNettoGehalt, STEUERKLASSEN } from '../../public/scripts/brutto-netto.js';
import { KIRCHENSTEUER_LAENDER } from '../../public/scripts/kirchensteuer.js';

describe('Kirchensteuer im Nettolohn', () => {
  const basis = { bruttoMonat: 4000, steuerklasse: 1, kirchensteuer: true };

  // Der Rechner führte eine eigene Kopie der Sätze und gab Hessen, RP,
  // Saarland, Sachsen, Sachsen-Anhalt und Thüringen 8 % statt 9 %. Er holt
  // den Satz jetzt aus kirchensteuer.js.
  it.each(['HE', 'RP', 'SL', 'SN', 'ST', 'TH'])('%s wird mit 9 %% gerechnet', (land) => {
    const r = berechneNettoGehalt({ ...basis, bundesland: land });
    expect(r.kirchensteuer).toBeCloseTo(r.lohnsteuer * 0.09, 2);
  });

  it.each(['BY', 'BW'])('%s wird mit 8 %% gerechnet', (land) => {
    const r = berechneNettoGehalt({ ...basis, bundesland: land });
    expect(r.kirchensteuer).toBeCloseTo(r.lohnsteuer * 0.08, 2);
  });

  it('rechnet für jedes der 16 Bundesländer mit dem Satz aus dem Modul', () => {
    for (const [kuerzel, land] of Object.entries(KIRCHENSTEUER_LAENDER)) {
      const r = berechneNettoGehalt({ ...basis, bundesland: kuerzel });
      expect(r.kirchensteuer, kuerzel).toBeCloseTo(r.lohnsteuer * land.satz, 2);
    }
  });

  it('fällt bei unbekanntem Bundesland nicht still auf 9 % zurück', () => {
    expect(() => berechneNettoGehalt({ ...basis, bundesland: 'nrw' })).toThrow();
  });

  it('ohne Kirchensteuer bleibt sie 0 – auch bei gültigem Bundesland', () => {
    const r = berechneNettoGehalt({ ...basis, kirchensteuer: false, bundesland: 'NW' });
    expect(r.kirchensteuer).toBe(0);
  });
});

describe('berechneNettoGehalt', () => {
  it('Steuerklasse 1, 3000 brutto, keine Kirche, Westdeutschland', () => {
    const ergebnis = berechneNettoGehalt({
      bruttoMonat: 3000, steuerklasse: 1, kirchensteuer: false, bundesland: 'NW',
    });
    expect(ergebnis.netto).toBeGreaterThan(2000);
    expect(ergebnis.netto).toBeLessThan(2500);
    expect(ergebnis.sozialversicherung).toBeGreaterThan(0);
    expect(ergebnis.lohnsteuer).toBeGreaterThan(0);
    expect(ergebnis.kirchensteuer).toBe(0);
  });
  it('Steuerklasse 3 hat weniger Lohnsteuer als Klasse 1', () => {
    const basis = { bruttoMonat: 4000, kirchensteuer: false, bundesland: 'BY' };
    const sk1 = berechneNettoGehalt({ ...basis, steuerklasse: 1 });
    const sk3 = berechneNettoGehalt({ ...basis, steuerklasse: 3 });
    expect(sk3.lohnsteuer).toBeLessThan(sk1.lohnsteuer);
  });
  it('Mit Kirchensteuer ergibt mehr Abzüge', () => {
    const basis = { bruttoMonat: 3000, steuerklasse: 1, bundesland: 'BY' };
    const ohneKi = berechneNettoGehalt({ ...basis, kirchensteuer: false });
    const mitKi  = berechneNettoGehalt({ ...basis, kirchensteuer: true });
    expect(mitKi.netto).toBeLessThan(ohneKi.netto);
    expect(mitKi.kirchensteuer).toBeGreaterThan(0);
  });
  it('Gibt alle erwarteten Felder zurück', () => {
    const r = berechneNettoGehalt({ bruttoMonat: 2500, steuerklasse: 1, kirchensteuer: false, bundesland: 'BE' });
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
