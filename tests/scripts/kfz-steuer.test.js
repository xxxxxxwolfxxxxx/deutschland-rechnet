import { describe, it, expect } from 'vitest';
import {
  berechneKfzSteuer,
  HUBRAUMSATZ_AB_2009,
  CO2_STAFFEL_AB_2021,
  SCHADSTOFFSAETZE_VOR_2009,
  ELEKTRO_BEFREIUNG,
} from '../../public/scripts/kfz-steuer.js';

describe('Kfz-Steuer – Konstanten aus § 9 KraftStG', () => {
  it('kennt die Hubraumsätze des § 9 Abs. 1 Nr. 2 Buchst. b und c', () => {
    expect(HUBRAUMSATZ_AB_2009.benzin).toBe(2);
    expect(HUBRAUMSATZ_AB_2009.diesel).toBe(9.5);
  });

  it('bildet die sechs Emissionsklassen des § 9 Abs. 1 Nr. 2 Buchst. c ab', () => {
    expect(CO2_STAFFEL_AB_2021.map(s => [s.bis, s.satz])).toEqual([
      [115, 2.0], [135, 2.2], [155, 2.5], [175, 2.9], [195, 3.4], [Infinity, 4.0],
    ]);
  });

  it('kennt die fünf Schadstoffstufen des § 9 Abs. 1 Nr. 2 Buchst. a', () => {
    expect(SCHADSTOFFSAETZE_VOR_2009.euro3.diesel).toBe(15.44);
    expect(SCHADSTOFFSAETZE_VOR_2009.euro0.diesel).toBe(37.58);
  });

  it('kennt das Zulassungsfenster und die Höchstdauer des § 3d Abs. 1', () => {
    expect(ELEKTRO_BEFREIUNG.zulassungVon).toBe('2011-05-18');
    expect(ELEKTRO_BEFREIUNG.zulassungBis).toBe('2030-12-31');
    expect(ELEKTRO_BEFREIUNG.jahre).toBe(10);
    expect(ELEKTRO_BEFREIUNG.spaetestensBis).toBe('2035-12-31');
  });
});

describe('Pkw mit Erstzulassung ab 01.01.2021 – § 9 Abs. 1 Nr. 2 Buchst. c', () => {
  it('rechnet Hubraum plus gestaffelte CO2-Komponente', () => {
    // 14 x 2,00 = 28,00 Hubraum; (115-95) x 2,00 + (120-115) x 2,20 = 51,00
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1400, co2: 120, erstzulassung: '2023-05-01',
    });
    expect(r.hubraumanteil).toBe(28);
    expect(r.co2anteil).toBe(51);
    expect(r.jahressteuer).toBe(79);
  });

  it('staffelt über mehrere Emissionsklassen hinweg', () => {
    // 20 x 9,50 = 190,00; 40,00 + 44,00 + 15 x 2,50 = 121,50
    const r = berechneKfzSteuer({
      antrieb: 'diesel', hubraum: 1968, co2: 150, erstzulassung: '2022-03-15',
    });
    expect(r.co2anteil).toBe(121.5);
    expect(r.jahressteuer).toBe(311.5);
    expect(r.jahressteuerAbgerundet).toBe(311);
  });

  it('erreicht in der obersten Klasse 4,00 EUR je Gramm', () => {
    // bis 195 g: 40 + 44 + 50 + 58 + 68 = 260; (210-195) x 4,00 = 60
    const r = berechneKfzSteuer({
      antrieb: 'diesel', hubraum: 2993, co2: 210, erstzulassung: '2021-06-01',
    });
    expect(r.co2anteil).toBe(320);
    expect(r.jahressteuer).toBe(605);
  });

  it('lässt die CO2-Komponente bis 95 g/km entfallen', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 999, co2: 90, erstzulassung: '2021-01-01',
    });
    expect(r.co2anteil).toBe(0);
    expect(r.jahressteuer).toBe(20); // ceil(999/100) = 10 angefangene Hundert
  });

  it('rechnet an der Klassengrenze noch mit dem niedrigeren Satz', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 100, co2: 115, erstzulassung: '2021-01-01',
    });
    expect(r.co2anteil).toBe(40);
  });

  it('rundet den Hubraum auf angefangene 100 Kubikzentimeter auf', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1401, co2: 0, erstzulassung: '2021-01-01',
    });
    expect(r.hubraumanteil).toBe(30);
  });
});

