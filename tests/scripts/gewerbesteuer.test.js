import { describe, it, expect } from 'vitest';
import {
  berechneGewerbesteuer,
  FREIBETRAG,
  MESSZAHL,
  ANRECHNUNGSFAKTOR,
  MINDESTHEBESATZ,
  NEUTRALER_HEBESATZ,
} from '../../public/scripts/gewerbesteuer.js';

// § 11 GewStG (Abrundung auf volle 100 €, dann Freibetrag 24.500 €, Messzahl
// 3,5 %), § 16 GewStG (Mindesthebesatz 200 %), § 35 Abs. 1 EStG (Anrechnung
// des Vierfachen des Messbetrags, beschränkt auf die tatsächlich zu zahlende
// Gewerbesteuer). Abgerufen am 23.09.2026.

describe('Konstanten', () => {
  it('entsprechen dem Gesetz', () => {
    expect(FREIBETRAG).toBe(24500);
    expect(MESSZAHL).toBe(0.035);
    expect(ANRECHNUNGSFAKTOR).toBe(4);
    expect(MINDESTHEBESATZ).toBe(200);
  });

  it('der neutrale Hebesatz folgt aus Faktor und Messzahl', () => {
    // 4 × Messbetrag = Messbetrag × h/100  ⇔  h = 400
    expect(NEUTRALER_HEBESATZ).toBe(400);
  });
});

describe('berechneGewerbesteuer – Einzelunternehmen', () => {
  const r = berechneGewerbesteuer({ gewerbeertrag: 100000, hebesatz: 410, rechtsform: 'einzel' });

  it('rundet den Gewerbeertrag auf volle 100 € ab, bevor der Freibetrag abgeht', () => {
    expect(r.ertragAbgerundet).toBe(100000);
    expect(r.freibetrag).toBe(24500);
    expect(r.steuerpflichtig).toBe(75500);
  });

  it('rechnet Messbetrag und Steuer', () => {
    expect(r.messbetrag).toBeCloseTo(2642.5, 10);
    expect(r.gewerbesteuer).toBeCloseTo(10834.25, 10);
  });

  it('kappt die Anrechnung nicht, solange sie unter der Steuer bleibt', () => {
    expect(r.anrechnungRechnerisch).toBeCloseTo(10570, 10);
    expect(r.anrechnung).toBeCloseTo(10570, 10);
    expect(r.gekappt).toBe(false);
  });

  it('weist die Restbelastung aus', () => {
    expect(r.restbelastung).toBeCloseTo(264.25, 10);
  });
});

describe('Abrundung nach § 11 Abs. 1 Satz 3 GewStG', () => {
  it('schneidet angefangene 100 € ab', () => {
    const r = berechneGewerbesteuer({ gewerbeertrag: 100050, hebesatz: 410, rechtsform: 'einzel' });
    expect(r.ertragAbgerundet).toBe(100000);
    expect(r.steuerpflichtig).toBe(75500);
  });

  it('die alte Fassung ohne Abrundung ergab einen anderen Wert', () => {
    const r = berechneGewerbesteuer({ gewerbeertrag: 100050, hebesatz: 410, rechtsform: 'einzel' });
    const ohneAbrundung = (100050 - 24500) * 0.035 * 4.1;
    expect(ohneAbrundung - r.gewerbesteuer).toBeCloseTo(7.175, 3);
  });

  it('rundet auch knapp unter einer Hunderterstufe korrekt', () => {
    expect(berechneGewerbesteuer({ gewerbeertrag: 99999, hebesatz: 400, rechtsform: 'einzel' }).ertragAbgerundet)
      .toBe(99900);
  });
});

describe('Freibetrag gilt nicht für Kapitalgesellschaften', () => {
  it('Einzelunternehmen und Personengesellschaft bekommen ihn', () => {
    expect(berechneGewerbesteuer({ gewerbeertrag: 50000, hebesatz: 400, rechtsform: 'einzel' }).freibetrag).toBe(24500);
    expect(berechneGewerbesteuer({ gewerbeertrag: 50000, hebesatz: 400, rechtsform: 'person' }).freibetrag).toBe(24500);
  });

  it('die Kapitalgesellschaft nicht', () => {
    const r = berechneGewerbesteuer({ gewerbeertrag: 50000, hebesatz: 400, rechtsform: 'koerper' });
    expect(r.freibetrag).toBe(0);
    expect(r.steuerpflichtig).toBe(50000);
  });
});

describe('§ 35 EStG gilt nur für die Einkommensteuer', () => {
  it('die Kapitalgesellschaft rechnet nichts an – sie zahlt keine Einkommensteuer', () => {
    const r = berechneGewerbesteuer({ gewerbeertrag: 100000, hebesatz: 410, rechtsform: 'koerper' });
    expect(r.anrechnung).toBe(0);
    expect(r.anrechenbar).toBe(false);
    expect(r.restbelastung).toBeCloseTo(r.gewerbesteuer, 10);
  });
});

describe('Kappung auf die tatsächlich zu zahlende Gewerbesteuer', () => {
  it('unterhalb von 400 % wird gekappt', () => {
    const r = berechneGewerbesteuer({ gewerbeertrag: 100000, hebesatz: 300, rechtsform: 'einzel' });
    expect(r.anrechnungRechnerisch).toBeCloseTo(10570, 10);
    expect(r.anrechnung).toBeCloseTo(r.gewerbesteuer, 10);
    expect(r.anrechnung).toBeCloseTo(7927.5, 10);
    expect(r.gekappt).toBe(true);
  });

  it('bei genau 400 % gehen Steuer und Anrechnung glatt auf', () => {
    const r = berechneGewerbesteuer({ gewerbeertrag: 100000, hebesatz: 400, rechtsform: 'einzel' });
    expect(r.anrechnung).toBeCloseTo(r.gewerbesteuer, 10);
    expect(r.restbelastung).toBeCloseTo(0, 10);
  });

  it('unterhalb von 400 % bleibt nie eine Restbelastung', () => {
    for (const h of [200, 250, 300, 350, 399]) {
      const r = berechneGewerbesteuer({ gewerbeertrag: 200000, hebesatz: h, rechtsform: 'einzel' });
      expect(r.restbelastung).toBeCloseTo(0, 10);
    }
  });

  it('oberhalb von 400 % schlägt jeder Punkt voll durch', () => {
    const a = berechneGewerbesteuer({ gewerbeertrag: 200000, hebesatz: 450, rechtsform: 'einzel' });
    const b = berechneGewerbesteuer({ gewerbeertrag: 200000, hebesatz: 451, rechtsform: 'einzel' });
    expect(b.restbelastung - a.restbelastung).toBeCloseTo(a.messbetrag * 0.01, 10);
  });
});

describe('Eingabeprüfung', () => {
  it('weist einen Hebesatz unter dem Mindestsatz zurück', () => {
    expect(() => berechneGewerbesteuer({ gewerbeertrag: 100000, hebesatz: 150, rechtsform: 'einzel' })).toThrow();
  });

  it('weist negative Erträge zurück', () => {
    expect(() => berechneGewerbesteuer({ gewerbeertrag: -1, hebesatz: 400, rechtsform: 'einzel' })).toThrow();
  });

  it('ein Ertrag unter dem Freibetrag ergibt null Steuer', () => {
    const r = berechneGewerbesteuer({ gewerbeertrag: 20000, hebesatz: 400, rechtsform: 'einzel' });
    expect(r.steuerpflichtig).toBe(0);
    expect(r.gewerbesteuer).toBe(0);
    expect(r.anrechnung).toBe(0);
  });
});
