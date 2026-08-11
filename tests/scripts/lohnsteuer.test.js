import { describe, it, expect } from 'vitest';
import {
  ARBEITNEHMER_PAUSCHBETRAG,
  SONDERAUSGABEN_PAUSCHBETRAG,
  ENTLASTUNGSBETRAG_ALLEINERZIEHENDE,
  VORSORGEPAUSCHALE_HOECHSTBETRAG,
  SOLI_FREIGRENZE,
  SOLI_FREIGRENZE_SPLITTING,
  STEUERKLASSEN,
  vorsorgepauschale,
  zuVersteuernderJahresbetrag,
  jahreslohnsteuer,
  solidaritaetszuschlagJahr,
} from '../../public/scripts/lohnsteuer.js';
import { einkommensteuer } from '../../public/scripts/einkommensteuer.js';

// Rechtsgrundlage durchgehend § 39b Abs. 2 EStG. Bis zum 11.08.2026 rechnete
// brutto-netto.js den Grundfreibetrag zusätzlich vom Bruttolohn ab, obwohl der
// Tarif nach § 32a ihn bereits enthält, und zog die vollen Sozialabgaben statt
// der Vorsorgepauschale ab. Bei 3.000 € Brutto ergab das 61,58 € Lohnsteuer im
// Monat statt 298,00 € – nicht einmal ein Viertel.
describe('Pauschbeträge', () => {
  it('Arbeitnehmer-Pauschbetrag 1.230 € (§ 9a Satz 1 Nr. 1a EStG)', () => {
    expect(ARBEITNEHMER_PAUSCHBETRAG).toBe(1230);
  });

  it('Sonderausgaben-Pauschbetrag 36 € (§ 10c Satz 1 EStG)', () => {
    expect(SONDERAUSGABEN_PAUSCHBETRAG).toBe(36);
  });

  it('Entlastungsbetrag für Alleinerziehende 4.260 € (§ 24b Abs. 2 Satz 1 EStG)', () => {
    expect(ENTLASTUNGSBETRAG_ALLEINERZIEHENDE).toBe(4260);
  });

  it('Höchstbetrag für den Arbeitslosen-Teilbetrag 1.900 € (§ 39b Abs. 2 Satz 5 Nr. 3e EStG)', () => {
    expect(VORSORGEPAUSCHALE_HOECHSTBETRAG).toBe(1900);
  });

  it('Solidaritätszuschlag-Freigrenzen 20.350 € bzw. 40.700 € (§ 3 Abs. 3 SolzG 1995)', () => {
    expect(SOLI_FREIGRENZE).toBe(20350);
    expect(SOLI_FREIGRENZE_SPLITTING).toBe(40700);
  });
});

