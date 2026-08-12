import { describe, it, expect } from 'vitest';
import {
  gebuehrTabelleB,
  gebuehrB,
  berechneNotarUndGrundbuch,
} from '../../public/scripts/gnotkg.js';

// Sollwerte aus GNotKG Anlage 2 (Tabelle B), gezogen aus
// https://www.gesetze-im-internet.de/gnotkg/xml.zip am 12.08.2026.
describe('gebuehrTabelleB – Stützstellen aus Anlage 2', () => {
  const ANLAGE_2 = [
    [500, 15.0],
    [1000, 19.0],
    [1500, 23.0],
    [2000, 27.0],
    [10000, 75.0],
    [25000, 115.0],
    [50000, 165.0],
    [200000, 435.0],
    [230000, 485.0],
    [410000, 785.0],
    [550000, 1015.0],
    [800000, 1415.0],
    [1050000, 1815.0],
    [2100000, 3495.0],
    [2600000, 4295.0],
  ];

  it.each(ANLAGE_2)('Geschäftswert %i € ergibt %f €', (wert, gebuehr) => {
    expect(gebuehrTabelleB(wert)).toBe(gebuehr);
  });

  it('rechnet bis 500 € die Mindestgebühr von 15 € (§ 34 Abs. 2, Abs. 5 GNotKG)', () => {
    expect(gebuehrTabelleB(1)).toBe(15.0);
    expect(gebuehrTabelleB(500)).toBe(15.0);
  });

  it('springt erst beim angefangenen Betrag auf die nächste Stufe', () => {
    // 500 bis 2.000 €: je angefangene 500 € plus 4,00 €
    expect(gebuehrTabelleB(501)).toBe(19.0);
    expect(gebuehrTabelleB(1000)).toBe(19.0);
    expect(gebuehrTabelleB(1001)).toBe(23.0);
  });

  it('ist degressiv: der Gebührenanteil am Wert sinkt mit steigendem Wert', () => {
    const anteil = (wert) => gebuehrTabelleB(wert) / wert;
    expect(anteil(400000)).toBeLessThan(anteil(100000));
    expect(anteil(1000000)).toBeLessThan(anteil(400000));
  });

  it('rechnet über 500.000 € in 50.000er-Schritten weiter (§ 34 Abs. 2 GNotKG)', () => {
    // 500.000 € => 935 €; jede angefangenen 50.000 € kosten 80 € mehr.
    expect(gebuehrTabelleB(500000)).toBe(935.0);
    expect(gebuehrTabelleB(550000)).toBe(1015.0);
    expect(gebuehrTabelleB(600000)).toBe(1095.0);
  });

  it('behandelt einen Geschäftswert von 0 oder darunter als Mindestgebühr', () => {
    expect(gebuehrTabelleB(0)).toBe(15.0);
    expect(gebuehrTabelleB(-100)).toBe(15.0);
  });
});

describe('gebuehrB – Gebührensatz und Mindestbetrag', () => {
  it('multipliziert die volle Gebühr mit dem Gebührensatz', () => {
    expect(gebuehrB(400000, 2.0)).toBe(1570.0); // KV 21100
    expect(gebuehrB(400000, 0.5)).toBe(392.5); // KV 22110
    expect(gebuehrB(400000, 1.0)).toBe(785.0); // KV 14110
  });

  it('hebt auf den Mindestbetrag der Gebührenvorschrift an (KV 21100: 120 €)', () => {
    // 2,0 aus einem Geschäftswert von 500 € wären 30 € – KV 21100 nennt 120 €.
    expect(gebuehrB(500, 2.0, 120)).toBe(120.0);
  });

  it('hält den gesetzlichen Mindestbetrag von 15 € je Gebühr ein (§ 34 Abs. 5 GNotKG)', () => {
    // 0,5 aus 500 € wären rechnerisch 7,50 €.
    expect(gebuehrB(500, 0.5)).toBe(15.0);
    expect(gebuehrB(2000, 0.5)).toBe(15.0); // rechnerisch 13,50 €
    expect(gebuehrB(10000, 0.5)).toBe(37.5); // darüber wieder rechnerisch
  });

  it('lässt den Mindestbetrag unbeachtet, wenn die Gebühr darüber liegt', () => {
    expect(gebuehrB(400000, 2.0, 120)).toBe(1570.0);
  });

  it('rundet auf den nächstliegenden Cent (§ 34 Abs. 4 GNotKG)', () => {
    expect(gebuehrB(2000, 1.3)).toBe(35.1); // 27 × 1,3 = 35,10
  });
});

describe('berechneNotarUndGrundbuch – Zusammensetzung beim Immobilienkauf', () => {
  it('rechnet bei 400.000 € rund 3.980 € statt einer 2-%-Pauschale', () => {
    const r = berechneNotarUndGrundbuch(400000);
    // Notar: 2,0 (KV 21100) + 0,5 (KV 22110) + 0,5 (KV 22200) = 3,0 × 785 €
    expect(r.notarNetto).toBe(2355.0);
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
    expect(r.notarNetto).toBe(150.0);
    expect(r.umsatzsteuer).toBe(28.5);
    expect(r.notar).toBe(178.5);
    expect(r.grundbuch).toBe(30.0); // 15 € (KV 14150) + 15 € (KV 14110)
    expect(r.gesamt).toBe(208.5);
  });

  it('weist die Umsatzsteuer nur auf die Notarkosten aus, nicht auf das Grundbuch', () => {
    const r = berechneNotarUndGrundbuch(400000);
    expect(r.umsatzsteuer).toBe(Math.round(r.notarNetto * 0.19 * 100) / 100);
    expect(r.notar + r.grundbuch).toBe(r.gesamt);
  });
});
