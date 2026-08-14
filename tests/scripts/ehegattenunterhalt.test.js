import { describe, it, expect } from 'vitest';
import {
  berechneEhegattenunterhalt,
  ERWERBSTAETIGENBONUS,
  SELBSTBEHALT_EHEGATTE,
  QUOTENUNTERHALT_HOECHSTBEDARF,
} from '../../public/scripts/ehegattenunterhalt.js';

describe('Ehegattenunterhalt – Konstanten 2026', () => {
  it('verwendet den Erwerbstätigenbonus von 1/10', () => {
    expect(ERWERBSTAETIGENBONUS).toBe(0.1);
  });

  it('kennt die Selbstbehalte gegenüber Ehegatten', () => {
    expect(SELBSTBEHALT_EHEGATTE.erwerbstaetig).toBe(1600);
    expect(SELBSTBEHALT_EHEGATTE.nichtErwerbstaetig).toBe(1475);
  });

  it('deckelt den Quotenunterhalt beim höchsten Tabelleneinkommen', () => {
    // 11.200 € × 9/10 ÷ 2 = 5.040 €
    expect(QUOTENUNTERHALT_HOECHSTBEDARF).toBe(5040);
  });
});

describe('berechneEhegattenunterhalt – Halbteilung mit Bonus', () => {
  it('teilt die Differenz der bonusbereinigten Erwerbseinkommen hälftig', () => {
    // 4.000 → 3.600, 1.500 → 1.350; Bedarf 2.475, davon eigenes Einkommen ab.
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 4000, einkommenBerechtigt: 1500,
    });
    expect(r.bedarf).toBe(2475);
    expect(r.unterhalt).toBe(1125);
  });

  it('entspricht bei beidseitigem Erwerbseinkommen 45 % der Differenz', () => {
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 4000, einkommenBerechtigt: 1500,
    });
    expect(r.unterhalt).toBe(0.45 * (4000 - 1500));
  });

  it('rechnet ohne eigenes Einkommen des Berechtigten', () => {
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 3000, einkommenBerechtigt: 0,
    });
    expect(r.unterhalt).toBe(1350);
  });

  it('gewährt den Bonus nur auf Erwerbseinkommen', () => {
    // Rente des Berechtigten wird ungekürzt angerechnet.
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 4000, einkommenBerechtigt: 1000,
      erwerbseinkommenBerechtigt: false,
    });
    expect(r.unterhalt).toBe(1300);
  });

  it('ergibt keinen Anspruch, wenn der Berechtigte mehr verdient', () => {
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 2000, einkommenBerechtigt: 4000,
    });
    expect(r.unterhalt).toBe(0);
  });
});

describe('berechneEhegattenunterhalt – Vorrang des Kindesunterhalts', () => {
  it('zieht den Zahlbetrag des Kindesunterhalts vorab ab', () => {
    // § 1609 BGB: Kinder gehen dem Ehegatten im Rang vor.
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 4000, einkommenBerechtigt: 1500, kindesunterhalt: 800,
    });
    expect(r.einkommenPflichtigNachKindesunterhalt).toBe(3200);
    expect(r.unterhalt).toBe(765);
  });

  it('senkt den Unterhalt gegenüber der Rechnung ohne Kinder', () => {
    const ohne = berechneEhegattenunterhalt({ einkommenPflichtig: 4000, einkommenBerechtigt: 1500 });
    const mit = berechneEhegattenunterhalt({ einkommenPflichtig: 4000, einkommenBerechtigt: 1500, kindesunterhalt: 800 });
    expect(mit.unterhalt).toBeLessThan(ohne.unterhalt);
  });
});

describe('berechneEhegattenunterhalt – Leistungsfähigkeit', () => {
  it('begrenzt auf das über dem Selbstbehalt liegende Einkommen', () => {
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 2000, einkommenBerechtigt: 0,
    });
    expect(r.bedarf).toBe(900);
    expect(r.unterhalt).toBe(400); // 2.000 − 1.600
    expect(r.mangelfall).toBe(true);
  });

  it('berücksichtigt bei der Leistungsfähigkeit keinen Bonus', () => {
    // Maßgeblich sind 2.000 € − 1.600 €, nicht 1.800 € − 1.600 €.
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 2000, einkommenBerechtigt: 0,
    });
    expect(r.leistungsfaehigkeit).toBe(400);
  });

  it('nutzt den niedrigeren Selbstbehalt für nicht Erwerbstätige', () => {
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 2000, einkommenBerechtigt: 0,
      erwerbseinkommenPflichtig: false,
    });
    expect(r.selbstbehalt).toBe(1475);
    expect(r.unterhalt).toBe(525);
  });

  it('ergibt keinen Unterhalt unterhalb des Selbstbehalts', () => {
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 1400, einkommenBerechtigt: 0,
    });
    expect(r.unterhalt).toBe(0);
    expect(r.mangelfall).toBe(true);
  });
});

describe('berechneEhegattenunterhalt – Grenze der Quotenberechnung', () => {
  it('deckelt den Bedarf und weist auf die konkrete Bedarfsberechnung hin', () => {
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 20000, einkommenBerechtigt: 0,
    });
    expect(r.bedarf).toBe(5040);
    expect(r.unterhalt).toBe(5040);
    expect(r.konkreteBedarfsberechnung).toBe(true);
  });

  it('rechnet unterhalb der Grenze ohne Deckelung', () => {
    const r = berechneEhegattenunterhalt({
      einkommenPflichtig: 6000, einkommenBerechtigt: 0,
    });
    expect(r.konkreteBedarfsberechnung).toBe(false);
    expect(r.unterhalt).toBe(2700);
  });
});
