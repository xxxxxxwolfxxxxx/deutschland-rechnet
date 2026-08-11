import { describe, it, expect } from 'vitest';
import {
  AKTUELLER_RENTENWERT,
  DURCHSCHNITTSENTGELT_VORLAEUFIG,
  MAX_ENTGELTPUNKTE_JAHR,
  FRUEHESTE_ALTERSRENTE_MONATE,
  regelaltersgrenzeMonate,
  altersgrenzeBesondersLangjaehrigMonate,
  entgeltpunkteAusJahresentgelt,
  zugangsfaktor,
  rentnerBeitraege,
} from '../../public/scripts/rentenwerte.js';

describe('Rechengrößen', () => {
  it('aktueller Rentenwert ab 1.7.2026 ist 42,52 € (§ 1 RWBestV 2026)', () => {
    expect(AKTUELLER_RENTENWERT).toBe(42.52);
  });

  it('vorläufiges Durchschnittsentgelt 2026 ist 51.944 € (§ 3 Abs. 2 SVBezGrV 2026)', () => {
    expect(DURCHSCHNITTSENTGELT_VORLAEUFIG).toBe(51944);
  });

  it('mehr als 1,9521 Entgeltpunkte sind in einem Jahr nicht erreichbar', () => {
    // Beitragsbemessungsgrenze 101.400 € geteilt durch 51.944 €
    expect(MAX_ENTGELTPUNKTE_JAHR).toBe(1.9521);
  });
});

describe('entgeltpunkteAusJahresentgelt', () => {
  it('Durchschnittsentgelt ergibt genau einen Entgeltpunkt (§ 63 Abs. 2 SGB VI)', () => {
    expect(entgeltpunkteAusJahresentgelt(51944)).toBe(1);
  });

  it('die Hälfte des Durchschnittsentgelts ergibt einen halben Entgeltpunkt', () => {
    expect(entgeltpunkteAusJahresentgelt(25972)).toBe(0.5);
  });

  it('rechnet auf vier Dezimalstellen (§ 121 Abs. 1 SGB VI)', () => {
    expect(entgeltpunkteAusJahresentgelt(45000)).toBe(0.8663);
  });

  it('kappt bei der Beitragsbemessungsgrenze (§ 157 SGB VI)', () => {
    // Beiträge werden nur bis 101.400 € erhoben, darüber entstehen keine Punkte
    expect(entgeltpunkteAusJahresentgelt(200000)).toBe(MAX_ENTGELTPUNKTE_JAHR);
    expect(entgeltpunkteAusJahresentgelt(101400)).toBe(MAX_ENTGELTPUNKTE_JAHR);
  });

  it('negatives oder fehlendes Entgelt ergibt null Punkte', () => {
    expect(entgeltpunkteAusJahresentgelt(-1000)).toBe(0);
    expect(entgeltpunkteAusJahresentgelt(undefined)).toBe(0);
  });
});

describe('regelaltersgrenzeMonate (§ 35 Satz 2, § 235 Abs. 2 SGB VI)', () => {
  it('Jahrgänge ab 1964 erreichen sie mit 67', () => {
    expect(regelaltersgrenzeMonate(1964)).toBe(67 * 12);
    expect(regelaltersgrenzeMonate(1980)).toBe(804);
  });

  it('Jahrgänge vor 1947 erreichen sie mit 65', () => {
    expect(regelaltersgrenzeMonate(1946)).toBe(65 * 12);
  });

  it('hebt die Grenze von 1947 bis 1958 um je einen Monat an', () => {
    expect(regelaltersgrenzeMonate(1947)).toBe(65 * 12 + 1);
    expect(regelaltersgrenzeMonate(1957)).toBe(65 * 12 + 11);
    expect(regelaltersgrenzeMonate(1958)).toBe(66 * 12);
  });

  it('hebt sie ab 1959 um je zwei Monate an', () => {
    expect(regelaltersgrenzeMonate(1959)).toBe(66 * 12 + 2);
    expect(regelaltersgrenzeMonate(1960)).toBe(66 * 12 + 4);
    expect(regelaltersgrenzeMonate(1963)).toBe(66 * 12 + 10);
  });
});

describe('altersgrenzeBesondersLangjaehrigMonate (§ 38, § 236b SGB VI)', () => {
  it('Jahrgänge ab 1964 erreichen sie mit 65', () => {
    expect(altersgrenzeBesondersLangjaehrigMonate(1980)).toBe(65 * 12);
  });

  it('Jahrgänge vor 1953 erreichen sie mit 63', () => {
    expect(altersgrenzeBesondersLangjaehrigMonate(1952)).toBe(63 * 12);
  });

  it('hebt sie von 1953 bis 1963 um je zwei Monate an', () => {
    expect(altersgrenzeBesondersLangjaehrigMonate(1953)).toBe(63 * 12 + 2);
    expect(altersgrenzeBesondersLangjaehrigMonate(1958)).toBe(64 * 12);
    expect(altersgrenzeBesondersLangjaehrigMonate(1963)).toBe(64 * 12 + 10);
  });

  it('liegt immer unter der Regelaltersgrenze desselben Jahrgangs', () => {
    for (let jahr = 1950; jahr <= 1990; jahr += 1) {
      expect(altersgrenzeBesondersLangjaehrigMonate(jahr)).toBeLessThan(regelaltersgrenzeMonate(jahr));
    }
  });
});

