import { describe, it, expect } from 'vitest';
import {
  berechnePfaendungsfreigrenze,
  freigrenze,
  GRUNDFREIBETRAG_MONAT,
  ERHOEHUNG_ERSTE_PERSON,
  ERHOEHUNG_WEITERE_PERSON,
  HOECHSTBETRAG_MONAT,
  pKontoFreibetrag,
} from '../../public/scripts/pfaendungsfreigrenze.js';

// Das Modul rechnete bis zum 11.08.2026 mit den Beträgen vom 01.07.2024 und
// einer frei erfundenen Formel: Im unteren Bereich gab es den vollen Betrag
// über der Freigrenze als pfändbar aus, darüber einen quadratisch wachsenden
// Anteil ("ca. 50 % des Mehrbetrags"). Die drei Zehntel des § 850c Abs. 3 ZPO
// kamen darin nicht vor. Die mitgelieferte Tabelle wurde nie benutzt.
//
// Maßgeblich sind die Beträge der Pfändungsfreigrenzenbekanntmachung 2026
// (Bek. v. 19.03.2026, BGBl. 2026 I Nr. 80), gültig ab dem 01.07.2026.
describe('Beträge nach § 850c ZPO ab 01.07.2026', () => {
  it('Grundfreibetrag 1.587,40 € monatlich (Absatz 1 Nummer 1)', () => {
    expect(GRUNDFREIBETRAG_MONAT).toBe(1587.4);
  });

  it('erste unterhaltsberechtigte Person 597,42 € (Absatz 2 Satz 1)', () => {
    expect(ERHOEHUNG_ERSTE_PERSON).toBe(597.42);
  });

  it('zweite bis fünfte Person je 332,83 € (Absatz 2 Satz 2)', () => {
    expect(ERHOEHUNG_WEITERE_PERSON).toBe(332.83);
  });

  it('Höchstbetrag 4.866,30 € monatlich (Absatz 3 Satz 3)', () => {
    expect(HOECHSTBETRAG_MONAT).toBe(4866.3);
  });
});

// § 899 Abs. 1 Satz 1 ZPO: der Freibetrag des § 850c Abs. 1, aufgerundet auf
// den nächsten vollen 10-Euro-Betrag.
describe('P-Konto', () => {
  it('geschütztes Guthaben 1.590 €', () => {
    expect(pKontoFreibetrag()).toBe(1590);
  });

  it('ist der aufgerundete Grundfreibetrag, kein eigener Wert', () => {
    expect(pKontoFreibetrag()).toBeGreaterThanOrEqual(GRUNDFREIBETRAG_MONAT);
    expect(pKontoFreibetrag() - GRUNDFREIBETRAG_MONAT).toBeLessThan(10);
    expect(pKontoFreibetrag() % 10).toBe(0);
  });
});

describe('Freigrenze', () => {
  it('ohne Unterhaltspflicht ist sie der Grundfreibetrag', () => {
    expect(freigrenze(0)).toBe(1587.4);
  });

  it('steigt für die erste Person um 597,42 €', () => {
    expect(freigrenze(1)).toBe(2184.82);
  });

  it('steigt für jede weitere Person um 332,83 €', () => {
    expect(freigrenze(2)).toBe(2517.65);
    expect(freigrenze(5)).toBe(3516.14);
  });

  it('berücksichtigt höchstens fünf Personen (§ 850c Abs. 2 Satz 2)', () => {
    expect(freigrenze(9)).toBe(freigrenze(5));
  });
});

