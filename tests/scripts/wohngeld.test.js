import { describe, it, expect } from 'vitest';
import {
  WOHNGELD_FAKTOR,
  MEHRBETRAG_AB_13,
  MIETENSTUFEN,
  HOECHSTBETRAEGE,
  KOEFFIZIENTEN,
  MINDESTWERTE,
  HEIZKOSTENENTLASTUNG,
  KLIMAKOMPONENTE,
  ABZUGSPAUSCHALE,
  hoechstbetrag,
  klimakomponente,
  heizkostenentlastung,
  zuBeruecksichtigendeMiete,
  monatlichesGesamteinkommen,
  berechneWohngeld,
} from '../../public/scripts/wohngeld.js';

// Rechtsgrundlage durchgehend das Wohngeldgesetz in der Fassung der
// Dynamisierung zum 01.01.2025 (BGBl. 2024 I Nr. 314).
//
// Bis zum 11.08.2026 war an diesem Modul fast nichts richtig: Der Faktor 1,15
// aus § 19 Abs. 1 WoGG fehlte, die Koeffizienten a, b und c lagen um mehrere
// Größenordnungen daneben (a war 0,000006 statt 0,04), die Höchstbeträge
// stammten aus keiner erkennbaren Quelle, es gab sechs statt sieben
// Mietenstufen samt frei erfundener Korrekturfaktoren, und die
// Heizkostenentlastung wie die Klimakomponente fehlten ganz.

