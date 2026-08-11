import { describe, it, expect } from 'vitest';
import {
  HOECHSTBETRAG,
  MINDESTBETRAG,
  SATZ_REGEL,
  SATZ_MIN,
  SATZ_MAX,
  GERINGVERDIENER_GRENZE,
  ABSENKUNGS_GRENZE,
  SATZ_SCHRITT,
  EINKOMMEN_SCHRITT,
  KAPPUNG_VORGEBURTLICH,
  SOZIALABGABEN_PAUSCHALEN,
  KIRCHENSTEUERSATZ,
  GESCHWISTERBONUS_SATZ,
  GESCHWISTERBONUS_MINDESTBETRAG,
  MEHRLINGSZUSCHLAG,
  EINKOMMENSGRENZE,
  BASISMONATE,
  PARTNERMONATE,
  PARTNERSCHAFTSBONUS_MONATE,
  BASISMONATE_FRUEHGEBURT,
  elterngeldNetto,
  ersatzrate,
  basiselterngeld,
  elterngeldPlus,
  berechneElterngeld,
} from '../../public/scripts/elterngeld.js';
import { ARBEITNEHMER_PAUSCHBETRAG } from '../../public/scripts/lohnsteuer.js';

// Rechtsgrundlage ist das BEEG, insbesondere §§ 1, 2, 2a bis 2f, 4, 4a und 4b.
//
// Bis zum 11.08.2026 bestand das Modul aus sieben Zeilen: 67 Prozent eines
// entgegengenommenen "Nettos", begrenzt auf 300 bis 1.800 Euro, Elterngeld Plus
// pauschal die Hälfte davon. Daran stimmte fast nichts:
//
// - § 2 Abs. 2 BEEG staffelt die Ersatzrate. Sie steigt unter 1.000 Euro auf bis
//   zu 100 Prozent und sinkt über 1.200 Euro auf bis zu 65 Prozent. Da sie den
//   Boden von 65 Prozent schon bei 1.240 Euro erreicht, sind 67 Prozent für
//   normale Einkommen schlicht der falsche Satz – 3 Prozent zu viel.
// - Das maßgebliche Einkommen ist nicht das gewöhnliche Netto, sondern das
//   Erwerbseinkommen nach §§ 2c bis 2f: Einnahmen abzüglich des anteiligen
//   Arbeitnehmer-Pauschbetrags, der Steuern nach dem Programmablaufplan und
//   pauschaler 21 Prozent Sozialabgaben.
// - Der Geschwisterbonus (§ 2a Abs. 1) und der Mehrlingszuschlag (§ 2a Abs. 4)
//   fehlten ganz.
// - Elterngeld Plus ist nach § 4a Abs. 2 Satz 2 BEEG höchstens die Hälfte des
//   Basiselterngeldes ohne Einkommen. Die Hälfte ist die Obergrenze, nicht der
//   Betrag; bei Teilzeit während des Bezugs liegt er darunter.

