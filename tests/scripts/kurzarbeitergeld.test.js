import { describe, it, expect } from 'vitest';
import {
  LEISTUNGSSATZ,
  LEISTUNGSSATZ_ERHOEHT,
  SOZIALVERSICHERUNGSPAUSCHALE,
  RUNDUNGSSTUFE,
  BEZUGSDAUER_MONATE,
  BEZUGSDAUER_MONATE_VERLAENGERT,
  MINDESTANTEIL_BETROFFENE,
  MINDEST_ENTGELTAUSFALL,
  rundeEntgelt,
  pauschaliertesNettoentgelt,
  berechneKurzarbeitergeld,
} from '../../public/scripts/kurzarbeitergeld.js';
import { jahreslohnsteuer, solidaritaetszuschlagJahr } from '../../public/scripts/lohnsteuer.js';

// Bis zum 11.08.2026 rechnete das Modul mit festen Nettoanteilen je Steuerklasse
// (0,698 für I, 0,778 für III …). Damit war das pauschalierte Nettoentgelt ein
// fester Prozentsatz des Bruttos und die Nettoentgeltdifferenz linear zum
// Arbeitsausfall. Die Lohnsteuer ist aber progressiv: Bei 3.500 € Brutto,
// Steuerklasse I und 50 % Ausfall kam so ein Kurzarbeitergeld von 732,90 €
// heraus statt der 620,90 €, die sich aus §§ 105, 106, 153 SGB III ergeben –
// 18 Prozent zu hoch.

describe('Rechengrößen', () => {
  it('Leistungssätze 60 % und 67 % (§ 105 SGB III)', () => {
    expect(LEISTUNGSSATZ).toBe(0.6);
    expect(LEISTUNGSSATZ_ERHOEHT).toBe(0.67);
  });

  it('Sozialversicherungspauschale 20 % (§ 153 Abs. 1 Satz 2 Nr. 1 SGB III)', () => {
    expect(SOZIALVERSICHERUNGSPAUSCHALE).toBe(0.2);
  });

  it('Soll- und Ist-Entgelt werden auf durch 20 teilbare Beträge gerundet (§ 106 Abs. 1 Satz 5 SGB III)', () => {
    expect(RUNDUNGSSTUFE).toBe(20);
  });

  it('Bezugsdauer 12 Monate (§ 104 Abs. 1 Satz 1 SGB III), 24 Monate nach der 4. KugBeV', () => {
    expect(BEZUGSDAUER_MONATE).toBe(12);
    expect(BEZUGSDAUER_MONATE_VERLAENGERT).toBe(24);
  });

  // Nicht 10 Prozent: Das war die bis 30.06.2022 befristete Absenkung nach
  // § 109 Abs. 5 Nr. 1 SGB III. Seither gilt wieder der gesetzliche Regelfall.
  it('mindestens ein Drittel der Beschäftigten, Entgeltausfall über 10 % (§ 96 Abs. 1 Satz 1 Nr. 4 SGB III)', () => {
    expect(MINDESTANTEIL_BETROFFENE).toBeCloseTo(1 / 3, 10);
    expect(MINDEST_ENTGELTAUSFALL).toBe(0.1);
  });
});

describe('rundeEntgelt (§ 106 Abs. 1 Satz 5 SGB III)', () => {
  it('rundet auf den nächsten durch 20 teilbaren Euro-Betrag', () => {
    expect(rundeEntgelt(3500)).toBe(3500);
    expect(rundeEntgelt(3505)).toBe(3500);
    expect(rundeEntgelt(3515)).toBe(3520);
    expect(rundeEntgelt(3499)).toBe(3500);
  });

  it('rundet null auf null und lässt keine negativen Entgelte zu', () => {
    expect(rundeEntgelt(0)).toBe(0);
    expect(rundeEntgelt(-500)).toBe(0);
  });
});