describe('vorsorgepauschale', () => {
  // 36.000 € Jahreslohn, ein Kind:
  //   a) Rente      36.000 × 9,30 %          = 3.348 €
  //   b) Kranken    36.000 × (7,0 % + 1,45 %) = 3.042 €
  //   c) Pflege     36.000 × 1,80 %          =   648 €
  //   e) Arbeitslos entfällt, weil b + c bereits über 1.900 € liegen
  it('Steuerklasse I, 36.000 € Jahreslohn, ein Kind', () => {
    expect(vorsorgepauschale({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 1 })).toBeCloseTo(7038, 2);
  });

  it('nimmt für die Krankenversicherung den ermäßigten Satz nach § 243 SGB V, nicht den allgemeinen', () => {
    const vp = vorsorgepauschale({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 1 });
    const mitAllgemeinem = 36000 * (0.093 + 0.073 + 0.0145 + 0.018);
    expect(vp).toBeLessThan(mitAllgemeinem);
    expect(vp).toBeCloseTo(36000 * (0.093 + 0.07 + 0.0145 + 0.018), 2);
  });

  it('setzt den Arbeitslosen-Teilbetrag nur an, solange Kranken und Pflege zusammen unter 1.900 € bleiben', () => {
    // 10.000 € Jahreslohn: b + c = 845 + 180 = 1.025 €, Rest bis 1.900 € = 875 €.
    // Der volle AV-Teilbetrag wäre 130 € und passt damit vollständig hinein.
    const klein = vorsorgepauschale({ jahresarbeitslohn: 10000, steuerklasse: 1, kinder: 1 });
    expect(klein).toBeCloseTo(10000 * (0.093 + 0.0845 + 0.018 + 0.013), 2);
  });

  it('lässt den Arbeitslosen-Teilbetrag in Steuerklasse VI ganz weg (§ 39b Abs. 2 Satz 5 Nr. 3e EStG: nur I bis V)', () => {
    const sk5 = vorsorgepauschale({ jahresarbeitslohn: 10000, steuerklasse: 5, kinder: 1 });
    const sk6 = vorsorgepauschale({ jahresarbeitslohn: 10000, steuerklasse: 6, kinder: 1 });
    expect(sk5 - sk6).toBeCloseTo(130, 2);
  });

  it('deckelt jeden Teilbetrag an seiner Beitragsbemessungsgrenze', () => {
    const hoch = vorsorgepauschale({ jahresarbeitslohn: 500000, steuerklasse: 1, kinder: 1 });
    expect(hoch).toBeCloseTo(101400 * 0.093 + 69750 * 0.0845 + 69750 * 0.018, 2);
  });

  it('rechnet für Kinderlose mit dem höheren Pflegesatz', () => {
    const ohne = vorsorgepauschale({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 0 });
    const mit = vorsorgepauschale({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 1 });
    expect(ohne - mit).toBeCloseTo(36000 * 0.006, 2);
  });

  it('kennt den sächsischen Sonderweg nicht – § 39b nennt den bundeseinheitlichen Satz', () => {
    const sn = vorsorgepauschale({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 1, bundesland: 'SN' });
    const nw = vorsorgepauschale({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 1, bundesland: 'NW' });
    expect(sn).toBeCloseTo(nw, 2);
  });
});

describe('zuVersteuernderJahresbetrag', () => {
  it('zieht bei 36.000 € in Steuerklasse I auf 27.696 € ab', () => {
    expect(zuVersteuernderJahresbetrag({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 1 })).toBeCloseTo(27696, 2);
  });

  it('zieht in Steuerklasse II zusätzlich den Entlastungsbetrag ab', () => {
    const sk1 = zuVersteuernderJahresbetrag({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 1 });
    const sk2 = zuVersteuernderJahresbetrag({ jahresarbeitslohn: 36000, steuerklasse: 2, kinder: 1 });
    expect(sk1 - sk2).toBeCloseTo(ENTLASTUNGSBETRAG_ALLEINERZIEHENDE, 2);
  });

  it('gewährt in Steuerklasse VI weder Arbeitnehmer- noch Sonderausgaben-Pauschbetrag', () => {
    const sk1 = zuVersteuernderJahresbetrag({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 1 });
    const sk6 = zuVersteuernderJahresbetrag({ jahresarbeitslohn: 36000, steuerklasse: 6, kinder: 1 });
    expect(sk6 - sk1).toBeCloseTo(ARBEITNEHMER_PAUSCHBETRAG + SONDERAUSGABEN_PAUSCHBETRAG, 2);
  });

  it('zieht den Grundfreibetrag nicht ab – der steckt bereits im Tarif nach § 32a EStG', () => {
    const zvjb = zuVersteuernderJahresbetrag({ jahresarbeitslohn: 36000, steuerklasse: 1, kinder: 1 });
    expect(zvjb).toBeGreaterThan(36000 - 12348);
  });

  it('wird nicht negativ', () => {
    expect(zuVersteuernderJahresbetrag({ jahresarbeitslohn: 500, steuerklasse: 1, kinder: 1 })).toBe(0);
  });
});

