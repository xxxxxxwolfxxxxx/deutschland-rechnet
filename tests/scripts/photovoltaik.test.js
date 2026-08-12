import { describe, it, expect } from 'vitest';
import {
  berechnePhotovoltaik,
  verguetungProKwh,
  VERGUETUNGSDAUER_JAHRE,
  VERGUETUNG_GUELTIG_BIS,
} from '../../public/scripts/photovoltaik.js';

// Anzulegende Werte für Gebäudeanlagen nach § 48 Abs. 2 EEG 2023 in der ab
// 1. August 2026 geltenden Höhe (§ 49 Abs. 1 EEG: Absenkung um 1 % zum
// 1. Februar und 1. August jedes Jahres). Quelle: Bundesnetzagentur,
// Fördersätze für Solaranlagen, abgerufen am 12.08.2026.
describe('verguetungProKwh – Teileinspeisung nach § 48 Abs. 2 EEG', () => {
  it('vergütet Anlagen bis 10 kWp mit 7,70 ct/kWh', () => {
    expect(verguetungProKwh(8)).toBeCloseTo(0.077, 6);
    expect(verguetungProKwh(10)).toBeCloseTo(0.077, 6);
  });

  it('mischt oberhalb von 10 kWp anteilig nach installierter Leistung', () => {
    // § 48 Abs. 2 Satz 2 EEG: Der anzulegende Wert ist der nach der
    // installierten Leistung gewichtete Durchschnitt der Stufenwerte.
    // 15 kWp = 10 kWp × 7,70 ct + 5 kWp × 6,66 ct, geteilt durch 15 kWp
    expect(verguetungProKwh(15)).toBeCloseTo((10 * 0.077 + 5 * 0.0666) / 15, 8);
    // 40 kWp = 10 × 7,70 + 30 × 6,66
    expect(verguetungProKwh(40)).toBeCloseTo((10 * 0.077 + 30 * 0.0666) / 40, 8);
    // 100 kWp = 10 × 7,70 + 30 × 6,66 + 60 × 5,44
    expect(verguetungProKwh(100)).toBeCloseTo(
      (10 * 0.077 + 30 * 0.0666 + 60 * 0.0544) / 100,
      8,
    );
  });

  it('sinkt monoton mit der Anlagengröße', () => {
    expect(verguetungProKwh(15)).toBeLessThan(verguetungProKwh(10));
    expect(verguetungProKwh(50)).toBeLessThan(verguetungProKwh(15));
  });

  it('wendet auf eine 15-kWp-Anlage nicht den Satz der kleinsten Stufe an', () => {
    // Der häufigste Fehler: ein einziger Satz für die gesamte Einspeisung.
    expect(verguetungProKwh(15)).toBeLessThan(0.077);
  });

  it('liefert für unbrauchbare Eingaben den Satz der untersten Stufe', () => {
    expect(verguetungProKwh(0)).toBeCloseTo(0.077, 6);
    expect(verguetungProKwh(-5)).toBeCloseTo(0.077, 6);
    expect(verguetungProKwh(NaN)).toBeCloseTo(0.077, 6);
  });
});

describe('Geltungsdauer der Förderung', () => {
  it('vergütet 20 Jahre, nicht die gesamte Lebensdauer (§ 25 Abs. 1 EEG)', () => {
    expect(VERGUETUNGSDAUER_JAHRE).toBe(20);
  });

  it('nennt das Ende des Gültigkeitszeitraums der Sätze', () => {
    expect(VERGUETUNG_GUELTIG_BIS).toBe('31. Januar 2027');
  });
});