describe('Rechengrößen', () => {
  it('Höchst- und Mindestbetrag (§ 2 Abs. 1 Satz 2 und Abs. 4 Satz 1 BEEG)', () => {
    expect(HOECHSTBETRAG).toBe(1800);
    expect(MINDESTBETRAG).toBe(300);
  });

  it('Ersatzraten und ihre Staffelung (§ 2 Abs. 1 Satz 1 und Abs. 2 BEEG)', () => {
    expect(SATZ_REGEL).toBe(0.67);
    expect(SATZ_MIN).toBe(0.65);
    expect(SATZ_MAX).toBe(1);
    expect(GERINGVERDIENER_GRENZE).toBe(1000);
    expect(ABSENKUNGS_GRENZE).toBe(1200);
    expect(SATZ_SCHRITT).toBe(0.001);
    expect(EINKOMMEN_SCHRITT).toBe(2);
  });

  it('Kappung des vorgeburtlichen Einkommens (§ 2 Abs. 3 Satz 2 BEEG)', () => {
    expect(KAPPUNG_VORGEBURTLICH).toBe(2770);
  });

  // § 2f Abs. 1 Satz 2 BEEG. Pauschalen, keine echten Beitragssätze.
  it('Beitragssatzpauschalen für die Sozialabgaben (§ 2f Abs. 1 Satz 2 BEEG)', () => {
    expect(SOZIALABGABEN_PAUSCHALEN).toEqual({
      krankenPflege: 0.09,
      rente: 0.10,
      arbeitsfoerderung: 0.02,
    });
  });

  it('Kirchensteuersatz pauschal 8 Prozent (§ 2e Abs. 5 Satz 1 BEEG)', () => {
    expect(KIRCHENSTEUERSATZ).toBe(0.08);
  });

  it('Geschwisterbonus und Mehrlingszuschlag (§ 2a BEEG)', () => {
    expect(GESCHWISTERBONUS_SATZ).toBe(0.1);
    expect(GESCHWISTERBONUS_MINDESTBETRAG).toBe(75);
    expect(MEHRLINGSZUSCHLAG).toBe(300);
  });

  // Die Grenze lag früher bei 300.000, dann 250.000 und 200.000 Euro.
  it('Einkommensgrenze 175.000 Euro (§ 1 Abs. 8 BEEG)', () => {
    expect(EINKOMMENSGRENZE).toBe(175000);
  });

  it('Bezugsmonate (§ 4 Abs. 3 und 5, § 4b Abs. 2 BEEG)', () => {
    expect(BASISMONATE).toBe(12);
    expect(PARTNERMONATE).toBe(2);
    expect(PARTNERSCHAFTSBONUS_MONATE).toBe(4);
    expect(BASISMONATE_FRUEHGEBURT).toEqual([
      { wochenVorher: 6, monate: 13 },
      { wochenVorher: 8, monate: 14 },
      { wochenVorher: 12, monate: 15 },
      { wochenVorher: 16, monate: 16 },
    ]);
  });
});

describe('elterngeldNetto (§§ 2c, 2e, 2f BEEG)', () => {
  // 3.000 Euro Einnahmen, Steuerklasse I, ohne Kirchensteuer:
  //   Arbeitnehmer-Pauschbetrag je Monat  = 1.230 / 12 = 102,50
  //   Sozialabgabenpauschale 21 Prozent   = 630,00
  //   Steuern nach dem Programmablaufplan = 298,00
  //   Einkommen                           = 1.969,50
  it('zieht Pauschbetrag, Steuern und pauschale Sozialabgaben ab', () => {
    expect(elterngeldNetto({ einnahmenMonat: 3000, steuerklasse: 1 })).toBeCloseTo(1969.5, 2);
  });

  it('der anteilige Arbeitnehmer-Pauschbetrag wird abgezogen (§ 2c Abs. 1 Satz 1 BEEG)', () => {
    const ohnePauschbetrag = elterngeldNetto({ einnahmenMonat: 2000, steuerklasse: 1 })
      + ARBEITNEHMER_PAUSCHBETRAG / 12;
    expect(ohnePauschbetrag).toBeGreaterThan(elterngeldNetto({ einnahmenMonat: 2000, steuerklasse: 1 }));
  });

  it('die Steuerklasse verändert das Einkommen (§ 2e Abs. 3 BEEG)', () => {
    expect(elterngeldNetto({ einnahmenMonat: 3000, steuerklasse: 3 })).toBeCloseTo(2229.17, 2);
    expect(elterngeldNetto({ einnahmenMonat: 3000, steuerklasse: 3 }))
      .toBeGreaterThan(elterngeldNetto({ einnahmenMonat: 3000, steuerklasse: 1 }));
  });

  it('Kirchensteuer mindert das Einkommen (§ 2e Abs. 5 BEEG)', () => {
    const ohne = elterngeldNetto({ einnahmenMonat: 3000, steuerklasse: 1 });
    const mit = elterngeldNetto({ einnahmenMonat: 3000, steuerklasse: 1, kirchensteuer: true });
    expect(mit).toBeLessThan(ohne);
  });

  // § 2f Abs. 3 BEEG schließt andere Maßgaben zur Beitragsbemessung aus. Anders
  // als beim Leistungsentgelt des SGB III wirkt hier keine Bemessungsgrenze.
  it('die Sozialabgabenpauschale kennt keine Beitragsbemessungsgrenze (§ 2f Abs. 3 BEEG)', () => {
    const a = elterngeldNetto({ einnahmenMonat: 10000, steuerklasse: 1 });
    const b = elterngeldNetto({ einnahmenMonat: 20000, steuerklasse: 1 });
    // Der Sozialabgabenanteil wächst linear weiter: die Differenz der Abzüge
    // enthält volle 21 Prozent der zusätzlichen 10.000 Euro.
    expect((20000 - b) - (10000 - a)).toBeGreaterThan(10000 * 0.21);
  });

  it('ist bei null Einnahmen null und nie negativ', () => {
    expect(elterngeldNetto({ einnahmenMonat: 0, steuerklasse: 1 })).toBe(0);
    expect(elterngeldNetto({ einnahmenMonat: 50, steuerklasse: 1 })).toBe(0);
  });

  it('weist Steuerklasse VI zurück (§ 2e Abs. 3 Satz 1 Halbsatz 2 BEEG)', () => {
    expect(() => elterngeldNetto({ einnahmenMonat: 3000, steuerklasse: 6 })).toThrow();
  });
});

