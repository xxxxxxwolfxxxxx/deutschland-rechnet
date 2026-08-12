import { describe, it, expect } from 'vitest';
import {
  gebuehrTabelleB,
  gebuehrB,
  berechneNotarUndGrundbuch,
} from '../../public/scripts/gnotkg.js';

// Anlage 2 zu § 34 Abs. 3 GNotKG, Spalte "Tabelle B", vollständig übernommen
// aus https://www.gesetze-im-internet.de/gnotkg/ (Stand 06.05.2026).
// Das ist die amtliche Gebührentabelle bis 3 Mio. € Geschäftswert – jede Zeile
// ist ein Stützpunkt für die Staffelrechnung nach § 34 Abs. 2.
const ANLAGE_2_TABELLE_B = [
  [500, 15], [1000, 19], [1500, 23], [2000, 27], [3000, 33], [4000, 39],
  [5000, 45], [6000, 51], [7000, 57], [8000, 63], [9000, 69], [10000, 75],
  [13000, 83], [16000, 91], [19000, 99], [22000, 107], [25000, 115],
  [30000, 125], [35000, 135], [40000, 145], [45000, 155], [50000, 165],
  [65000, 192], [80000, 219], [95000, 246], [110000, 273], [125000, 300],
  [140000, 327], [155000, 354], [170000, 381], [185000, 408], [200000, 435],
  [230000, 485], [260000, 535], [290000, 585], [320000, 635], [350000, 685],
  [380000, 735], [410000, 785], [440000, 835], [470000, 885], [500000, 935],
  [550000, 1015], [600000, 1095], [650000, 1175], [700000, 1255],
  [750000, 1335], [800000, 1415], [850000, 1495], [900000, 1575],
  [950000, 1655], [1000000, 1735], [1050000, 1815], [1100000, 1895],
  [1150000, 1975], [1200000, 2055], [1250000, 2135], [1300000, 2215],
  [1350000, 2295], [1400000, 2375], [1450000, 2455], [1500000, 2535],
  [1550000, 2615], [1600000, 2695], [1650000, 2775], [1700000, 2855],
  [1750000, 2935], [1800000, 3015], [1850000, 3095], [1900000, 3175],
  [1950000, 3255], [2000000, 3335], [2050000, 3415], [2100000, 3495],
  [2150000, 3575], [2200000, 3655], [2250000, 3735], [2300000, 3815],
  [2350000, 3895], [2400000, 3975], [2450000, 4055], [2500000, 4135],
  [2550000, 4215], [2600000, 4295], [2650000, 4375], [2700000, 4455],
  [2750000, 4535], [2800000, 4615], [2850000, 4695], [2900000, 4775],
  [2950000, 4855], [3000000, 4935],
];

describe('gebuehrTabelleB – Anlage 2 GNotKG', () => {
  it.each(ANLAGE_2_TABELLE_B)('Geschäftswert bis %i € → %s €', (wert, gebuehr) => {
    expect(gebuehrTabelleB(wert)).toBe(gebuehr);
  });

  it('gilt für den ganzen Wertbereich einer Tabellenstufe, nicht nur für den Stufenwert', () => {
    // Anlage 2 nennt nur Obergrenzen. Ein Wert zwischen zwei Zeilen fällt auf
    // die nächsthöhere Zeile – § 34 Abs. 2 rechnet je *angefangenem* Betrag.
    expect(gebuehrTabelleB(2001)).toBe(33); // Zeile "3 000"
    expect(gebuehrTabelleB(2999)).toBe(33);
    expect(gebuehrTabelleB(200001)).toBe(485); // Zeile "230 000"
    expect(gebuehrTabelleB(1)).toBe(15); // Zeile "500"
  });

  it('springt erst beim angefangenen Betrag auf die nächste Stufe', () => {
    // 500 bis 2.000 €: je angefangene 500 € plus 4,00 €
    expect(gebuehrTabelleB(501)).toBe(19);
    expect(gebuehrTabelleB(1000)).toBe(19);
    expect(gebuehrTabelleB(1001)).toBe(23);
  });

  it('ist degressiv: der Gebührenanteil am Wert sinkt mit steigendem Wert', () => {
    const anteil = (wert) => gebuehrTabelleB(wert) / wert;
    expect(anteil(400000)).toBeLessThan(anteil(100000));
    expect(anteil(1000000)).toBeLessThan(anteil(400000));
  });
});

