import { describe, it, expect } from 'vitest';
import { berechneNettoGehalt, STEUERKLASSEN } from '../../public/scripts/brutto-netto.js';
import { KIRCHENSTEUER_LAENDER } from '../../public/scripts/kirchensteuer.js';
import { BUNDESLAENDER } from '../../public/scripts/bundeslaender.js';

const basisNW = { steuerklasse: 1, kinder: 1, bundesland: 'NW', kirchensteuer: false };

// Referenzwerte aus § 39b Abs. 2 EStG, § 32a EStG, SolzG 1995 und den
// Beitragssätzen 2026. Bis zum 11.08.2026 zog der Rechner den Grundfreibetrag
// zusätzlich vom Bruttolohn ab und rechnete die vollen Sozialabgaben statt der
// Vorsorgepauschale gegen. Bei 3.000 € Brutto kamen so 61,58 € Lohnsteuer im
// Monat heraus statt 298,00 €.
describe('Lohnsteuer im Nettolohn', () => {
  it.each([
    [2000, 91.08],
    [3000, 298.0],
    [4000, 531.83],
    [9000, 2227.42],
  ])('%i € brutto, Steuerklasse I, ein Kind → %f € Lohnsteuer', (brutto, erwartet) => {
    expect(berechneNettoGehalt({ ...basisNW, bruttoMonat: brutto }).lohnsteuer).toBeCloseTo(erwartet, 2);
  });

  it('zieht den Grundfreibetrag nicht doppelt ab', () => {
    // Der alte Fehler machte aus 3.000 € Brutto rund 62 € Lohnsteuer.
    expect(berechneNettoGehalt({ ...basisNW, bruttoMonat: 3000 }).lohnsteuer).toBeGreaterThan(250);
  });

  it('3.000 € brutto ergibt 2.067,50 € netto', () => {
    const r = berechneNettoGehalt({ ...basisNW, bruttoMonat: 3000 });
    expect(r.netto).toBeCloseTo(2067.5, 2);
  });

  it.each([
    [1, 298.0],
    [2, 203.42],
    [3, 38.33],
    [4, 298.0],
    [5, 632.33],
    [6, 671.83],
  ])('Steuerklasse %i bei 3.000 € brutto → %f € Lohnsteuer', (sk, erwartet) => {
    expect(berechneNettoGehalt({ ...basisNW, bruttoMonat: 3000, steuerklasse: sk }).lohnsteuer)
      .toBeCloseTo(erwartet, 2);
  });

  it('weist unbekannte Steuerklassen zurück', () => {
    expect(() => berechneNettoGehalt({ ...basisNW, bruttoMonat: 3000, steuerklasse: 7 })).toThrow();
  });
});

describe('Solidaritätszuschlag', () => {
  it('fällt bei 4.000 € brutto nicht an', () => {
    expect(berechneNettoGehalt({ ...basisNW, bruttoMonat: 4000 }).soli).toBe(0);
  });

  it('fällt bei 9.000 € brutto an', () => {
    expect(berechneNettoGehalt({ ...basisNW, bruttoMonat: 9000 }).soli).toBeCloseTo(63.26, 2);
  });

  it('setzt in Steuerklasse III die doppelte Freigrenze an', () => {
    const arg = { ...basisNW, bruttoMonat: 9000 };
    expect(berechneNettoGehalt({ ...arg, steuerklasse: 3 }).soli).toBe(0);
    expect(berechneNettoGehalt({ ...arg, steuerklasse: 1 }).soli).toBeGreaterThan(0);
  });
});