describe('ersatzrate (§ 2 Abs. 1 Satz 1 und Abs. 2 BEEG)', () => {
  it('zwischen 1.000 und 1.200 Euro sind es 67 Prozent', () => {
    expect(ersatzrate(1000)).toBeCloseTo(0.67, 10);
    expect(ersatzrate(1100)).toBeCloseTo(0.67, 10);
    expect(ersatzrate(1200)).toBeCloseTo(0.67, 10);
  });

  // Der entscheidende Fehler des alten Moduls: der Boden von 65 Prozent ist
  // schon bei 1.240 Euro erreicht, nicht erst bei sehr hohen Einkommen.
  it('sinkt über 1.200 Euro um 0,1 Punkte je 2 Euro auf 65 Prozent', () => {
    expect(ersatzrate(1202)).toBeCloseTo(0.669, 10);
    expect(ersatzrate(1220)).toBeCloseTo(0.66, 10);
    expect(ersatzrate(1239)).toBeCloseTo(0.651, 10);
    expect(ersatzrate(1240)).toBeCloseTo(0.65, 10);
    expect(ersatzrate(5000)).toBeCloseTo(0.65, 10);
  });

  it('steigt unter 1.000 Euro um 0,1 Punkte je 2 Euro auf bis zu 100 Prozent', () => {
    expect(ersatzrate(998)).toBeCloseTo(0.671, 10);
    expect(ersatzrate(900)).toBeCloseTo(0.72, 10);
    expect(ersatzrate(340)).toBeCloseTo(1, 10);
    expect(ersatzrate(100)).toBeCloseTo(1, 10);
  });

  it('rechnet in vollen Schritten von 2 Euro', () => {
    expect(ersatzrate(1203)).toBeCloseTo(ersatzrate(1202), 10);
    expect(ersatzrate(999)).toBeCloseTo(ersatzrate(1000), 10);
  });
});