describe('gebuehrTabelleB – Stufen über 3 Mio. € (§ 34 Abs. 2 GNotKG)', () => {
  // Oberhalb von 3 Mio. € endet Anlage 2; es gilt nur noch die Staffel
  // aus § 34 Abs. 2. Ausgangspunkt ist jeweils der letzte belegte Stützpunkt.
  it('bis 5 Mio. €: je angefangene 50 000 € weitere 80 €', () => {
    expect(gebuehrTabelleB(5000000)).toBe(4935 + 40 * 80); // 8135
  });
  it('bis 10 Mio. €: je angefangene 200 000 € weitere 130 €', () => {
    expect(gebuehrTabelleB(10000000)).toBe(8135 + 25 * 130); // 11385
  });
  it('bis 20 Mio. €: je angefangene 250 000 € weitere 150 €', () => {
    expect(gebuehrTabelleB(20000000)).toBe(11385 + 40 * 150); // 17385
  });
  it('bis 30 Mio. €: je angefangene 500 000 € weitere 280 €', () => {
    expect(gebuehrTabelleB(30000000)).toBe(17385 + 20 * 280); // 22985
  });
  it('über 30 Mio. €: je angefangene 1 Mio. € weitere 120 €', () => {
    expect(gebuehrTabelleB(31000000)).toBe(22985 + 120);
    expect(gebuehrTabelleB(30000001)).toBe(22985 + 120);
  });
});

describe('gebuehrTabelleB – Randfälle', () => {
  it('Geschäftswert 0 oder negativ ergibt die Gebühr der untersten Stufe', () => {
    expect(gebuehrTabelleB(0)).toBe(15);
    expect(gebuehrTabelleB(-100)).toBe(15);
  });
  it('unbrauchbare Eingaben ergeben die Gebühr der untersten Stufe', () => {
    expect(gebuehrTabelleB(NaN)).toBe(15);
    expect(gebuehrTabelleB(undefined)).toBe(15);
  });
});

describe('gebuehrB – Gebührensatz auf die Tabellengebühr', () => {
  it('Satz 1,0 ist die volle Tabellengebühr', () => {
    expect(gebuehrB(200000, 1.0)).toBe(435);
  });
  it('Satz 0,5 halbiert die Tabellengebühr', () => {
    expect(gebuehrB(200000, 0.5)).toBe(217.5);
  });
  it('Satz 1,3 – Briefrecht nach KV 14120', () => {
    expect(gebuehrB(200000, 1.3)).toBe(565.5);
  });
  it('Satz 2,0 – Beurkundungsverfahren nach KV 21100', () => {
    expect(gebuehrB(200000, 2.0)).toBe(870);
  });
  it('rundet nach § 34 Abs. 4 auf den nächstliegenden Cent', () => {
    // 0,2 × 83 € = 16,60 €; 0,3 × 83 € = 24,90 €
    expect(gebuehrB(13000, 0.3, 0)).toBe(24.9);
    // 0,3 × 4935 € = 1480,50 €
    expect(gebuehrB(3000000, 0.3, 0)).toBe(1480.5);
    // Halbe Cent werden aufgerundet: 0,5 × 33 € = 16,50 €
    expect(gebuehrB(3000, 0.5, 0)).toBe(16.5);
  });
});