describe('berechnePhotovoltaik – Ertrag und Erlöse', () => {
  const basis = {
    leistungKwp: 8,
    investition: 14000,
    strompreis: 0.31,
    eigenverbrauchAnteil: 0.3,
  };

  it('rechnet den Jahresertrag aus Leistung und spezifischem Ertrag', () => {
    const r = berechnePhotovoltaik(basis);
    expect(r.jahresertragKwh).toBe(7600); // 8 kWp × 950 kWh/kWp
    expect(r.eigenverbrauchKwh).toBe(2280);
    expect(r.einspeisungKwh).toBe(5320);
  });

  it('bewertet Eigenverbrauch mit dem Strompreis, Einspeisung mit dem EEG-Satz', () => {
    const r = berechnePhotovoltaik(basis);
    expect(r.einsparungStrom).toBe(706.8); // 2280 kWh × 0,31 €
    expect(r.einspeiseerloese).toBe(409.64); // 5320 kWh × 0,0770 €
  });

  it('zieht Betriebskosten ab – Versicherung, Wartung, Zählermiete, Rücklage', () => {
    const r = berechnePhotovoltaik(basis);
    expect(r.betriebskosten).toBe(140); // 1,0 % von 14.000 €
    expect(r.jahresueberschuss).toBe(976.44); // 706,80 + 409,64 − 140
  });

  it('lässt die Betriebskostenquote überschreiben', () => {
    const r = berechnePhotovoltaik({ ...basis, betriebskostenAnteil: 0 });
    expect(r.betriebskosten).toBe(0);
    expect(r.jahresueberschuss).toBe(1116.44);
  });

  it('weist den angewandten Vergütungssatz aus', () => {
    expect(berechnePhotovoltaik(basis).verguetungCentProKwh).toBe(7.7);
    expect(berechnePhotovoltaik({ ...basis, leistungKwp: 15 })).toHaveProperty(
      'verguetungCentProKwh',
      7.35,
    );
  });
});

describe('berechnePhotovoltaik – Amortisation', () => {
  const basis = {
    leistungKwp: 8,
    investition: 14000,
    strompreis: 0.31,
    eigenverbrauchAnteil: 0.3,
  };

  it('amortisiert die Beispielanlage nach 15 Jahren', () => {
    // Kumulierter Überschuss mit 0,5 % Degradation pro Jahr:
    // nach 14 Jahren 13.173 €, nach 15 Jahren 14.073 € > 14.000 €
    expect(berechnePhotovoltaik(basis).amortJahre).toBe(15);
  });

  it('meldet keine Amortisation, wenn sie in 30 Jahren nicht eintritt', () => {
    const r = berechnePhotovoltaik({ ...basis, investition: 90000 });
    expect(r.amortJahre).toBeNull();
  });

  it('amortisiert schneller, je höher der Eigenverbrauch ist', () => {
    const wenig = berechnePhotovoltaik({ ...basis, eigenverbrauchAnteil: 0.2 });
    const viel = berechnePhotovoltaik({ ...basis, eigenverbrauchAnteil: 0.7 });
    expect(viel.amortJahre).toBeLessThan(wenig.amortJahre);
  });
});

describe('berechnePhotovoltaik – Überschuss über 25 Jahre', () => {
  const basis = {
    leistungKwp: 8,
    investition: 14000,
    strompreis: 0.31,
    eigenverbrauchAnteil: 0.3,
  };

  it('rechnet die Einspeisevergütung nur für 20 Jahre', () => {
    // Einsparung 25 Jahre: 706,80 € × 23,5558 (Degressionssumme) = 16.649 €
    // Einspeisung 20 Jahre: 409,64 € × 19,0778 = 7.815 €
    // abzüglich 25 × 140 € Betriebskosten und 14.000 € Investition
    expect(berechnePhotovoltaik(basis).ueberschuss25j).toBeCloseTo(6964.42, 1);
  });

  it('bleibt unter dem Wert, den 25 Jahre Vergütung ergäben', () => {
    const r = berechnePhotovoltaik(basis);
    const mit25JahrenVerguetung =
      r.ueberschuss25j + r.einspeiseerloese * 5 * 0.9;
    expect(r.ueberschuss25j).toBeLessThan(mit25JahrenVerguetung);
  });

  it('weist den Ertrag nach dem Ende der Förderung weiterhin aus', () => {
    // Ab Jahr 21 bleibt die Stromkostenersparnis, die Vergütung entfällt.
    const r = berechnePhotovoltaik(basis);
    expect(r.ueberschuss25j).toBeGreaterThan(0);
  });
});
