import { describe, it, expect } from 'vitest';
import {
  SV_STAND,
  BBG_KV_PV_MONAT,
  BBG_KV_PV_JAHR,
  BBG_RV_AV_MONAT,
  BBG_RV_AV_JAHR,
  VERSICHERUNGSPFLICHTGRENZE_MONAT,
  BEITRAGSSAETZE,
  pflegeArbeitnehmerSatz,
  krankenkasseArbeitnehmerSatz,
  berechneSozialabgaben,
} from '../../public/scripts/sozialversicherung.js';

// Alle Werte aus der Sozialversicherungsrechengrößen-Verordnung 2026 und den
// Beitragssätzen des GKV-Spitzenverbands (Stand 1. Januar 2026). Vorher standen
// sie doppelt in brutto-netto.js und steuerklassen.js, beide mit veralteten
// Zahlen: BBG Rente 7.750 statt 8.450, BBG Kranken 5.712,50 statt 5.812,50,
// Zusatzbeitrag 1,1 statt 2,9 Prozent.
describe('Rechengrößen 2026', () => {
  it('trägt den Rechtsstand 2026', () => {
    expect(SV_STAND).toBe('2026-01-01');
  });

  it('Beitragsbemessungsgrenze Kranken- und Pflegeversicherung: 5.812,50 € im Monat', () => {
    expect(BBG_KV_PV_MONAT).toBe(5812.5);
    expect(BBG_KV_PV_JAHR).toBe(69750);
    expect(BBG_KV_PV_JAHR).toBe(BBG_KV_PV_MONAT * 12);
  });

  it('Beitragsbemessungsgrenze Renten- und Arbeitslosenversicherung: 8.450 € im Monat', () => {
    expect(BBG_RV_AV_MONAT).toBe(8450);
    expect(BBG_RV_AV_JAHR).toBe(101400);
    expect(BBG_RV_AV_JAHR).toBe(BBG_RV_AV_MONAT * 12);
  });

  it('Versicherungspflichtgrenze: 6.450 € im Monat', () => {
    expect(VERSICHERUNGSPFLICHTGRENZE_MONAT).toBe(6450);
  });

  it('Beitragssätze entsprechen den Gesetzen', () => {
    expect(BEITRAGSSAETZE.krankenversicherungAllgemein).toBe(0.146); // § 241 SGB V
    expect(BEITRAGSSAETZE.krankenversicherungErmaessigt).toBe(0.14); // § 243 SGB V
    expect(BEITRAGSSAETZE.zusatzbeitragDurchschnitt).toBe(0.029); // BMG-Bekanntmachung
    expect(BEITRAGSSAETZE.pflegeversicherung).toBe(0.036); // § 55 SGB XI i. V. m. PflegeBeitrAnpV
    expect(BEITRAGSSAETZE.pflegeZuschlagKinderlose).toBe(0.006); // § 55 Abs. 3 Satz 1 SGB XI
    expect(BEITRAGSSAETZE.pflegeAbschlagJeKind).toBe(0.0025); // § 55 Abs. 3 Satz 4 SGB XI
    expect(BEITRAGSSAETZE.rentenversicherung).toBe(0.186); // § 158 SGB VI
    expect(BEITRAGSSAETZE.arbeitslosenversicherung).toBe(0.026); // § 341 Abs. 2 SGB III
  });
});

describe('krankenkasseArbeitnehmerSatz', () => {
  it('halbiert allgemeinen Beitragssatz und Zusatzbeitrag: 8,75 %', () => {
    expect(krankenkasseArbeitnehmerSatz()).toBeCloseTo(0.0875, 6);
  });

  it('rechnet mit einem abweichenden Zusatzbeitrag der Krankenkasse', () => {
    expect(krankenkasseArbeitnehmerSatz(0.0439)).toBeCloseTo(0.073 + 0.02195, 6);
  });
});