describe('gebuehrB – Mindest- und Höchstbeträge', () => {
  it('§ 34 Abs. 5: Mindestbetrag einer Gebühr ist 15 €', () => {
    expect(gebuehrB(500, 0.2)).toBe(15); // 0,2 × 15 € = 3 € → 15 €
    expect(gebuehrB(10000, 0.1)).toBe(15); // 0,1 × 75 € = 7,50 € → 15 €
  });
  it('ein höherer Mindestbetrag aus dem KV schlägt den gesetzlichen durch', () => {
    // KV 21100: 2,0 – mindestens 120,00 €
    expect(gebuehrB(1000, 2.0, 120)).toBe(120);
    // KV 21200: 1,0 – mindestens 60,00 €
    expect(gebuehrB(1000, 1.0, 60)).toBe(60);
    // KV 21201: 0,5 – mindestens 30,00 €
    expect(gebuehrB(1000, 0.5, 30)).toBe(30);
  });
  it('der Mindestbetrag greift nur, wenn die Wertgebühr darunter liegt', () => {
    expect(gebuehrB(200000, 2.0, 120)).toBe(870);
  });
  it('KV 25100 deckelt bei 70 € – Höchstbetrag als vierter Parameter', () => {
    // 0,2 – mindestens 20,00 €, höchstens 70,00 €
    expect(gebuehrB(1000, 0.2, 20, 70)).toBe(20); // 0,2 × 19 € = 3,80 €
    expect(gebuehrB(200000, 0.2, 20, 70)).toBe(70); // 0,2 × 435 € = 87 €
    expect(gebuehrB(50000, 0.2, 20, 70)).toBe(33); // 0,2 × 165 € = 33 €
  });
});

describe('berechneNotarUndGrundbuch – Zusammensetzung beim Immobilienkauf', () => {
  it('rechnet bei 400.000 € rund 3.980 € statt einer 2-%-Pauschale', () => {
    const r = berechneNotarUndGrundbuch(400000);
    // Notar: 2,0 (KV 21100) + 0,5 (KV 22110) + 0,5 (KV 22200) = 3,0 × 785 €
    expect(r.notarNetto).toBe(2355);
    expect(r.umsatzsteuer).toBe(447.45); // 19 % nach KV 32014
    expect(r.notar).toBe(2802.45);
    // Grundbuch: 0,5 (KV 14150) + 1,0 (KV 14110) = 1,5 × 785 €, ohne USt
    expect(r.grundbuch).toBe(1177.5);
    expect(r.gesamt).toBe(3979.95);
    // Eine Pauschale von 2 % hätte 8.000 € ergeben.
    expect(r.gesamt).toBeLessThan(400000 * 0.02);
  });

  it('bleibt degressiv: der Anteil am Kaufpreis sinkt mit dem Kaufpreis', () => {
    const anteil = (preis) => berechneNotarUndGrundbuch(preis).gesamt / preis;
    expect(anteil(1000000)).toBeLessThan(anteil(200000));
  });

  it('wendet die Mindestbeträge bei kleinen Kaufpreisen an', () => {
    const r = berechneNotarUndGrundbuch(500);
    // Beurkundung mindestens 120 € (KV 21100), Vollzug und Betreuung je
    // mindestens 15 € (§ 34 Abs. 5 GNotKG) statt rechnerisch 7,50 €.
    expect(r.notarNetto).toBe(150);
    expect(r.umsatzsteuer).toBe(28.5);
    expect(r.notar).toBe(178.5);
    expect(r.grundbuch).toBe(30); // 15 € (KV 14150) + 15 € (KV 14110)
    expect(r.gesamt).toBe(208.5);
  });

  it('weist die Umsatzsteuer nur auf die Notarkosten aus, nicht auf das Grundbuch', () => {
    const r = berechneNotarUndGrundbuch(400000);
    expect(r.umsatzsteuer).toBe(Math.round(r.notarNetto * 0.19 * 100) / 100);
    expect(r.notar + r.grundbuch).toBe(r.gesamt);
  });
});
