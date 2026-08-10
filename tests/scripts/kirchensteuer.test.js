import { describe, it, expect } from 'vitest';
import { berechneKirchensteuer, KIRCHENSTEUER_LAENDER, KAPPUNG_MIN, KAPPUNG_MAX } from '../../public/scripts/kirchensteuer.js';

describe('Kirchensteuersätze', () => {
  it('enthält alle 16 Bundesländer mit Name, Satz und Rechtsstand', () => {
    const laender = Object.values(KIRCHENSTEUER_LAENDER);
    expect(laender).toHaveLength(16);
    for (const land of laender) {
      expect(land.name).toBeTruthy();
      expect(typeof land.satz).toBe('number');
      expect(land.gueltigSeit).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  // Nur Bayern (Art. 8 BayKirchStG) und Baden-Württemberg erheben 8 %.
  // Die Seite behauptete bis 10.08.2026 in der Meta-Description, auch Hessen,
  // NRW, RP, Saarland, Sachsen, Sachsen-Anhalt und Thüringen lägen bei 8 %.
  it('Bayern und Baden-Württemberg: 8 %', () => {
    expect(KIRCHENSTEUER_LAENDER.BY.satz).toBe(0.08);
    expect(KIRCHENSTEUER_LAENDER.BW.satz).toBe(0.08);
  });

  it('alle übrigen 14 Bundesländer: 9 %', () => {
    const neunProzent = Object.entries(KIRCHENSTEUER_LAENDER)
      .filter(([kuerzel]) => kuerzel !== 'BY' && kuerzel !== 'BW');
    expect(neunProzent).toHaveLength(14);
    for (const [kuerzel, land] of neunProzent) {
      expect(land.satz, `${kuerzel} muss 9 % haben`).toBe(0.09);
    }
  });

  it('kennt nur die beiden Sätze 8 % und 9 %', () => {
    const saetze = new Set(Object.values(KIRCHENSTEUER_LAENDER).map(l => l.satz));
    expect([...saetze].sort()).toEqual([0.08, 0.09]);
  });
});

describe('Berechnung', () => {
  it('Nordrhein-Westfalen: 9 % auf 6.000 € Lohnsteuer = 540 €', () => {
    const r = berechneKirchensteuer({ lohnsteuerJahr: 6000, bundesland: 'NW', konfession: 'rk' });
    expect(r.kirchensteuerJahr).toBe(540);
    expect(r.kirchensteuerMonat).toBe(45);
    expect(r.satz).toBe(0.09);
  });

  it('Bayern: 8 % auf 6.000 € Lohnsteuer = 480 €', () => {
    const r = berechneKirchensteuer({ lohnsteuerJahr: 6000, bundesland: 'BY', konfession: 'rk' });
    expect(r.kirchensteuerJahr).toBe(480);
    expect(r.kirchensteuerMonat).toBe(40);
  });

  it('unterscheidet sich zwischen 8 %- und 9 %-Ländern um ein Neuntel', () => {
    const by = berechneKirchensteuer({ lohnsteuerJahr: 9000, bundesland: 'BY', konfession: 'rk' });
    const nw = berechneKirchensteuer({ lohnsteuerJahr: 9000, bundesland: 'NW', konfession: 'rk' });
    expect(by.kirchensteuerJahr / nw.kirchensteuerJahr).toBeCloseTo(8 / 9, 6);
  });

  it('Konfessionslose zahlen nichts', () => {
    const r = berechneKirchensteuer({ lohnsteuerJahr: 12000, bundesland: 'NW', konfession: 'keine' });
    expect(r.kirchensteuerJahr).toBe(0);
    expect(r.kirchensteuerMonat).toBe(0);
  });

  it('Monatswert ist ein Zwölftel des Jahreswerts', () => {
    const r = berechneKirchensteuer({ lohnsteuerJahr: 7777, bundesland: 'HE', konfession: 'ev' });
    expect(r.kirchensteuerMonat).toBeCloseTo(r.kirchensteuerJahr / 12, 2);
  });

  it('ohne Lohnsteuer fällt keine Kirchensteuer an', () => {
    const r = berechneKirchensteuer({ lohnsteuerJahr: 0, bundesland: 'NW', konfession: 'rk' });
    expect(r.kirchensteuerJahr).toBe(0);
  });

  it('behandelt negative Eingaben als 0', () => {
    const r = berechneKirchensteuer({ lohnsteuerJahr: -500, bundesland: 'NW', konfession: 'rk' });
    expect(r.kirchensteuerJahr).toBe(0);
  });

  it('fällt auf unbekanntes Bundesland nicht still zurück', () => {
    expect(() => berechneKirchensteuer({ lohnsteuerJahr: 6000, bundesland: 'XX', konfession: 'rk' }))
      .toThrow();
  });

  it('gibt den Namen des Bundeslandes zurück', () => {
    const r = berechneKirchensteuer({ lohnsteuerJahr: 6000, bundesland: 'MV', konfession: 'rk' });
    expect(r.bundeslandName).toBe('Mecklenburg-Vorpommern');
  });
});

describe('Kappungsregelung', () => {
  // Die Kappung bemisst sich nach dem zu versteuernden Einkommen, nicht nach
  // der Lohnsteuer. Ihr Satz unterscheidet sich je Landeskirche bzw. Bistum und
  // sie ist in mehreren Ländern antragsgebunden. Der Rechner kennt das zu
  // versteuernde Einkommen nicht und darf sie deshalb nicht selbst anwenden.
  it('wird nicht automatisch auf das Ergebnis angewendet', () => {
    const hoch = berechneKirchensteuer({ lohnsteuerJahr: 200000, bundesland: 'NW', konfession: 'rk' });
    expect(hoch.kirchensteuerJahr).toBe(18000);
  });

  it('nennt die Spannweite der Kappungssätze', () => {
    expect(KAPPUNG_MIN).toBe(0.0275);
    expect(KAPPUNG_MAX).toBe(0.04);
  });

  it('Bayern kennt keine Kappung, alle übrigen Länder schon', () => {
    expect(KIRCHENSTEUER_LAENDER.BY.kappungMoeglich).toBe(false);
    const mitKappung = Object.entries(KIRCHENSTEUER_LAENDER)
      .filter(([kuerzel]) => kuerzel !== 'BY');
    for (const [kuerzel, land] of mitKappung) {
      expect(land.kappungMoeglich, `${kuerzel}`).toBe(true);
    }
  });

  it('meldet je Bundesland, ob eine Kappung in Betracht kommt', () => {
    const by = berechneKirchensteuer({ lohnsteuerJahr: 200000, bundesland: 'BY', konfession: 'rk' });
    const nw = berechneKirchensteuer({ lohnsteuerJahr: 200000, bundesland: 'NW', konfession: 'rk' });
    expect(by.kappungMoeglich).toBe(false);
    expect(nw.kappungMoeglich).toBe(true);
  });
});