describe('jahreslohnsteuer', () => {
  it.each([
    [24000, 1, 1, 1093],
    [36000, 1, 1, 3576],
    [36000, 1, 0, 3517],
    [48000, 1, 1, 6382],
    [36000, 2, 1, 2441],
    [36000, 6, 1, 8062],
    [60000, 3, 2, 4954],
    [60000, 5, 1, 15801],
    [108000, 1, 1, 26729],
  ])('%i € Jahreslohn, Steuerklasse %i, %i Kind(er) → %i €', (lohn, sk, kinder, erwartet) => {
    expect(jahreslohnsteuer({ jahresarbeitslohn: lohn, steuerklasse: sk, kinder })).toBe(erwartet);
  });

  it('Steuerklasse III wendet den Splittingtarif an (§ 32a Abs. 5 EStG)', () => {
    const zvjb = zuVersteuernderJahresbetrag({ jahresarbeitslohn: 60000, steuerklasse: 3, kinder: 2 });
    expect(jahreslohnsteuer({ jahresarbeitslohn: 60000, steuerklasse: 3, kinder: 2 }))
      .toBe(2 * einkommensteuer(zvjb / 2));
  });

  it('Steuerklasse V liegt über Klasse IV, Klasse III darunter', () => {
    const arg = { jahresarbeitslohn: 60000, kinder: 1 };
    const sk3 = jahreslohnsteuer({ ...arg, steuerklasse: 3 });
    const sk4 = jahreslohnsteuer({ ...arg, steuerklasse: 4 });
    const sk5 = jahreslohnsteuer({ ...arg, steuerklasse: 5 });
    expect(sk3).toBeLessThan(sk4);
    expect(sk4).toBeLessThan(sk5);
  });

  it('Klassen I und IV sind identisch (§ 39b Abs. 2 Satz 6 EStG)', () => {
    const arg = { jahresarbeitslohn: 48000, kinder: 1 };
    expect(jahreslohnsteuer({ ...arg, steuerklasse: 1 })).toBe(jahreslohnsteuer({ ...arg, steuerklasse: 4 }));
  });

  it('hält in Klasse V die Mindestbelastung von 14 % ein', () => {
    const lohn = 15000;
    const zvjb = zuVersteuernderJahresbetrag({ jahresarbeitslohn: lohn, steuerklasse: 5, kinder: 1 });
    expect(jahreslohnsteuer({ jahresarbeitslohn: lohn, steuerklasse: 5, kinder: 1 }))
      .toBeGreaterThanOrEqual(Math.floor(0.14 * zvjb));
  });

  it('steigt in jeder Steuerklasse monoton mit dem Lohn', () => {
    for (const sk of STEUERKLASSEN) {
      let vorher = -1;
      for (let lohn = 0; lohn <= 300000; lohn += 2500) {
        const lst = jahreslohnsteuer({ jahresarbeitslohn: lohn, steuerklasse: sk, kinder: 1 });
        expect(lst, `Steuerklasse ${sk} bei ${lohn} €`).toBeGreaterThanOrEqual(vorher);
        vorher = lst;
      }
    }
  });

  it('bleibt in jeder Steuerklasse unter dem Bruttolohn', () => {
    for (const sk of STEUERKLASSEN) {
      for (const lohn of [12000, 36000, 90000, 300000]) {
        expect(jahreslohnsteuer({ jahresarbeitslohn: lohn, steuerklasse: sk, kinder: 1 })).toBeLessThan(lohn);
      }
    }
  });

  it('weist unbekannte Steuerklassen zurück', () => {
    expect(() => jahreslohnsteuer({ jahresarbeitslohn: 36000, steuerklasse: 7, kinder: 1 })).toThrow();
  });
});

describe('solidaritaetszuschlagJahr', () => {
  it('fällt bis zur Freigrenze von 20.350 € Lohnsteuer nicht an', () => {
    expect(solidaritaetszuschlagJahr(20350, 1)).toBe(0);
    expect(solidaritaetszuschlagJahr(20351, 1)).toBeGreaterThan(0);
  });

  it('nutzt in Steuerklasse III die doppelte Freigrenze', () => {
    expect(solidaritaetszuschlagJahr(40700, 3)).toBe(0);
    expect(solidaritaetszuschlagJahr(40701, 3)).toBeGreaterThan(0);
  });

  it('begrenzt in der Milderungszone auf 11,9 % des übersteigenden Betrags (§ 4 Satz 2 SolzG)', () => {
    expect(solidaritaetszuschlagJahr(21000, 1)).toBeCloseTo(0.119 * 650, 2);
  });

  it('erreicht bei hohen Einkommen die vollen 5,5 %', () => {
    expect(solidaritaetszuschlagJahr(100000, 1)).toBeCloseTo(5500, 2);
  });

  it('springt an der Freigrenze nicht (die Milderungszone schließt lückenlos an)', () => {
    expect(solidaritaetszuschlagJahr(20351, 1)).toBeLessThan(1);
  });
});