describe('zugangsfaktor (§ 77 Abs. 2 SGB VI)', () => {
  it('ist 1,0 bei Rentenbeginn mit der Regelaltersgrenze', () => {
    const r = zugangsfaktor({ geburtsjahr: 1980, rentenbeginnAlterMonate: 804 });
    expect(r.zugangsfaktor).toBe(1);
    expect(r.monateVorzeitig).toBe(0);
    expect(r.monateAufgeschoben).toBe(0);
  });

  it('mindert um 0,003 je Monat vorzeitiger Inanspruchnahme', () => {
    const r = zugangsfaktor({ geburtsjahr: 1980, rentenbeginnAlterMonate: 64 * 12 });
    expect(r.monateVorzeitig).toBe(36);
    expect(r.zugangsfaktor).toBe(0.892);
  });

  it('erhöht um 0,005 je Monat nach der Regelaltersgrenze', () => {
    const r = zugangsfaktor({ geburtsjahr: 1980, rentenbeginnAlterMonate: 69 * 12 });
    expect(r.monateAufgeschoben).toBe(24);
    expect(r.zugangsfaktor).toBe(1.12);
  });

  it('lässt eine Altersrente nicht vor 63 beginnen (§ 36 Satz 2 SGB VI)', () => {
    const r = zugangsfaktor({ geburtsjahr: 1980, rentenbeginnAlterMonate: 60 * 12 });
    expect(r.aufFruehestenBeginnAngehoben).toBe(true);
    expect(r.rentenbeginnAlterMonate).toBe(FRUEHESTE_ALTERSRENTE_MONATE);
    // 48 Monate vor der Regelaltersgrenze 67, das ist der höchstmögliche Abschlag
    expect(r.monateVorzeitig).toBe(48);
    expect(r.zugangsfaktor).toBe(0.856);
  });

  it('ist bei 45 Beitragsjahren ab der eigenen Altersgrenze abschlagsfrei (§ 236b SGB VI)', () => {
    const r = zugangsfaktor({ geburtsjahr: 1980, rentenbeginnAlterMonate: 65 * 12, wartezeit45: true });
    expect(r.zugangsfaktor).toBe(1);
    expect(r.monateVorzeitig).toBe(0);
  });

  it('rechnet vor der Altersgrenze für besonders langjährig Versicherte gegen die Regelaltersgrenze', () => {
    // Vor 65 gibt es die abschlagsfreie Rente nicht, dann bleibt nur § 36 mit Abschlag
    const r = zugangsfaktor({ geburtsjahr: 1980, rentenbeginnAlterMonate: 64 * 12, wartezeit45: true });
    expect(r.monateVorzeitig).toBe(36);
    expect(r.zugangsfaktor).toBe(0.892);
  });

  it('gibt bei 45 Beitragsjahren zwischen eigener Grenze und Regelaltersgrenze weder Ab- noch Zuschlag', () => {
    const r = zugangsfaktor({ geburtsjahr: 1980, rentenbeginnAlterMonate: 66 * 12, wartezeit45: true });
    expect(r.zugangsfaktor).toBe(1);
    expect(r.monateAufgeschoben).toBe(0);
  });
});

describe('rentnerBeitraege (§ 247, § 249a SGB V, § 59 SGB XI)', () => {
  it('zieht die Hälfte von allgemeinem Beitragssatz und Zusatzbeitrag ab', () => {
    // (14,6 % + 2,9 %) / 2 = 8,75 %
    const r = rentnerBeitraege({ bruttorente: 1000, elternteil: true });
    expect(r.krankenversicherung).toBe(87.5);
  });

  it('belastet den Rentner mit dem vollen Pflegebeitrag', () => {
    // § 59 Abs. 1 Satz 1 SGB XI: aus der Rente trägt das Mitglied allein, also 3,6 %
    const r = rentnerBeitraege({ bruttorente: 1000, elternteil: true });
    expect(r.pflegeversicherung).toBe(36);
    expect(r.netto).toBe(876.5);
  });

  it('erhöht den Pflegebeitrag für Kinderlose um 0,6 Punkte (§ 55 Abs. 3 SGB XI)', () => {
    const r = rentnerBeitraege({ bruttorente: 1000, elternteil: false });
    expect(r.pflegeversicherung).toBe(42);
    expect(r.netto).toBe(870.5);
  });

  it('rechnet mit dem Zusatzbeitrag der eigenen Kasse, wenn er angegeben ist', () => {
    const r = rentnerBeitraege({ bruttorente: 1000, elternteil: true, zusatzbeitrag: 0.019 });
    expect(r.krankenversicherung).toBe(82.5);
  });
});
