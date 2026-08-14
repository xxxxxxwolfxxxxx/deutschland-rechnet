import { describe, it, expect } from 'vitest';
import {
  berechneErbschaftsteuer,
  FREIBETRAEGE,
  STEUERSAETZE,
  steuersatz,
  PERSONENGRUPPEN,
} from '../../public/scripts/erbschaftsteuer.js';

// Die Erwartungswerte sind von Hand aus dem Gesetz hergeleitet, nicht aus dem
// Modul abgelesen: Freibetrag nach § 16 Abs. 1 ErbStG abziehen, den Satz aus
// der Tabelle des § 19 Abs. 1 auf den GESAMTEN steuerpflichtigen Erwerb
// anwenden und, wo eine Wertgrenze knapp überschritten ist, den Härteausgleich
// des § 19 Abs. 3 gegenrechnen.

describe('Freibeträge nach § 16 Abs. 1 ErbStG', () => {
  it.each([
    ['I1', 500000, 'Ehegatte und Lebenspartner, Nr. 1'],
    ['I2', 400000, 'Kinder und Kinder verstorbener Kinder, Nr. 2'],
    ['I3', 200000, 'Kinder der Kinder, Nr. 3'],
    ['I4', 100000, 'übrige Personen der Steuerklasse I, Nr. 4'],
    ['II', 20000, 'Steuerklasse II, Nr. 5'],
    ['III', 20000, 'Steuerklasse III, Nr. 7'],
  ])('%s erhält %i Euro (%s)', (gruppe, erwartet) => {
    expect(FREIBETRAEGE[gruppe]).toBe(erwartet);
  });

  it('gewährt der Steuerklasse III 20.000 Euro und nicht null', () => {
    // Nr. 6 ist weggefallen, Nr. 7 nennt für die übrigen Personen der
    // Steuerklasse III ausdrücklich 20.000 Euro.
    expect(FREIBETRAEGE.III).toBe(20000);
  });
});

describe('Steuersätze nach § 19 Abs. 1 ErbStG', () => {
  it('kennt genau drei Steuerklassen', () => {
    // Die Personengruppen I1 bis I4 unterscheiden sich nur im Freibetrag.
    // Eigene Satztabellen je Verwandtschaftsgrad kennt § 19 nicht.
    expect(Object.keys(STEUERSAETZE).sort()).toEqual(['I', 'II', 'III']);
  });

  it.each([
    [75000, 7, 15, 30],
    [300000, 11, 20, 30],
    [600000, 15, 25, 30],
    [6000000, 19, 30, 30],
    [13000000, 23, 35, 50],
    [26000000, 27, 40, 50],
  ])('bei einem Erwerb bis %i Euro: %i / %i / %i Prozent', (wert, i, ii, iii) => {
    expect(steuersatz('I', wert)).toBe(i);
    expect(steuersatz('II', wert)).toBe(ii);
    expect(steuersatz('III', wert)).toBe(iii);
  });

  it('wendet oberhalb von 26 Mio. Euro die Höchstsätze an', () => {
    expect(steuersatz('I', 26000001)).toBe(30);
    expect(steuersatz('II', 26000001)).toBe(43);
    expect(steuersatz('III', 26000001)).toBe(50);
  });

  it('rechnet "bis einschließlich", die Grenze gehört zur unteren Stufe', () => {
    expect(steuersatz('I', 75000)).toBe(7);
    expect(steuersatz('I', 75001)).toBe(11);
  });

  it('besteuert die Klasse III bis 6 Mio. Euro durchgehend mit 30 Prozent', () => {
    expect(steuersatz('III', 1)).toBe(30);
    expect(steuersatz('III', 6000000)).toBe(30);
    expect(steuersatz('III', 6000001)).toBe(50);
  });
});

describe('berechneErbschaftsteuer – Vollmengenstaffelung', () => {
  it('besteuert den gesamten Erwerb mit einem Satz, nicht stufenweise', () => {
    // Kind, 500.000 Euro: 500.000 − 400.000 = 100.000 steuerpflichtig.
    // 100.000 liegt in der Stufe "bis 300.000", Klasse I also 11 Prozent
    // auf den GESAMTEN Betrag: 11.000 Euro.
    // Eine Teilmengenstaffelung wie bei der Einkommensteuer ergäbe
    // 75.000 × 7 % + 25.000 × 11 % = 8.000 Euro und wäre zu niedrig.
    const r = berechneErbschaftsteuer({ nachlass: 500000, klasse: 'I2' });
    expect(r.zuVersteuern).toBe(100000);
    expect(r.satz).toBe(11);
    expect(r.steuer).toBe(11000);
  });

  it('rechnet für die Steuerklasse III mit 30 Prozent statt 43', () => {
    // 500.000 − 20.000 Freibetrag = 480.000, Stufe "bis 600.000" → 30 %.
    const r = berechneErbschaftsteuer({ nachlass: 500000, klasse: 'III' });
    expect(r.freibetrag).toBe(20000);
    expect(r.zuVersteuern).toBe(480000);
    expect(r.satz).toBe(30);
    expect(r.steuer).toBe(144000);
  });

  it('lässt den Erwerb des Ehegatten bis zum Freibetrag steuerfrei', () => {
    const r = berechneErbschaftsteuer({ nachlass: 500000, klasse: 'I1' });
    expect(r.zuVersteuern).toBe(0);
    expect(r.steuer).toBe(0);
    expect(r.effektiv).toBe('0.00');
  });

  it('weist den anwendbaren Satz aus, nicht den niedrigsten der Tabelle', () => {
    // 7.000.000 − 400.000 = 6.600.000 steuerpflichtig. Das liegt über der
    // Grenze von 6 Mio, also in der Stufe "bis 13.000.000" → 23 Prozent.
    const r = berechneErbschaftsteuer({ nachlass: 7000000, klasse: 'I2' });
    expect(r.satz).toBe(23);
  });
});