describe('basiselterngeld (§§ 2, 2a BEEG)', () => {
  // 2.500 Euro Einnahmen, Steuerklasse I:
  //   Einkommen nach §§ 2c bis 2f = 1.681,33
  //   Ersatzrate                  = 65 Prozent
  //   Basiselterngeld             = 1.092,87
  it('2.500 Euro brutto, Steuerklasse I', () => {
    const r = basiselterngeld({ einnahmenMonat: 2500, steuerklasse: 1 });
    expect(r.einkommen).toBeCloseTo(1681.33, 2);
    expect(r.ersatzrate).toBeCloseTo(0.65, 10);
    expect(r.betrag).toBeCloseTo(1092.87, 2);
  });

  it('2.000 Euro brutto, Steuerklasse I', () => {
    expect(basiselterngeld({ einnahmenMonat: 2000, steuerklasse: 1 }).betrag)
      .toBeCloseTo(901.17, 2);
  });

  // Bei kleinem Einkommen greift die Anhebung nach § 2 Abs. 2 Satz 1.
  it('1.200 Euro brutto erhalten eine erhöhte Ersatzrate', () => {
    const r = basiselterngeld({ einnahmenMonat: 1200, steuerklasse: 1 });
    expect(r.einkommen).toBeCloseTo(845.5, 2);
    expect(r.ersatzrate).toBeCloseTo(0.747, 10);
    expect(r.betrag).toBeCloseTo(631.59, 2);
  });

  it('begrenzt auf den Höchstbetrag (§ 2 Abs. 1 Satz 2 BEEG)', () => {
    expect(basiselterngeld({ einnahmenMonat: 4500, steuerklasse: 1 }).betrag).toBe(1800);
    expect(basiselterngeld({ einnahmenMonat: 9000, steuerklasse: 1 }).betrag).toBe(1800);
  });

  it('zahlt mindestens den Mindestbetrag, auch ohne Einkommen (§ 2 Abs. 4 BEEG)', () => {
    expect(basiselterngeld({ einnahmenMonat: 0, steuerklasse: 1 }).betrag).toBe(300);
    expect(basiselterngeld({ einnahmenMonat: 400, steuerklasse: 1 }).betrag).toBe(300);
  });

  it('Geschwisterbonus 10 Prozent (§ 2a Abs. 1 Satz 1 BEEG)', () => {
    const r = basiselterngeld({ einnahmenMonat: 2500, steuerklasse: 1, geschwisterbonus: true });
    expect(r.geschwisterbonus).toBeCloseTo(109.29, 2);
    expect(r.betrag).toBeCloseTo(1202.16, 2);
  });

  it('der Geschwisterbonus beträgt mindestens 75 Euro', () => {
    const r = basiselterngeld({ einnahmenMonat: 0, steuerklasse: 1, geschwisterbonus: true });
    expect(r.geschwisterbonus).toBe(75);
    expect(r.betrag).toBe(375);
  });

  it('Mehrlingszuschlag je weiteres Kind (§ 2a Abs. 4 BEEG)', () => {
    expect(basiselterngeld({ einnahmenMonat: 2500, steuerklasse: 1, kinderZahl: 2 }).betrag)
      .toBeCloseTo(1392.87, 2);
    expect(basiselterngeld({ einnahmenMonat: 2500, steuerklasse: 1, kinderZahl: 3 }).betrag)
      .toBeCloseTo(1692.87, 2);
  });

  // § 2a Abs. 4 Satz 2 BEEG stellt das ausdrücklich klar.
  it('Mehrlingszuschlag und Geschwisterbonus schließen sich nicht aus', () => {
    const r = basiselterngeld({
      einnahmenMonat: 2500, steuerklasse: 1, kinderZahl: 2, geschwisterbonus: true,
    });
    expect(r.betrag).toBeCloseTo(1502.16, 2);
  });

  // Die Zuschläge treten neben den Höchstbetrag, sie werden nicht von ihm gekappt.
  it('die Zuschläge dürfen den Höchstbetrag überschreiten', () => {
    const r = basiselterngeld({ einnahmenMonat: 6000, steuerklasse: 1, kinderZahl: 2 });
    expect(r.betrag).toBe(2100);
  });

  // § 2 Abs. 3 BEEG: Einkommen während des Bezugs mindert nur den
  // Unterschiedsbetrag, es wird nicht vom Elterngeld abgezogen.
  it('rechnet bei Teilzeit während des Bezugs mit dem Unterschiedsbetrag', () => {
    const r = basiselterngeld({
      einnahmenMonat: 2500, steuerklasse: 1, einnahmenBezugMonat: 1200,
    });
    expect(r.einkommenBezug).toBeCloseTo(845.5, 2);
    expect(r.betrag).toBeCloseTo(543.29, 2);
  });

  it('die Ersatzrate richtet sich weiter nach dem Einkommen vor der Geburt', () => {
    const ohne = basiselterngeld({ einnahmenMonat: 2500, steuerklasse: 1 });
    const mit = basiselterngeld({ einnahmenMonat: 2500, steuerklasse: 1, einnahmenBezugMonat: 1200 });
    expect(mit.ersatzrate).toBeCloseTo(ohne.ersatzrate, 10);
  });

  // § 2 Abs. 3 Satz 2 BEEG.
  it('kappt das vorgeburtliche Einkommen beim Unterschiedsbetrag auf 2.770 Euro', () => {
    const a = basiselterngeld({ einnahmenMonat: 9000, steuerklasse: 1, einnahmenBezugMonat: 1200 });
    const b = basiselterngeld({ einnahmenMonat: 20000, steuerklasse: 1, einnahmenBezugMonat: 1200 });
    expect(a.betrag).toBeCloseTo(b.betrag, 2);
    expect(a.betrag).toBeCloseTo((KAPPUNG_VORGEBURTLICH - 845.5) * 0.65, 1);
  });

  it('Teilzeit über dem vorherigen Einkommen ergibt den Mindestbetrag', () => {
    const r = basiselterngeld({ einnahmenMonat: 2500, steuerklasse: 1, einnahmenBezugMonat: 4000 });
    expect(r.betrag).toBe(300);
  });
});