describe('Sozialabgaben im Nettolohn', () => {
  it('3.000 € brutto, ein Kind, Nordrhein-Westfalen', () => {
    const r = berechneNettoGehalt({ ...basisNW, bruttoMonat: 3000 });
    expect(r.krankenversicherung).toBeCloseTo(262.5, 2);
    expect(r.pflegeversicherung).toBeCloseTo(54.0, 2);
    expect(r.rentenversicherung).toBeCloseTo(279.0, 2);
    expect(r.arbeitslosenversicherung).toBeCloseTo(39.0, 2);
    expect(r.sozialversicherung).toBeCloseTo(634.5, 2);
  });

  it('Kinderlose zahlen mehr Pflegeversicherung', () => {
    const mit = berechneNettoGehalt({ ...basisNW, bruttoMonat: 3000, kinder: 1 });
    const ohne = berechneNettoGehalt({ ...basisNW, bruttoMonat: 3000, kinder: 0 });
    expect(ohne.pflegeversicherung).toBeCloseTo(72.0, 2);
    expect(mit.pflegeversicherung).toBeCloseTo(54.0, 2);
  });

  it('Sachsen zahlt mehr Pflegeversicherung als die übrigen Länder', () => {
    const sn = berechneNettoGehalt({ ...basisNW, bruttoMonat: 3000, bundesland: 'SN' });
    expect(sn.pflegeversicherung).toBeCloseTo(69.0, 2);
    expect(sn.netto).toBeCloseTo(2052.5, 2);
  });

  it('kappt die Beiträge an den Beitragsbemessungsgrenzen', () => {
    const hoch = berechneNettoGehalt({ ...basisNW, bruttoMonat: 20000 });
    const sehrHoch = berechneNettoGehalt({ ...basisNW, bruttoMonat: 40000 });
    expect(sehrHoch.sozialversicherung).toBeCloseTo(hoch.sozialversicherung, 2);
  });
});

describe('Kirchensteuer im Nettolohn', () => {
  const basis = { bruttoMonat: 4000, steuerklasse: 1, kinder: 1, kirchensteuer: true };

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

describe('berechneNettoGehalt allgemein', () => {
  it('bietet alle sechs Steuerklassen an', () => {
    expect(STEUERKLASSEN).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('Steuerklasse III hat weniger Lohnsteuer als Klasse I', () => {
    const basis = { bruttoMonat: 4000, kinder: 1, kirchensteuer: false, bundesland: 'BY' };
    expect(berechneNettoGehalt({ ...basis, steuerklasse: 3 }).lohnsteuer)
      .toBeLessThan(berechneNettoGehalt({ ...basis, steuerklasse: 1 }).lohnsteuer);
  });

  it('Abzüge und Netto ergeben zusammen das Brutto', () => {
    for (const bl of Object.keys(BUNDESLAENDER)) {
      for (const brutto of [1500, 3000, 6000, 12000]) {
        const r = berechneNettoGehalt({ bruttoMonat: brutto, steuerklasse: 1, kinder: 0, bundesland: bl, kirchensteuer: true });
        const summe = r.netto + r.sozialversicherung + r.lohnsteuer + r.soli + r.kirchensteuer;
        expect(summe, `${bl} bei ${brutto} €`).toBeCloseTo(brutto, 2);
      }
    }
  });

  it('das Netto bleibt bei jedem Brutto positiv und unter dem Brutto', () => {
    for (let brutto = 500; brutto <= 30000; brutto += 500) {
      const r = berechneNettoGehalt({ ...basisNW, bruttoMonat: brutto });
      expect(r.netto, `${brutto} €`).toBeGreaterThan(0);
      expect(r.netto).toBeLessThan(brutto);
    }
  });

  it('mehr Brutto ergibt nie weniger Netto', () => {
    let vorher = -1;
    for (let brutto = 500; brutto <= 30000; brutto += 250) {
      const netto = berechneNettoGehalt({ ...basisNW, bruttoMonat: brutto }).netto;
      expect(netto, `${brutto} €`).toBeGreaterThan(vorher);
      vorher = netto;
    }
  });

  it('gibt alle erwarteten Felder zurück', () => {
    const r = berechneNettoGehalt({ ...basisNW, bruttoMonat: 2500, bundesland: 'BE' });
    for (const feld of ['netto', 'lohnsteuer', 'soli', 'kirchensteuer', 'sozialversicherung',
      'krankenversicherung', 'rentenversicherung', 'arbeitslosenversicherung', 'pflegeversicherung']) {
      expect(r).toHaveProperty(feld);
    }
  });
});