describe('Rechengrößen', () => {
  it('Faktor 1,15 in der Wohngeldformel (§ 19 Abs. 1 Satz 1 WoGG)', () => {
    expect(WOHNGELD_FAKTOR).toBe(1.15);
  });

  it('sieben Mietenstufen (§ 12 Abs. 5 WoGG)', () => {
    expect(MIETENSTUFEN).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('65 Euro je Haushaltsmitglied ab dem 13. (§ 19 Abs. 3 WoGG)', () => {
    expect(MEHRBETRAG_AB_13).toBe(65);
  });

  it('Abzugspauschale je 10 Prozent (§ 16 Satz 1 WoGG)', () => {
    expect(ABZUGSPAUSCHALE).toBe(0.1);
  });

  // Anlage 1 zum WoGG, Mietenstufe III.
  it('Höchstbeträge der Mietenstufe III (Anlage 1 zum WoGG)', () => {
    expect(HOECHSTBETRAEGE[3].betraege).toEqual([456, 551, 657, 766, 875]);
    expect(HOECHSTBETRAEGE[3].mehrbetrag).toBe(106);
  });

  it('Höchstbeträge der Mietenstufen I und VII (Anlage 1 zum WoGG)', () => {
    expect(HOECHSTBETRAEGE[1].betraege).toEqual([361, 437, 521, 608, 694]);
    expect(HOECHSTBETRAEGE[1].mehrbetrag).toBe(82);
    expect(HOECHSTBETRAEGE[7].betraege).toEqual([677, 820, 975, 1139, 1302]);
    expect(HOECHSTBETRAEGE[7].mehrbetrag).toBe(163);
  });

  // Anlage 2 zum WoGG. Der alte Wert für a bei einem Haushaltsmitglied war
  // 0,000006 statt 0,04 – Faktor 6.667 daneben.
  it('Koeffizienten a, b, c (Anlage 2 zum WoGG)', () => {
    expect(KOEFFIZIENTEN[1]).toEqual({ a: 0.04, b: 4.797e-4, c: 4.08e-5 });
    expect(KOEFFIZIENTEN[5]).toEqual({ a: 0, b: 1.907e-4, c: 1.72e-5 });
    expect(KOEFFIZIENTEN[12]).toEqual({ a: -0.12, b: 1.107e-4, c: 2.21e-5 });
  });

  it('Koeffizienten sind für 1 bis 12 Haushaltsmitglieder definiert', () => {
    for (let n = 1; n <= 12; n++) {
      expect(KOEFFIZIENTEN[n]).toBeDefined();
    }
    expect(KOEFFIZIENTEN[13]).toBeUndefined();
  });

  it('Mindestwerte für M und Y (Anlage 3 Nr. 1 zum WoGG)', () => {
    expect(MINDESTWERTE[1]).toEqual({ M: 54, Y: 396 });
    expect(MINDESTWERTE[12]).toEqual({ M: 298, Y: 2943 });
  });

  it('Heizkostenentlastung und Klimakomponente (§ 12 Abs. 6 und 7 WoGG)', () => {
    expect(HEIZKOSTENENTLASTUNG.betraege).toEqual([110.4, 142.6, 170.2, 197.8, 225.4]);
    expect(HEIZKOSTENENTLASTUNG.mehrbetrag).toBe(27.6);
    expect(KLIMAKOMPONENTE.betraege).toEqual([19.2, 24.8, 29.6, 34.4, 39.2]);
    expect(KLIMAKOMPONENTE.mehrbetrag).toBe(4.8);
  });
});

describe('hoechstbetrag (§ 12 Abs. 1 WoGG, Anlage 1)', () => {
  it('nimmt den Tabellenwert für bis zu fünf Haushaltsmitglieder', () => {
    expect(hoechstbetrag({ haushaltsgroesse: 1, mietenstufe: 3 })).toBe(456);
    expect(hoechstbetrag({ haushaltsgroesse: 5, mietenstufe: 3 })).toBe(875);
    expect(hoechstbetrag({ haushaltsgroesse: 4, mietenstufe: 7 })).toBe(1139);
  });

  it('addiert den Mehrbetrag ab dem sechsten Haushaltsmitglied', () => {
    expect(hoechstbetrag({ haushaltsgroesse: 6, mietenstufe: 3 })).toBe(875 + 106);
    expect(hoechstbetrag({ haushaltsgroesse: 8, mietenstufe: 3 })).toBe(875 + 3 * 106);
  });

  it('weist unbekannte Mietenstufen zurück', () => {
    expect(() => hoechstbetrag({ haushaltsgroesse: 1, mietenstufe: 8 })).toThrow();
    expect(() => hoechstbetrag({ haushaltsgroesse: 1, mietenstufe: 0 })).toThrow();
  });
});

describe('Zuschläge nach § 12 Abs. 6 und 7 WoGG', () => {
  it('nimmt den Tabellenwert bis fünf und den Mehrbetrag darüber', () => {
    expect(heizkostenentlastung(1)).toBeCloseTo(110.4, 2);
    expect(heizkostenentlastung(5)).toBeCloseTo(225.4, 2);
    expect(heizkostenentlastung(7)).toBeCloseTo(225.4 + 2 * 27.6, 2);
    expect(klimakomponente(1)).toBeCloseTo(19.2, 2);
    expect(klimakomponente(7)).toBeCloseTo(39.2 + 2 * 4.8, 2);
  });
});

describe('zuBeruecksichtigendeMiete (§ 11 Abs. 1 WoGG)', () => {
  // Die Miete wird auf Höchstbetrag plus Klimakomponente gedeckelt, danach
  // wird die Heizkostenentlastung hinzugerechnet – sie unterliegt dem Deckel
  // also nicht.
  it('deckelt auf Höchstbetrag plus Klimakomponente und addiert die Heizkostenentlastung', () => {
    const m = zuBeruecksichtigendeMiete({ kaltmiete: 500, haushaltsgroesse: 1, mietenstufe: 3 });
    expect(m).toBeCloseTo(456 + 19.2 + 110.4, 2);
  });

  it('lässt eine Miete unter dem Deckel ungekürzt', () => {
    const m = zuBeruecksichtigendeMiete({ kaltmiete: 300, haushaltsgroesse: 1, mietenstufe: 3 });
    expect(m).toBeCloseTo(300 + 110.4, 2);
  });
});

describe('monatlichesGesamteinkommen (§§ 13, 16 WoGG)', () => {
  // § 14 WoGG stellt auf die Einkünfte im Sinne des § 2 EStG ab, bei
  // Arbeitnehmern also nach Abzug des Arbeitnehmer-Pauschbetrags. Danach
  // greifen die drei Pauschalen des § 16 mit je 10 Prozent.
  it('zieht den Arbeitnehmer-Pauschbetrag und drei Mal 10 Prozent ab', () => {
    const y = monatlichesGesamteinkommen({ bruttoMonat: 1800 });
    expect(y).toBeCloseTo((1800 * 12 - 1230) * 0.7 / 12, 4);
  });

  it('zieht weniger ab, wenn keine Rentenversicherungsbeiträge anfallen', () => {
    const mitAllen = monatlichesGesamteinkommen({ bruttoMonat: 1800 });
    const ohneRente = monatlichesGesamteinkommen({ bruttoMonat: 1800, zahltRentenversicherung: false });
    expect(ohneRente).toBeGreaterThan(mitAllen);
    expect(ohneRente).toBeCloseTo((1800 * 12 - 1230) * 0.8 / 12, 4);
  });

  it('zieht ohne jede Pflichtabgabe nichts nach § 16 ab', () => {
    const y = monatlichesGesamteinkommen({
      bruttoMonat: 1800,
      zahltSteuern: false,
      zahltKrankenversicherung: false,
      zahltRentenversicherung: false,
    });
    expect(y).toBeCloseTo((1800 * 12 - 1230) / 12, 4);
  });

  // § 17 Nr. 3 WoGG.
  it('zieht den Freibetrag für Alleinerziehende ab', () => {
    const ohne = monatlichesGesamteinkommen({ bruttoMonat: 1800 });
    const mit = monatlichesGesamteinkommen({ bruttoMonat: 1800, alleinerziehendMitKind: true });
    expect(ohne - mit).toBeCloseTo(1320 / 12, 4);
  });

  it('wird nie negativ', () => {
    expect(monatlichesGesamteinkommen({ bruttoMonat: 0 })).toBe(0);
  });
});

describe('berechneWohngeld (§ 19 WoGG, Anlage 3)', () => {
  // Eine Person, Mietenstufe III, 500 Euro Kaltmiete, 1.800 Euro brutto:
  //   M = min(500; 456 + 19,20) + 110,40 = 585,60
  //   Y = (21.600 − 1.230) × 0,7 / 12    = 1.188,25
  //   z1 = 0,04 + 4,797E-4 · M + 4,080E-5 · Y = 0,3693929200
  //   z4 = 1,15 · (M − z1 · Y)                = 168,669192 → 169 Euro
  it('Einpersonenhaushalt, Mietenstufe III', () => {
    const r = berechneWohngeld({ haushaltsgroesse: 1, mietenstufe: 3, kaltmiete: 500, bruttoMonat: 1800 });
    expect(r.miete).toBeCloseTo(585.6, 2);
    expect(r.gesamteinkommen).toBeCloseTo(1188.25, 2);
    expect(r.wohngeld).toBe(169);
    expect(r.hatAnspruch).toBe(true);
  });

  it('Zweipersonenhaushalt, Mietenstufe III', () => {
    const r = berechneWohngeld({ haushaltsgroesse: 2, mietenstufe: 3, kaltmiete: 700, bruttoMonat: 2200 });
    expect(r.miete).toBeCloseTo(718.4, 2);
    expect(r.wohngeld).toBe(267);
  });

  it('Vierpersonenhaushalt, Mietenstufe VII', () => {
    const r = berechneWohngeld({ haushaltsgroesse: 4, mietenstufe: 7, kaltmiete: 1500, bruttoMonat: 3000 });
    expect(r.miete).toBeCloseTo(1371.2, 2);
    expect(r.wohngeld).toBe(778);
  });

  it('rundet nach Anlage 3 Nr. 3 auf volle Euro', () => {
    const r = berechneWohngeld({ haushaltsgroesse: 1, mietenstufe: 3, kaltmiete: 500, bruttoMonat: 1800 });
    expect(Number.isInteger(r.wohngeld)).toBe(true);
  });

  it('kein Anspruch, wenn die Formel null oder weniger ergibt', () => {
    const r = berechneWohngeld({ haushaltsgroesse: 1, mietenstufe: 3, kaltmiete: 500, bruttoMonat: 5000 });
    expect(r.wohngeld).toBe(0);
    expect(r.hatAnspruch).toBe(false);
  });

  // Anlage 3 Nr. 1: Werte unterhalb der Tabellenwerte werden ersetzt. Ohne
  // diese Ersetzung ergäbe ein sehr kleines Einkommen ein zu hohes Wohngeld.
  it('ersetzt zu kleine Werte für M und Y durch die Mindestwerte', () => {
    const r = berechneWohngeld({ haushaltsgroesse: 1, mietenstufe: 3, kaltmiete: 20, bruttoMonat: 0 });
    expect(r.gesamteinkommen).toBe(0);
    expect(r.angesetztesEinkommen).toBe(396);
    expect(r.angesetzteMiete).toBeCloseTo(130.4, 2);
  });

  // Der Sprung von zwölf auf dreizehn Haushaltsmitglieder ist größer als die
  // 65 Euro des § 19 Abs. 3, weil mit jedem Mitglied auch die zu
  // berücksichtigende Miete steigt: Höchstbetrag, Klimakomponente und
  // Heizkostenentlastung haben alle einen Mehrbetrag je weiterer Person.
  it('erhöht das Wohngeld ab dem 13. Haushaltsmitglied um mindestens 65 Euro', () => {
    const zwoelf = berechneWohngeld({ haushaltsgroesse: 12, mietenstufe: 3, kaltmiete: 1800, bruttoMonat: 3500 });
    const dreizehn = berechneWohngeld({ haushaltsgroesse: 13, mietenstufe: 3, kaltmiete: 1800, bruttoMonat: 3500 });
    expect(dreizehn.wohngeld - zwoelf.wohngeld).toBeGreaterThanOrEqual(MEHRBETRAG_AB_13);
  });

  // Absatz 3 erhöht "das nach den Absätzen 1 und 2 berechnete monatliche
  // Wohngeld". Ergibt die Formel nichts, gibt es auch nichts zu erhöhen.
  it('zahlt großen Haushalten ohne Anspruch dem Grunde nach kein Wohngeld', () => {
    const r = berechneWohngeld({ haushaltsgroesse: 14, mietenstufe: 3, kaltmiete: 1800, bruttoMonat: 20000 });
    expect(r.wohngeld).toBe(0);
    expect(r.hatAnspruch).toBe(false);
  });

  it('begrenzt das Wohngeld großer Haushalte auf die zu berücksichtigende Miete (§ 19 Abs. 3 WoGG)', () => {
    const r = berechneWohngeld({ haushaltsgroesse: 20, mietenstufe: 1, kaltmiete: 300, bruttoMonat: 0 });
    expect(r.wohngeld).toBeLessThanOrEqual(Math.round(r.angesetzteMiete));
  });

  it('steigt mit der Mietenstufe, weil der Höchstbetrag steigt', () => {
    const werte = MIETENSTUFEN.map(mietenstufe =>
      berechneWohngeld({ haushaltsgroesse: 1, mietenstufe, kaltmiete: 900, bruttoMonat: 1800 }).wohngeld);
    for (let i = 1; i < werte.length; i++) {
      expect(werte[i]).toBeGreaterThan(werte[i - 1]);
    }
  });

  it('sinkt mit steigendem Einkommen', () => {
    const niedrig = berechneWohngeld({ haushaltsgroesse: 2, mietenstufe: 4, kaltmiete: 700, bruttoMonat: 1600 });
    const hoch = berechneWohngeld({ haushaltsgroesse: 2, mietenstufe: 4, kaltmiete: 700, bruttoMonat: 2600 });
    expect(hoch.wohngeld).toBeLessThan(niedrig.wohngeld);
  });

  it('übersteigt nie die zu berücksichtigende Miete', () => {
    for (const bruttoMonat of [0, 900, 1500, 2400]) {
      const r = berechneWohngeld({ haushaltsgroesse: 3, mietenstufe: 5, kaltmiete: 1000, bruttoMonat });
      expect(r.wohngeld).toBeLessThanOrEqual(Math.ceil(r.miete));
    }
  });

  it('weist unbekannte Haushaltsgrößen zurück', () => {
    expect(() => berechneWohngeld({ haushaltsgroesse: 0, mietenstufe: 3, kaltmiete: 500, bruttoMonat: 1800 })).toThrow();
  });
});
