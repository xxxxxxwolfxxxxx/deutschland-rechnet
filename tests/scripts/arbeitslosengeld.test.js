import { describe, it, expect } from 'vitest';
import {
  LEISTUNGSSATZ,
  LEISTUNGSSATZ_ERHOEHT,
  TAGE_JE_MONAT,
  TAGE_JE_JAHR,
  ANSPRUCHSDAUER,
  ANSPRUCHSDAUER_KURZE_ANWARTSCHAFT,
  anspruchsdauer,
  bemessungsentgeltTag,
  berechneArbeitslosengeld,
} from '../../public/scripts/arbeitslosengeld.js';
import { leistungsentgeltTag } from '../../public/scripts/leistungsentgelt.js';
import { BBG_RV_AV_MONAT } from '../../public/scripts/sozialversicherung.js';

// Rechtsgrundlage sind §§ 147, 149, 151, 153 und 154 SGB III.
//
// Bis zum 11.08.2026 rechnete das Modul so: Bemessungsentgelt = Brutto minus
// Sozialabgaben, davon 60 Prozent. Das ist nicht die Rechnung des Gesetzes,
// und die Sozialabgaben waren zusätzlich mit den Gesamtbeitragssätzen statt
// den Arbeitnehmeranteilen angesetzt – 18,6 statt 9,3 Prozent Rente, 14,6
// statt 7,3 plus halbem Zusatzbeitrag, 2,6 statt 1,3 Prozent. Die Steuerklasse
// wurde entgegengenommen und ignoriert, obwohl § 153 Abs. 2 SGB III sie
// vorschreibt; die exportierten Faktoren SK_FAKTOREN waren toter Code.

describe('Rechengrößen', () => {
  it('Leistungssätze 60 % und 67 % (§ 149 SGB III)', () => {
    expect(LEISTUNGSSATZ).toBe(0.6);
    expect(LEISTUNGSSATZ_ERHOEHT).toBe(0.67);
  });

  it('ein voller Kalendermonat zählt 30 Tage (§ 154 Satz 2 SGB III)', () => {
    expect(TAGE_JE_MONAT).toBe(30);
    expect(TAGE_JE_JAHR).toBe(365);
  });

  // § 147 Abs. 2 SGB III.
  it('Anspruchsdauer nach Versicherungszeit und Lebensalter (§ 147 Abs. 2 SGB III)', () => {
    expect(ANSPRUCHSDAUER).toEqual([
      { versicherungsmonate: 12, mindestalter: 0, dauer: 6 },
      { versicherungsmonate: 16, mindestalter: 0, dauer: 8 },
      { versicherungsmonate: 20, mindestalter: 0, dauer: 10 },
      { versicherungsmonate: 24, mindestalter: 0, dauer: 12 },
      { versicherungsmonate: 30, mindestalter: 50, dauer: 15 },
      { versicherungsmonate: 36, mindestalter: 55, dauer: 18 },
      { versicherungsmonate: 48, mindestalter: 58, dauer: 24 },
    ]);
  });

  it('kurze Anwartschaftszeit nach § 147 Abs. 3 SGB III', () => {
    expect(ANSPRUCHSDAUER_KURZE_ANWARTSCHAFT).toEqual([
      { versicherungsmonate: 6, dauer: 3 },
      { versicherungsmonate: 8, dauer: 4 },
      { versicherungsmonate: 10, dauer: 5 },
    ]);
  });
});

describe('anspruchsdauer (§ 147 SGB III)', () => {
  it('12 Monate Versicherungszeit ergeben 6 Monate Anspruch', () => {
    expect(anspruchsdauer({ versicherungsmonate: 12, alter: 30 })).toBe(6);
  });

  it('24 Monate ergeben 12 Monate, unabhängig vom Alter', () => {
    expect(anspruchsdauer({ versicherungsmonate: 24, alter: 30 })).toBe(12);
    expect(anspruchsdauer({ versicherungsmonate: 29, alter: 60 })).toBe(12);
  });

  // Die längeren Stufen setzen beides voraus: Versicherungszeit und Alter.
  it('die Stufen ab 15 Monaten verlangen zusätzlich ein Mindestalter', () => {
    expect(anspruchsdauer({ versicherungsmonate: 30, alter: 49 })).toBe(12);
    expect(anspruchsdauer({ versicherungsmonate: 30, alter: 50 })).toBe(15);
    expect(anspruchsdauer({ versicherungsmonate: 48, alter: 57 })).toBe(18);
    expect(anspruchsdauer({ versicherungsmonate: 48, alter: 58 })).toBe(24);
  });

  it('unter 12 Monaten besteht ohne kurze Anwartschaftszeit kein Anspruch', () => {
    expect(anspruchsdauer({ versicherungsmonate: 11, alter: 40 })).toBe(0);
  });

  it('kurze Anwartschaftszeit gilt unabhängig vom Lebensalter (§ 147 Abs. 3 SGB III)', () => {
    expect(anspruchsdauer({ versicherungsmonate: 6, alter: 25, kurzeAnwartschaft: true })).toBe(3);
    expect(anspruchsdauer({ versicherungsmonate: 10, alter: 60, kurzeAnwartschaft: true })).toBe(5);
    expect(anspruchsdauer({ versicherungsmonate: 5, alter: 25, kurzeAnwartschaft: true })).toBe(0);
  });
});