describe('pflegeArbeitnehmerSatz', () => {
  // § 58 Abs. 1 SGB XI: hälftige Tragung; den Zuschlag für Kinderlose trägt der
  // Beschäftigte allein. Der Arbeitgeberanteil bleibt deshalb bei 1,8 %.
  it('mit einem Kind: 1,8 %', () => {
    expect(pflegeArbeitnehmerSatz({ kinder: 1 })).toBeCloseTo(0.018, 6);
  });

  it('kinderlos: 2,4 % – der Zuschlag trifft nur den Arbeitnehmer', () => {
    expect(pflegeArbeitnehmerSatz({ kinder: 0 })).toBeCloseTo(0.024, 6);
  });

  it.each([
    [2, 0.0155],
    [3, 0.013],
    [4, 0.0105],
    [5, 0.008],
  ])('%i Kinder unter 25: %f', (kinder, erwartet) => {
    expect(pflegeArbeitnehmerSatz({ kinder })).toBeCloseTo(erwartet, 6);
  });

  it('ab dem sechsten Kind sinkt der Satz nicht weiter', () => {
    expect(pflegeArbeitnehmerSatz({ kinder: 9 })).toBeCloseTo(pflegeArbeitnehmerSatz({ kinder: 5 }), 6);
  });

  // § 58 Abs. 3 SGB XI: In Sachsen trägt der Beschäftigte 1 Prozentpunkt allein,
  // weil dort kein Feiertag gestrichen wurde. Das ist der einzige echte
  // Bundesland-Unterschied – nicht die oft genannten "1,7 % oder 1,705 %".
  it('Sachsen mit einem Kind: 2,3 %', () => {
    expect(pflegeArbeitnehmerSatz({ kinder: 1, bundesland: 'SN' })).toBeCloseTo(0.023, 6);
  });

  it('Sachsen kinderlos: 2,9 %', () => {
    expect(pflegeArbeitnehmerSatz({ kinder: 0, bundesland: 'SN' })).toBeCloseTo(0.029, 6);
  });

  it('nur Sachsen weicht ab, kein anderes Bundesland', () => {
    const abweichend = Object.keys(BEITRAGSSAETZE) && ['BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'ST', 'SH', 'TH']
      .filter(bl => pflegeArbeitnehmerSatz({ kinder: 1, bundesland: bl }) !== 0.018);
    expect(abweichend).toEqual([]);
  });

  it('weist unbekannte Bundesland-Kürzel zurück', () => {
    expect(() => pflegeArbeitnehmerSatz({ kinder: 1, bundesland: 'sn' })).toThrow();
  });
});

describe('berechneSozialabgaben', () => {
  it('3.000 € brutto, ein Kind, Nordrhein-Westfalen', () => {
    const r = berechneSozialabgaben({ bruttoMonat: 3000, kinder: 1, bundesland: 'NW' });
    expect(r.krankenversicherung).toBeCloseTo(262.5, 2);
    expect(r.pflegeversicherung).toBeCloseTo(54.0, 2);
    expect(r.rentenversicherung).toBeCloseTo(279.0, 2);
    expect(r.arbeitslosenversicherung).toBeCloseTo(39.0, 2);
    expect(r.gesamt).toBeCloseTo(634.5, 2);
  });

  it('deckelt Kranken- und Pflegeversicherung bei 5.812,50 €', () => {
    const grenze = berechneSozialabgaben({ bruttoMonat: BBG_KV_PV_MONAT, kinder: 1, bundesland: 'NW' });
    const darueber = berechneSozialabgaben({ bruttoMonat: 20000, kinder: 1, bundesland: 'NW' });
    expect(darueber.krankenversicherung).toBeCloseTo(grenze.krankenversicherung, 2);
    expect(darueber.pflegeversicherung).toBeCloseTo(grenze.pflegeversicherung, 2);
  });

  it('deckelt Renten- und Arbeitslosenversicherung bei 8.450 €', () => {
    const grenze = berechneSozialabgaben({ bruttoMonat: BBG_RV_AV_MONAT, kinder: 1, bundesland: 'NW' });
    const darueber = berechneSozialabgaben({ bruttoMonat: 20000, kinder: 1, bundesland: 'NW' });
    expect(darueber.rentenversicherung).toBeCloseTo(grenze.rentenversicherung, 2);
    expect(darueber.arbeitslosenversicherung).toBeCloseTo(grenze.arbeitslosenversicherung, 2);
  });

  it('rechnet über der Kranken- aber unter der Rentengrenze getrennt', () => {
    const r = berechneSozialabgaben({ bruttoMonat: 7000, kinder: 1, bundesland: 'NW' });
    expect(r.krankenversicherung).toBeCloseTo(BBG_KV_PV_MONAT * 0.0875, 2);
    expect(r.rentenversicherung).toBeCloseTo(7000 * 0.093, 2);
  });

  it('Sachsen zahlt mehr Pflegeversicherung als Nordrhein-Westfalen', () => {
    const sn = berechneSozialabgaben({ bruttoMonat: 3000, kinder: 1, bundesland: 'SN' });
    const nw = berechneSozialabgaben({ bruttoMonat: 3000, kinder: 1, bundesland: 'NW' });
    expect(sn.pflegeversicherung).toBeCloseTo(69.0, 2);
    expect(sn.pflegeversicherung).toBeGreaterThan(nw.pflegeversicherung);
    expect(sn.krankenversicherung).toBeCloseTo(nw.krankenversicherung, 2);
  });

  it('bei 0 € Brutto fallen keine Beiträge an', () => {
    const r = berechneSozialabgaben({ bruttoMonat: 0, kinder: 1, bundesland: 'NW' });
    expect(r.gesamt).toBe(0);
  });
});