describe('elterngeldPlus (§ 4a Abs. 2 BEEG)', () => {
  // Ohne Einkommen während des Bezugs ist es genau die Hälfte.
  it('ohne Einkommen die Hälfte des Basiselterngeldes', () => {
    const basis = basiselterngeld({ einnahmenMonat: 2500, steuerklasse: 1 }).betrag;
    expect(basis).toBeCloseTo(1092.87, 2);
    // Auf Cent gerundet, damit die angezeigte Hälfte zum angezeigten
    // Basisbetrag passt: 1.092,87 / 2 = 546,435 -> 546,44.
    expect(elterngeldPlus({ einnahmenMonat: 2500, steuerklasse: 1 }).betrag).toBe(546.44);
  });

  // Der entscheidende Unterschied zum alten Modul: die Hälfte ist die
  // Obergrenze, nicht der Betrag.
  it('bei Teilzeit liegt es unter der Hälfte', () => {
    const r = elterngeldPlus({ einnahmenMonat: 2500, steuerklasse: 1, einnahmenBezugMonat: 1200 });
    expect(r.betrag).toBeCloseTo(543.29, 2);
    expect(r.betrag).toBeLessThan(1092.87 / 2 + 0.01);
  });

  it('deckelt auf die Hälfte des Basiselterngeldes ohne Einkommen', () => {
    const r = elterngeldPlus({ einnahmenMonat: 2500, steuerklasse: 1, einnahmenBezugMonat: 300 });
    expect(r.betrag).toBeCloseTo(546.44, 2);
    expect(r.istGedeckelt).toBe(true);
  });

  it('halbiert die Mindestbeträge (§ 4a Abs. 2 Satz 3 BEEG)', () => {
    expect(elterngeldPlus({ einnahmenMonat: 0, steuerklasse: 1 }).betrag).toBe(150);
    expect(elterngeldPlus({ einnahmenMonat: 0, steuerklasse: 1, geschwisterbonus: true }).betrag)
      .toBeCloseTo(187.5, 2);
    expect(elterngeldPlus({ einnahmenMonat: 0, steuerklasse: 1, kinderZahl: 2 }).betrag)
      .toBeCloseTo(300, 2);
  });
});

describe('berechneElterngeld', () => {
  it('gibt Basiselterngeld, Elterngeld Plus und die Bezugsmonate aus', () => {
    const r = berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 1 });
    expect(r.basiselterngeld).toBeCloseTo(1092.87, 2);
    expect(r.elterngeldPlus).toBeCloseTo(546.44, 2);
    expect(r.basismonate).toBe(12);
    expect(r.basismonateMitPartner).toBe(14);
  });

  // § 4 Abs. 3 Satz 3 BEEG: ein Basismonat lässt sich in zwei Plus-Monate tauschen.
  it('rechnet Basismonate in Elterngeld-Plus-Monate um', () => {
    const r = berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 1 });
    expect(r.plusmonateMitPartner).toBe(28);
  });

  // § 4 Abs. 5 BEEG.
  it('verlängert die Bezugsdauer bei Frühgeburten', () => {
    expect(berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 1, wochenVorTermin: 0 }).basismonate).toBe(12);
    expect(berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 1, wochenVorTermin: 6 }).basismonate).toBe(13);
    expect(berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 1, wochenVorTermin: 9 }).basismonate).toBe(14);
    expect(berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 1, wochenVorTermin: 16 }).basismonate).toBe(16);
  });

  // § 1 Abs. 8 BEEG.
  it('meldet den Wegfall des Anspruchs oberhalb der Einkommensgrenze', () => {
    expect(berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 1, zvE: 174000 }).hatAnspruch).toBe(true);
    const ohne = berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 1, zvE: 180000 });
    expect(ohne.hatAnspruch).toBe(false);
    expect(ohne.basiselterngeld).toBe(0);
    expect(ohne.elterngeldPlus).toBe(0);
  });

  it('der ausgewiesene Gesamtbetrag passt zum ausgewiesenen Monatsbetrag', () => {
    const r = berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 1 });
    expect(r.gesamtBasis).toBeCloseTo(r.basiselterngeld * r.basismonate, 2);
  });

  it('weist unbekannte Steuerklassen zurück', () => {
    expect(() => berechneElterngeld({ einnahmenMonat: 2500, steuerklasse: 9 })).toThrow();
  });
});