describe('bemessungsentgeltTag (§ 151 Abs. 1 SGB III)', () => {
  it('legt das Monatsentgelt auf den Kalendertag um', () => {
    expect(bemessungsentgeltTag({ bruttoMonat: 3000 })).toBeCloseTo(3000 * 12 / 365, 6);
  });

  // § 151 Abs. 1 stellt auf das beitragspflichtige Arbeitsentgelt ab. Damit
  // wirkt die Beitragsbemessungsgrenze der Arbeitsförderung als Obergrenze.
  it('begrenzt auf die Beitragsbemessungsgrenze', () => {
    expect(bemessungsentgeltTag({ bruttoMonat: 12000 }))
      .toBeCloseTo(BBG_RV_AV_MONAT * 12 / 365, 6);
  });
});

describe('berechneArbeitslosengeld', () => {
  // 3.000 Euro brutto, Steuerklasse I, ohne Kind:
  //   Bemessungsentgelt je Tag = 3.000 × 12 / 365 = 98,6301
  //   Leistungsentgelt je Tag nach § 153 SGB III  = 69,1068
  //   Arbeitslosengeld je Tag = 60 % davon        = 41,4641
  //   im Monat mit 30 Tagen (§ 154 Satz 2)        = 1.243,92
  it('3.000 Euro brutto, Steuerklasse I, ohne Kind', () => {
    const r = berechneArbeitslosengeld({ bruttoMonat: 3000, steuerklasse: 1 });
    expect(r.bemessungsentgeltTag).toBeCloseTo(98.63, 2);
    expect(r.leistungsentgeltTag).toBeCloseTo(69.11, 2);
    expect(r.leistungssatz).toBe(0.6);
    expect(r.arbeitslosengeldTag).toBeCloseTo(41.46, 2);
    expect(r.arbeitslosengeldMonat).toBeCloseTo(1243.92, 2);
  });

  it('erhöhter Leistungssatz mit Kind (§ 149 Nr. 1 SGB III)', () => {
    const r = berechneArbeitslosengeld({ bruttoMonat: 3000, steuerklasse: 1, hatKind: true });
    expect(r.leistungssatz).toBe(0.67);
    expect(r.arbeitslosengeldMonat).toBeCloseTo(1389.05, 2);
  });

  it('Steuerklasse III, 5.000 Euro brutto', () => {
    const r = berechneArbeitslosengeld({ bruttoMonat: 5000, steuerklasse: 3 });
    expect(r.arbeitslosengeldMonat).toBeCloseTo(2124.79, 2);
  });

  // Der alte Rechner ignorierte die Steuerklasse vollständig.
  it('die Steuerklasse verändert das Ergebnis', () => {
    const werte = [1, 3, 5].map(steuerklasse =>
      berechneArbeitslosengeld({ bruttoMonat: 3500, steuerklasse }).arbeitslosengeldMonat);
    expect(werte[1]).toBeGreaterThan(werte[0]);
    expect(werte[0]).toBeGreaterThan(werte[2]);
  });

  it('begrenzt das Bemessungsentgelt auf die Beitragsbemessungsgrenze', () => {
    const anGrenze = berechneArbeitslosengeld({ bruttoMonat: BBG_RV_AV_MONAT, steuerklasse: 1 });
    const darueber = berechneArbeitslosengeld({ bruttoMonat: BBG_RV_AV_MONAT * 2, steuerklasse: 1 });
    expect(darueber.arbeitslosengeldMonat).toBeCloseTo(anGrenze.arbeitslosengeldMonat, 2);
  });

  it('leitet das Leistungsentgelt aus § 153 SGB III ab', () => {
    const r = berechneArbeitslosengeld({ bruttoMonat: 4200, steuerklasse: 4 });
    const erwartet = leistungsentgeltTag({
      bemessungsentgeltTag: 4200 * 12 / 365,
      steuerklasse: 4,
    });
    expect(r.leistungsentgeltTag).toBeCloseTo(erwartet, 2);
  });

  it('gibt die Anspruchsdauer und die Gesamtsumme aus', () => {
    const r = berechneArbeitslosengeld({
      bruttoMonat: 3000, steuerklasse: 1, versicherungsmonate: 24, alter: 40,
    });
    expect(r.anspruchsdauerMonate).toBe(12);
    expect(r.gesamtanspruch).toBeCloseTo(r.arbeitslosengeldMonat * 12, 2);
  });

  it('ohne Anwartschaftszeit gibt es keinen Anspruch', () => {
    const r = berechneArbeitslosengeld({
      bruttoMonat: 3000, steuerklasse: 1, versicherungsmonate: 8, alter: 30,
    });
    expect(r.anspruchsdauerMonate).toBe(0);
    expect(r.gesamtanspruch).toBe(0);
    expect(r.hatAnspruch).toBe(false);
  });

  it('ist bei null Brutto null', () => {
    const r = berechneArbeitslosengeld({ bruttoMonat: 0, steuerklasse: 1 });
    expect(r.arbeitslosengeldMonat).toBe(0);
  });

  it('bleibt immer unter dem bisherigen Bruttoentgelt', () => {
    for (const bruttoMonat of [1200, 2500, 4000, 7000]) {
      const r = berechneArbeitslosengeld({ bruttoMonat, steuerklasse: 1 });
      expect(r.arbeitslosengeldMonat).toBeLessThan(bruttoMonat);
    }
  });

  it('weist unbekannte Steuerklassen zurück', () => {
    expect(() => berechneArbeitslosengeld({ bruttoMonat: 3000, steuerklasse: 9 })).toThrow();
  });
});