describe('pauschaliertesNettoentgelt (§ 153 SGB III)', () => {
  // 3.500 € im Monat, Steuerklasse I:
  //   Sozialversicherungspauschale 20 %          =  700,00 €
  //   Lohnsteuer 4.939 € im Jahr                 =  411,58 €
  //   Solidaritätszuschlag, unter der Freigrenze =    0,00 €
  //   3.500 − 700 − 411,58                       = 2.388,42 €
  it('3.500 € Steuerklasse I', () => {
    expect(pauschaliertesNettoentgelt({ entgeltMonat: 3500, steuerklasse: 1 })).toBeCloseTo(2388.42, 2);
  });

  it('1.750 € Steuerklasse I', () => {
    expect(pauschaliertesNettoentgelt({ entgeltMonat: 1750, steuerklasse: 1 })).toBeCloseTo(1353.58, 2);
  });

  it('3.500 € Steuerklasse III liegt über, Steuerklasse V unter Steuerklasse I', () => {
    const drei = pauschaliertesNettoentgelt({ entgeltMonat: 3500, steuerklasse: 3 });
    const eins = pauschaliertesNettoentgelt({ entgeltMonat: 3500, steuerklasse: 1 });
    const fuenf = pauschaliertesNettoentgelt({ entgeltMonat: 3500, steuerklasse: 5 });
    expect(drei).toBeCloseTo(2685.5, 2);
    expect(fuenf).toBeCloseTo(2012.17, 2);
    expect(drei).toBeGreaterThan(eins);
    expect(eins).toBeGreaterThan(fuenf);
  });

  it('setzt sich aus Entgelt minus 20 % minus Lohnsteuer minus Soli zusammen', () => {
    const entgeltMonat = 4200;
    const steuerklasse = 1;
    const lst = jahreslohnsteuer({ jahresarbeitslohn: entgeltMonat * 12, steuerklasse, kinder: 1 });
    const soli = solidaritaetszuschlagJahr(lst, steuerklasse);
    const erwartet = entgeltMonat * 0.8 - lst / 12 - soli / 12;
    expect(pauschaliertesNettoentgelt({ entgeltMonat, steuerklasse })).toBeCloseTo(erwartet, 2);
  });

  // § 153 Abs. 1 Satz 4 Nr. 3 SGB III verweist auf § 55 Abs. 1 Satz 1 SGB XI.
  // Das ist der Grundbeitragssatz ohne den Zuschlag für Kinderlose des
  // § 55 Abs. 3 SGB XI. Beim Lohnsteuerabzug selbst gilt nach § 39b Abs. 2
  // Satz 5 Nr. 3c EStG das Gegenteil – deshalb darf die Kinderzahl das
  // pauschalierte Nettoentgelt nicht beeinflussen.
  it('kennt keine Kinderzahl: der Pflegezuschlag für Kinderlose bleibt außer Betracht', () => {
    const netto = pauschaliertesNettoentgelt({ entgeltMonat: 3500, steuerklasse: 1 });
    const mitKinderangabe = pauschaliertesNettoentgelt({ entgeltMonat: 3500, steuerklasse: 1, kinder: 0 });
    expect(mitKinderangabe).toBe(netto);
  });

  it('ist bei null Entgelt null', () => {
    expect(pauschaliertesNettoentgelt({ entgeltMonat: 0, steuerklasse: 1 })).toBe(0);
  });

  it('wächst langsamer als das Bruttoentgelt, weil die Lohnsteuer progressiv ist', () => {
    const halb = pauschaliertesNettoentgelt({ entgeltMonat: 1750, steuerklasse: 1 });
    const voll = pauschaliertesNettoentgelt({ entgeltMonat: 3500, steuerklasse: 1 });
    expect(halb).toBeGreaterThan(voll / 2);
  });
});