describe('Härteausgleich nach § 19 Abs. 3 ErbStG', () => {
  it('begrenzt den Sprung bei einem Satz bis 30 Prozent auf die Hälfte', () => {
    // Kind, 475.100 Euro → 75.100 steuerpflichtig, also 100 Euro über der
    // Wertgrenze von 75.000.
    //   regulär:            75.100 × 11 % = 8.261,00
    //   an der Wertgrenze:  75.000 ×  7 % = 5.250,00
    //   Unterschied:                        3.011,00
    //   erhebbar aus der Hälfte von 100:       50,00
    //   Steuer: 5.250 + 50 =                5.300,00
    const r = berechneErbschaftsteuer({ nachlass: 475100, klasse: 'I2' });
    expect(r.zuVersteuern).toBe(75100);
    expect(r.steuer).toBe(5300);
    expect(r.haerteausgleich).toBe(true);
  });

  it('begrenzt bei einem Satz über 30 Prozent auf drei Viertel', () => {
    // Klasse II, steuerpflichtig 6.000.100 (100 Euro über der Grenze).
    //   regulär:           6.000.100 × 35 % = 2.100.035,00
    //   an der Wertgrenze: 6.000.000 × 30 % = 1.800.000,00
    //   erhebbar aus drei Vierteln von 100:        75,00
    //   Steuer: 1.800.000 + 75 =              1.800.075,00
    const r = berechneErbschaftsteuer({ nachlass: 6020100, klasse: 'II' });
    expect(r.zuVersteuern).toBe(6000100);
    expect(r.steuer).toBe(1800075);
    expect(r.haerteausgleich).toBe(true);
  });

  it('greift nicht, wenn der reguläre Betrag ohnehin niedriger ist', () => {
    // 100.000 steuerpflichtig liegt weit in der Stufe; der Vergleichsbetrag
    // an der Wertgrenze plus der gedeckelte Unterschied übersteigt hier die
    // regulär berechnete Steuer, es bleibt bei 11 Prozent.
    const r = berechneErbschaftsteuer({ nachlass: 500000, klasse: 'I2' });
    expect(r.steuer).toBe(11000);
    expect(r.haerteausgleich).toBe(false);
  });

  it('lässt die Steuer über eine Wertgrenze hinweg nie sinken', () => {
    // Monotonie ist der eigentliche Zweck des § 19 Abs. 3: Ein Euro mehr
    // Erwerb darf nie zu weniger Nachlass nach Steuern führen.
    let vorher = -1;
    for (let stpfl = 74900; stpfl <= 75300; stpfl += 10) {
      const r = berechneErbschaftsteuer({ nachlass: stpfl + 400000, klasse: 'I2' });
      const nachSteuer = stpfl - r.steuer;
      expect(nachSteuer).toBeGreaterThanOrEqual(vorher);
      vorher = nachSteuer;
    }
  });
});

describe('Eingaben und Randfälle', () => {
  it('behandelt einen Nachlass von null', () => {
    const r = berechneErbschaftsteuer({ nachlass: 0, klasse: 'III' });
    expect(r.steuer).toBe(0);
    expect(r.effektiv).toBe('0.00');
  });

  it('wirft bei unbekannter Personengruppe statt still zu raten', () => {
    expect(() => berechneErbschaftsteuer({ nachlass: 100000, klasse: 'IV' })).toThrow();
  });

  it('behandelt fehlende und unsinnige Beträge als null', () => {
    expect(berechneErbschaftsteuer({ nachlass: undefined, klasse: 'I2' }).steuer).toBe(0);
    expect(berechneErbschaftsteuer({ nachlass: -50000, klasse: 'I2' }).steuer).toBe(0);
  });

  it('nennt zu jeder Personengruppe die Steuerklasse des § 15', () => {
    expect(PERSONENGRUPPEN.I1.klasse).toBe('I');
    expect(PERSONENGRUPPEN.I4.klasse).toBe('I');
    expect(PERSONENGRUPPEN.II.klasse).toBe('II');
    expect(PERSONENGRUPPEN.III.klasse).toBe('III');
  });

  it('weist den effektiven Satz bezogen auf den Nachlass aus', () => {
    const r = berechneErbschaftsteuer({ nachlass: 500000, klasse: 'III' });
    expect(r.effektiv).toBe('28.80'); // 144.000 / 500.000
  });
});