describe('Pkw mit Erstzulassung 01.07.2009 bis 31.12.2020 – § 9 Abs. 1 Nr. 2 Buchst. b', () => {
  it('rechnet die CO2-Komponente flach mit 2,00 EUR je Gramm', () => {
    // Derselbe Wagen wie oben, nur älter: (120-95) x 2,00 = 50,00 statt 51,00
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1400, co2: 120, erstzulassung: '2015-03-01',
    });
    expect(r.co2anteil).toBe(50);
    expect(r.jahressteuer).toBe(78);
  });

  it('nutzt den Freibetrag von 120 g/km bis Ende 2011', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1400, co2: 120, erstzulassung: '2011-06-01',
    });
    expect(r.co2Freibetrag).toBe(120);
    expect(r.jahressteuer).toBe(28);
  });

  it('nutzt den Freibetrag von 110 g/km für 2012 und 2013', () => {
    // 16 x 9,50 = 152,00; (130-110) x 2,00 = 40,00
    const r = berechneKfzSteuer({
      antrieb: 'diesel', hubraum: 1600, co2: 130, erstzulassung: '2013-01-01',
    });
    expect(r.co2Freibetrag).toBe(110);
    expect(r.jahressteuer).toBe(192);
  });

  it('senkt den Freibetrag ab 2014 auf 95 g/km', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1000, co2: 120, erstzulassung: '2014-01-01',
    });
    expect(r.co2Freibetrag).toBe(95);
  });

  it('greift schon am 01.07.2009, nicht erst im Folgejahr', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1400, co2: 100, erstzulassung: '2009-07-01',
    });
    expect(r.rechtsgrundlage).toContain('Buchst. b');
    expect(r.co2Freibetrag).toBe(120);
  });
});

describe('Pkw mit Erstzulassung bis 30.06.2009 – § 9 Abs. 1 Nr. 2 Buchst. a', () => {
  it('bemisst nach Hubraum und Schadstoffklasse, ohne CO2-Komponente', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1600, co2: 180,
      erstzulassung: '2005-04-01', schadstoffklasse: 'euro3',
    });
    expect(r.hubraumanteil).toBe(108); // 16 x 6,75
    expect(r.co2anteil).toBe(0);
    expect(r.jahressteuer).toBe(108);
  });

  it('rechnet Euro 2 beim Diesel mit 16,05 EUR je 100 ccm', () => {
    const r = berechneKfzSteuer({
      antrieb: 'diesel', hubraum: 2500, erstzulassung: '2000-01-01', schadstoffklasse: 'euro2',
    });
    expect(r.jahressteuer).toBe(401.25);
    expect(r.jahressteuerAbgerundet).toBe(401);
  });

  it('rechnet einen Diesel ohne Schadstoffminderung mit 37,58 EUR je 100 ccm', () => {
    const r = berechneKfzSteuer({
      antrieb: 'diesel', hubraum: 1900, erstzulassung: '1995-01-01', schadstoffklasse: 'euro0',
    });
    expect(r.jahressteuer).toBe(714.02);
  });

  it('greift noch am 30.06.2009', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1600, erstzulassung: '2009-06-30', schadstoffklasse: 'euro3',
    });
    expect(r.rechtsgrundlage).toContain('Buchst. a');
  });
});

describe('Krafträder – § 9 Abs. 1 Nr. 1', () => {
  it('rechnet 1,84 EUR je angefangene 25 Kubikzentimeter', () => {
    const r = berechneKfzSteuer({
      fahrzeugart: 'kraftrad', hubraum: 800, erstzulassung: '2020-01-01',
    });
    expect(r.jahressteuer).toBe(58.88); // 32 x 1,84
    expect(r.jahressteuerAbgerundet).toBe(58);
  });

  it('kennt beim Kraftrad weder CO2-Komponente noch Schadstoffklasse', () => {
    const r = berechneKfzSteuer({
      fahrzeugart: 'kraftrad', hubraum: 125, co2: 90, erstzulassung: '2024-01-01',
    });
    expect(r.co2anteil).toBe(0);
    expect(r.jahressteuer).toBe(9.2);
  });
});