describe('berechneKurzarbeitergeld', () => {
  it('voller Arbeitsausfall, 3.500 €, Steuerklasse I, ohne Kind', () => {
    const r = berechneKurzarbeitergeld({ sollEntgelt: 3500, ausfallProzent: 100, steuerklasse: 1 });
    expect(r.sollEntgelt).toBe(3500);
    expect(r.istEntgelt).toBe(0);
    expect(r.sollNetto).toBeCloseTo(2388.42, 2);
    expect(r.istNetto).toBe(0);
    expect(r.nettoentgeltdifferenz).toBeCloseTo(2388.42, 2);
    expect(r.leistungssatz).toBe(0.6);
    expect(r.kurzarbeitergeld).toBeCloseTo(1433.05, 2);
  });

  it('erhöhter Leistungssatz von 67 % mit Kind (§ 105 Nr. 1 i. V. m. § 149 Nr. 1 SGB III)', () => {
    const r = berechneKurzarbeitergeld({ sollEntgelt: 3500, ausfallProzent: 100, steuerklasse: 1, hatKind: true });
    expect(r.leistungssatz).toBe(0.67);
    expect(r.kurzarbeitergeld).toBeCloseTo(1600.24, 2);
  });

  // Der Kern des Modellfehlers: 50 % Ausfall halbiert die Nettoentgeltdifferenz
  // nicht, weil der Wegfall zuerst die hoch besteuerten Entgeltteile trifft.
  // Das Ist-Entgelt ist 1.760 € und nicht 1.750 €, weil § 106 Abs. 1 Satz 5
  // SGB III auf durch 20 teilbare Beträge runden lässt.
  // Die alte Tabelle fester Nettoanteile ergab hier 732,90 €.
  it('halber Arbeitsausfall ergibt weniger als das halbe Kurzarbeitergeld', () => {
    const halb = berechneKurzarbeitergeld({ sollEntgelt: 3500, ausfallProzent: 50, steuerklasse: 1 });
    const voll = berechneKurzarbeitergeld({ sollEntgelt: 3500, ausfallProzent: 100, steuerklasse: 1 });
    expect(halb.istEntgelt).toBe(1760);
    expect(halb.istNetto).toBeCloseTo(1359.92, 2);
    expect(halb.nettoentgeltdifferenz).toBeCloseTo(1028.5, 2);
    expect(halb.kurzarbeitergeld).toBeCloseTo(617.1, 2);
    expect(halb.kurzarbeitergeld).toBeLessThan(voll.kurzarbeitergeld / 2);
  });

  it('ohne Arbeitsausfall gibt es kein Kurzarbeitergeld', () => {
    const r = berechneKurzarbeitergeld({ sollEntgelt: 3500, ausfallProzent: 0, steuerklasse: 1 });
    expect(r.nettoentgeltdifferenz).toBe(0);
    expect(r.kurzarbeitergeld).toBe(0);
    expect(r.verlust).toBe(0);
  });

  it('rundet Soll- und Ist-Entgelt vor der Berechnung (§ 106 Abs. 1 Satz 5 SGB III)', () => {
    const r = berechneKurzarbeitergeld({ sollEntgelt: 3507, ausfallProzent: 50, steuerklasse: 1 });
    expect(r.sollEntgelt).toBe(3500);
    expect(r.istEntgelt).toBe(1760);
  });

  it('nimmt ein ausdrücklich angegebenes Ist-Entgelt statt der Ausfallquote', () => {
    const r = berechneKurzarbeitergeld({ sollEntgelt: 3500, istEntgelt: 1400, steuerklasse: 1 });
    expect(r.istEntgelt).toBe(1400);
    expect(r.ausfallProzent).toBeCloseTo(60, 6);
  });

  it('begrenzt das Ist-Entgelt auf das Soll-Entgelt', () => {
    const r = berechneKurzarbeitergeld({ sollEntgelt: 3500, istEntgelt: 5000, steuerklasse: 1 });
    expect(r.istEntgelt).toBe(3500);
    expect(r.kurzarbeitergeld).toBe(0);
  });

  it('Gesamtnetto und Einkommensverlust ergänzen sich zum Soll-Netto', () => {
    const r = berechneKurzarbeitergeld({ sollEntgelt: 4000, ausfallProzent: 40, steuerklasse: 4 });
    expect(r.gesamtNetto).toBeCloseTo(r.istNetto + r.kurzarbeitergeld, 2);
    expect(r.verlust).toBeCloseTo(r.sollNetto - r.gesamtNetto, 2);
    expect(r.verlust).toBeGreaterThan(0);
  });

  it('deckelt den Arbeitsausfall auf 0 bis 100 Prozent', () => {
    expect(berechneKurzarbeitergeld({ sollEntgelt: 3000, ausfallProzent: 140, steuerklasse: 1 }).istEntgelt).toBe(0);
    expect(berechneKurzarbeitergeld({ sollEntgelt: 3000, ausfallProzent: -20, steuerklasse: 1 }).istEntgelt).toBe(3000);
  });

  it('weist unbekannte Steuerklassen zurück', () => {
    expect(() => berechneKurzarbeitergeld({ sollEntgelt: 3000, steuerklasse: 7 })).toThrow();
  });

  it('das Kurzarbeitergeld ersetzt nie den vollen Nettoausfall', () => {
    for (const steuerklasse of [1, 2, 3, 4, 5, 6]) {
      const r = berechneKurzarbeitergeld({ sollEntgelt: 3500, ausfallProzent: 100, steuerklasse });
      expect(r.kurzarbeitergeld).toBeLessThan(r.sollNetto);
      expect(r.verlust).toBeGreaterThan(0);
    }
  });
});
