import { describe, it, expect } from 'vitest';
import {
  berechneBetreuungskosten,
  steuerNachTarif,
  ABZUGSQUOTE,
  HOECHSTBETRAG_JE_KIND,
  KOSTEN_BIS_ZUM_DECKEL,
} from '../../public/scripts/betreuungskosten.js';
import { einkommensteuer } from '../../public/scripts/einkommensteuer.js';

// Kinderbetreuungskosten nach Steuern: Arbeitgeberzuschuss nach § 3 Nr. 33 EStG,
// Sonderausgabenabzug nach § 10 Abs. 1 Nr. 5 EStG (80 %, hoechstens 4.800 € je
// Kind), Steuer nach § 32a EStG, bei Zusammenveranlagung im Splittingverfahren.
//
// Bis September 2026 testete diese Datei eine erfundene Gebuehrenformel
// (150 € Grundgebuehr, Faktoren fuer Stunden, Alter und Region). Eine
// bundesweite Formel fuer Elternbeitraege gibt es nicht (§ 90 SGB VIII).

const BASIS = { kinder: 1, beitragMonat: 350, zvE: 60000 };

describe('Konstanten aus § 10 Abs. 1 Nr. 5 EStG', () => {
  it('80 Prozent, hoechstens 4.800 € je Kind, Deckel ab 6.000 €', () => {
    expect(ABZUGSQUOTE).toBe(0.8);
    expect(HOECHSTBETRAG_JE_KIND).toBe(4800);
    expect(KOSTEN_BIS_ZUM_DECKEL).toBe(6000);
  });
});

describe('berechneBetreuungskosten – Grundfall', () => {
  it('ein Kind, 350 € im Monat, 60.000 € zvE', () => {
    const r = berechneBetreuungskosten(BASIS);
    expect(r.aufwand).toBe(4200);
    expect(r.zuschuss).toBe(0);
    expect(r.sonderausgaben).toBe(3360);
    expect(r.deckelErreicht).toBe(false);
    expect(r.steuerersparnis).toBe(1277);
    expect(r.nettokosten).toBe(2923);
    expect(r.entlastungsquote).toBe(30.4);
  });

  it('die Steuerersparnis ist die Tarifdifferenz, kein pauschaler Satz', () => {
    const r = berechneBetreuungskosten(BASIS);
    expect(r.steuerersparnis).toBe(einkommensteuer(60000) - einkommensteuer(60000 - 3360));
  });

  it('unter dem Grundfreibetrag spart der Abzug nichts', () => {
    const r = berechneBetreuungskosten({ ...BASIS, zvE: 12000 });
    expect(r.steuerersparnis).toBe(0);
    expect(r.nettokosten).toBe(4200);
  });
});

describe('Hoechstbetrag je Kind', () => {
  it('zwei Kinder zu 700 € – je 4.800 € abziehbar', () => {
    const r = berechneBetreuungskosten({ kinder: 2, beitragMonat: 700, zvE: 60000 });
    expect(r.aufwand).toBe(16800);
    expect(r.sonderausgaben).toBe(9600);
    expect(r.deckelErreicht).toBe(true);
    expect(r.steuerersparnis).toBe(3544);
    expect(r.nettokosten).toBe(13256);
  });

  it('Zusammenveranlagung rechnet im Splitting', () => {
    const r = berechneBetreuungskosten({ kinder: 2, beitragMonat: 600, zvE: 90000, zusammen: true });
    expect(r.sonderausgaben).toBe(9600);
    expect(r.steuerersparnis).toBe(3124);
    expect(r.nettokosten).toBe(11276);
    expect(steuerNachTarif(90000, true)).toBe(2 * einkommensteuer(45000));
  });
});

describe('Arbeitgeberzuschuss nach § 3 Nr. 33 EStG', () => {
  it('mindert die abziehbaren Aufwendungen – 1.200 € Zuschuss senken die Kosten nur um 839 €', () => {
    const ohne = berechneBetreuungskosten(BASIS);
    const mit = berechneBetreuungskosten({ ...BASIS, zuschussMonat: 100 });
    expect(mit.zuschuss).toBe(1200);
    expect(mit.eigen).toBe(3000);
    expect(mit.sonderausgaben).toBe(2400);
    expect(mit.steuerersparnis).toBe(916);
    expect(mit.nettokosten).toBe(2084);
    expect(ohne.nettokosten - mit.nettokosten).toBe(839);
  });

  it('ein Zuschuss ueber dem Beitrag wird auf den Beitrag begrenzt', () => {
    const r = berechneBetreuungskosten({ ...BASIS, zuschussMonat: 500 });
    expect(r.zuschuss).toBe(4200);
    expect(r.eigen).toBe(0);
    expect(r.sonderausgaben).toBe(0);
    expect(r.nettokosten).toBe(0);
  });
});

describe('Eingaben', () => {
  it('begrenzt die Monate auf zwoelf', () => {
    expect(berechneBetreuungskosten({ ...BASIS, monate: 15 }).aufwand).toBe(4200);
  });

  it('wird bei Unsinn nicht negativ', () => {
    const r = berechneBetreuungskosten({ kinder: -1, beitragMonat: -50, zvE: -1 });
    expect(r.aufwand).toBe(0);
    expect(r.nettokosten).toBe(0);
  });
});