// Stichproben aus der amtlichen Tabelle, Anhang der Bekanntmachung 2026,
// Auszahlung für Monate. Spalten: 0 bis 5 unterhaltsberechtigte Personen.
const AMTLICH = [
  [1580.0, [0, 0, 0, 0, 0, 0]],
  [1590.0, [1.82, 0, 0, 0, 0, 0]],
  [2000.0, [288.82, 0, 0, 0, 0, 0]],
  [2190.0, [421.82, 2.59, 0, 0, 0, 0]],
  [2500.0, [638.82, 157.59, 0, 0, 0, 0]],
  [3000.0, [988.82, 407.59, 192.94, 44.86, 0, 0]],
  [4000.0, [1688.82, 907.59, 592.94, 344.86, 163.34, 48.39]],
  [4860.0, [2290.82, 1337.59, 936.94, 602.86, 335.34, 134.39]],
];

describe('pfändbarer Betrag gegen die amtliche Tabelle', () => {
  for (const [netto, spalten] of AMTLICH) {
    it(`${netto.toFixed(2)} € netto`, () => {
      spalten.forEach((soll, personen) => {
        const r = berechnePfaendungsfreigrenze({ nettoMonat: netto, unterhaltspflichtige: personen });
        expect(r.pfaendbar, `${personen} Unterhaltspflichtige`).toBe(soll);
      });
    });
  }

  it('gilt innerhalb der ganzen 10-Euro-Stufe (§ 850c Abs. 5 Satz 1)', () => {
    for (const netto of [2000, 2003.47, 2009.99]) {
      expect(berechnePfaendungsfreigrenze({ nettoMonat: netto }).pfaendbar).toBe(288.82);
    }
  });
});

describe('Höchstbetrag', () => {
  it('was 4.866,30 € übersteigt, ist voll pfändbar (§ 850c Abs. 3 Satz 3)', () => {
    const r = berechnePfaendungsfreigrenze({ nettoMonat: 6000 });
    expect(r.pfaendbar).toBe(Math.round((2290.82 + (6000 - 4866.3)) * 100) / 100);
  });

  it('der Sockel bleibt auch bei sehr hohem Einkommen unpfändbar', () => {
    const r = berechnePfaendungsfreigrenze({ nettoMonat: 20000 });
    expect(r.unpfaendbar).toBe(Math.round((20000 - r.pfaendbar) * 100) / 100);
    expect(r.unpfaendbar).toBeGreaterThan(2500);
  });
});

describe('Randfälle', () => {
  it('unterhalb der Freigrenze ist nichts pfändbar', () => {
    const r = berechnePfaendungsfreigrenze({ nettoMonat: 1400 });
    expect(r.pfaendbar).toBe(0);
    expect(r.unpfaendbar).toBe(1400);
    expect(r.freigrenze).toBe(1587.4);
  });

  it('pfändbar und unpfändbar ergeben zusammen den Nettolohn', () => {
    for (const netto of [0, 1500, 2345.67, 4000, 9999]) {
      const r = berechnePfaendungsfreigrenze({ nettoMonat: netto });
      expect(r.pfaendbar + r.unpfaendbar).toBeCloseTo(netto, 2);
    }
  });

  it('der pfändbare Betrag wächst monoton mit dem Nettolohn', () => {
    let vorher = -1;
    for (let netto = 1500; netto <= 7000; netto += 10) {
      const p = berechnePfaendungsfreigrenze({ nettoMonat: netto }).pfaendbar;
      expect(p).toBeGreaterThanOrEqual(vorher);
      vorher = p;
    }
  });

  it('mehr Unterhaltspflichtige senken den pfändbaren Betrag', () => {
    const werte = [0, 1, 2, 3, 4, 5].map(
      (n) => berechnePfaendungsfreigrenze({ nettoMonat: 4000, unterhaltspflichtige: n }).pfaendbar
    );
    for (let i = 1; i < werte.length; i++) expect(werte[i]).toBeLessThan(werte[i - 1]);
  });

  it('behandelt negative und fehlende Eingaben wie null', () => {
    expect(berechnePfaendungsfreigrenze({ nettoMonat: -100 }).pfaendbar).toBe(0);
    expect(berechnePfaendungsfreigrenze({}).pfaendbar).toBe(0);
  });
});