describe('Elektrofahrzeuge – § 3d und § 9 Abs. 2', () => {
  it('befreit zehn Jahre ab dem Tag der Erstzulassung', () => {
    const r = berechneKfzSteuer({
      antrieb: 'elektro', erstzulassung: '2024-03-01', gesamtgewicht: 2000,
      stichtag: '2026-08-14',
    });
    expect(r.steuerbefreit).toBe(true);
    expect(r.befreiungBis).toBe('2034-02-28');
    expect(r.jahressteuer).toBe(0);
  });

  it('kappt die Befreiung beim 31.12.2035', () => {
    const r = berechneKfzSteuer({
      antrieb: 'elektro', erstzulassung: '2030-12-31', gesamtgewicht: 2000,
      stichtag: '2031-01-01',
    });
    expect(r.befreiungBis).toBe('2035-12-31');
  });

  it('gewährt für Erstzulassungen nach dem 31.12.2030 keine Befreiung mehr', () => {
    const r = berechneKfzSteuer({
      antrieb: 'elektro', erstzulassung: '2031-01-01', gesamtgewicht: 2000,
      stichtag: '2031-06-01',
    });
    expect(r.steuerbefreit).toBe(false);
    expect(r.befreiungBis).toBe(null);
  });

  it('besteuert nach Ablauf der Befreiung das Gewicht mit halbem Satz', () => {
    // 10 x 11,25 = 112,50, davon 50 vom Hundert nach § 9 Abs. 2
    const r = berechneKfzSteuer({
      antrieb: 'elektro', erstzulassung: '2014-05-01', gesamtgewicht: 2000,
      stichtag: '2026-08-14',
    });
    expect(r.steuerbefreit).toBe(false);
    expect(r.gewichtsanteil).toBe(112.5);
    expect(r.jahressteuer).toBe(56.25);
    expect(r.jahressteuerAbgerundet).toBe(56);
  });

  it('staffelt das Gewicht oberhalb von 2.000 Kilogramm', () => {
    // 112,50 + ceil(100/200) x 12,02 = 124,52, halbiert 62,26
    const r = berechneKfzSteuer({
      antrieb: 'elektro', erstzulassung: '2014-05-01', gesamtgewicht: 2100,
      stichtag: '2026-08-14',
    });
    expect(r.gewichtsanteil).toBe(124.52);
    expect(r.jahressteuer).toBe(62.26);
  });

  it('bildet Fahrzeuge über 3,5 Tonnen nicht ab und sagt das', () => {
    const r = berechneKfzSteuer({
      antrieb: 'elektro', erstzulassung: '2014-05-01', gesamtgewicht: 4000,
      stichtag: '2026-08-14',
    });
    expect(r.jahressteuer).toBe(null);
    expect(r.hinweise.join(' ')).toContain('3.500');
  });

  it('kennt für Elektrofahrzeuge weder Hubraum- noch CO2-Anteil', () => {
    const r = berechneKfzSteuer({
      antrieb: 'elektro', hubraum: 1400, co2: 120, erstzulassung: '2014-05-01',
      gesamtgewicht: 2000, stichtag: '2026-08-14',
    });
    expect(r.hubraumanteil).toBe(0);
    expect(r.co2anteil).toBe(0);
  });
});

describe('Vergünstigungen für Schwerbehinderte – § 3a', () => {
  it('befreit bei Merkzeichen H, Bl oder aG vollständig', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1400, co2: 120, erstzulassung: '2023-05-01',
      ermaessigung: 'befreiung',
    });
    expect(r.jahressteuer).toBe(0);
  });

  it('halbiert bei orangefarbenem Flächenaufdruck', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1400, co2: 120, erstzulassung: '2023-05-01',
      ermaessigung: 'haelfte',
    });
    expect(r.jahressteuer).toBe(39.5);
    expect(r.jahressteuerAbgerundet).toBe(39);
  });
});

describe('Entrichtungszeiträume – § 11 Abs. 2 und Abs. 5', () => {
  it('lässt unterjährige Zahlung unterhalb von 500 EUR nicht zu', () => {
    const r = berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1400, co2: 120, erstzulassung: '2023-05-01',
    });
    expect(r.halbjaehrlich).toBe(null);
    expect(r.vierteljaehrlich).toBe(null);
  });

  it('erlaubt ab mehr als 500 EUR das Halbjahr mit 3 Prozent Aufgeld', () => {
    // 605,00 : 2 = 302,50, zuzüglich 3 % = 311,575, abgerundet 311
    const r = berechneKfzSteuer({
      antrieb: 'diesel', hubraum: 2993, co2: 210, erstzulassung: '2021-06-01',
    });
    expect(r.halbjaehrlich).toBe(311);
    expect(r.vierteljaehrlich).toBe(null);
  });

  it('erlaubt ab mehr als 1.000 EUR auch das Vierteljahr mit 6 Prozent Aufgeld', () => {
    // 380,00 + 680,00 = 1.060,00; 265,00 + 6 % = 280,90, abgerundet 280
    const r = berechneKfzSteuer({
      antrieb: 'diesel', hubraum: 4000, co2: 300, erstzulassung: '2021-06-01',
    });
    expect(r.jahressteuer).toBe(1060);
    expect(r.halbjaehrlich).toBe(545);
    expect(r.vierteljaehrlich).toBe(280);
  });

  it('rundet die zu entrichtende Steuer auf volle Euro nach unten ab', () => {
    const r = berechneKfzSteuer({
      antrieb: 'diesel', hubraum: 1900, erstzulassung: '1995-01-01', schadstoffklasse: 'euro0',
    });
    expect(r.jahressteuer).toBe(714.02);
    expect(r.jahressteuerAbgerundet).toBe(714);
  });
});

describe('Eingabeprüfung', () => {
  it('verlangt ein Erstzulassungsdatum', () => {
    expect(() => berechneKfzSteuer({ antrieb: 'benzin', hubraum: 1400 })).toThrow(/Erstzulassung/);
  });

  it('weist ein unbrauchbares Datum zurück', () => {
    expect(() => berechneKfzSteuer({
      antrieb: 'benzin', hubraum: 1400, erstzulassung: '01.05.2023',
    })).toThrow(/Erstzulassung/);
  });
});
