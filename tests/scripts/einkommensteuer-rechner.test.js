import { describe, it, expect } from 'vitest';
import {
  TARIFE,
  GRENZSATZ_SCHRITT,
  berechneEinkommensteuer,
} from '../../public/scripts/einkommensteuer-rechner.js';
import { einkommensteuer } from '../../public/scripts/einkommensteuer.js';
import { solidaritaetszuschlag, SOLI_FREIGRENZE, SOLI_FREIGRENZE_SPLITTING } from '../../public/scripts/lohnsteuer.js';
import { KINDERGELD_MONAT, KINDERFREIBETRAG_JE_ELTERNTEIL, BEA_FREIBETRAG_JE_ELTERNTEIL } from '../../public/scripts/kindergeld.js';

const FREIBETRAG_EINZELN = KINDERFREIBETRAG_JE_ELTERNTEIL + BEA_FREIBETRAG_JE_ELTERNTEIL; // 4.878 €

describe('Tarife', () => {
  it('kennt Grundtarif, Zusammenveranlagung und Witwensplitting', () => {
    expect(Object.keys(TARIFE)).toEqual(['grund', 'zusammen', 'witwe']);
    expect(TARIFE.grund.splitting).toBe(false);
    expect(TARIFE.zusammen.splitting).toBe(true);
    expect(TARIFE.witwe.splitting).toBe(true);
  });

  it('verdoppelt die Kinderfreibeträge nur bei Zusammenveranlagung (§ 32 Abs. 6 Satz 2 EStG)', () => {
    expect(TARIFE.grund.zusammenveranlagt).toBe(false);
    expect(TARIFE.zusammen.zusammenveranlagt).toBe(true);
    expect(TARIFE.witwe.zusammenveranlagt).toBe(false);
  });

  it('wirft bei unbekanntem Tarif', () => {
    expect(() => berechneEinkommensteuer({ einkommen: 40000, tarif: 'klasse3' })).toThrow();
  });
});

describe('Einkommensteuer ohne Kinder', () => {
  it('rechnet den Grundtarif auf das zu versteuernde Einkommen', () => {
    const r = berechneEinkommensteuer({ einkommen: 30000 });
    expect(r.zvE).toBe(30000);
    expect(r.tariflicheSteuer).toBe(4217);
    expect(r.einkommensteuer).toBe(4217);
    expect(r.hinzurechnungKindergeld).toBe(0);
  });

  it('rechnet bei Zusammenveranlagung mit Splitting', () => {
    const r = berechneEinkommensteuer({ einkommen: 60000, tarif: 'zusammen' });
    expect(r.einkommensteuer).toBe(2 * 4217);
  });

  it('rechnet für Verwitwete ebenfalls mit Splitting (§ 32a Abs. 6 EStG)', () => {
    const r = berechneEinkommensteuer({ einkommen: 60000, tarif: 'witwe' });
    expect(r.einkommensteuer).toBe(2 * 4217);
  });

  it('gibt den Durchschnittssteuersatz als Anteil am zu versteuernden Einkommen an', () => {
    const r = berechneEinkommensteuer({ einkommen: 30000 });
    expect(r.durchschnittssatz).toBeCloseTo(4217 / 30000, 6);
  });

  it('gibt den Grenzsteuersatz auf die nächsten 100 € an', () => {
    expect(GRENZSATZ_SCHRITT).toBe(100);
    const r = berechneEinkommensteuer({ einkommen: 100000 });
    expect(r.grenzsteuersatz).toBeCloseTo(0.42, 2);
    const spitze = berechneEinkommensteuer({ einkommen: 300000 });
    expect(spitze.grenzsteuersatz).toBeCloseTo(0.45, 2);
    const frei = berechneEinkommensteuer({ einkommen: 10000 });
    expect(frei.grenzsteuersatz).toBe(0);
  });

  it('bleibt bei Einkommen bis zum Grundfreibetrag bei null, ohne Division durch null', () => {
    const r = berechneEinkommensteuer({ einkommen: 0 });
    expect(r.einkommensteuer).toBe(0);
    expect(r.durchschnittssatz).toBe(0);
    expect(r.gesamt).toBe(0);
  });
});

describe('Solidaritätszuschlag (§§ 3, 4 SolzG 1995)', () => {
  it('fällt bis zur Freigrenze nicht an', () => {
    const r = berechneEinkommensteuer({ einkommen: 70000 }); // Steuer 18.264 € < 20.350 €
    expect(r.soli).toBe(0);
  });

  it('beginnt oberhalb der Freigrenze in der Milderungszone', () => {
    const r = berechneEinkommensteuer({ einkommen: 100000 }); // Steuer 30.864 €
    expect(r.soli).toBe(solidaritaetszuschlag(30864, SOLI_FREIGRENZE));
    expect(r.soli).toBe(1251.16); // 11,9 % × (30.864 − 20.350)
  });

  it('nimmt bei Splitting die doppelte Freigrenze', () => {
    const r = berechneEinkommensteuer({ einkommen: 200000, tarif: 'zusammen' });
    expect(r.soli).toBe(solidaritaetszuschlag(r.bemessungZuschlag, SOLI_FREIGRENZE_SPLITTING));
    const witwe = berechneEinkommensteuer({ einkommen: 200000, tarif: 'witwe' });
    expect(witwe.soli).toBe(solidaritaetszuschlag(witwe.bemessungZuschlag, SOLI_FREIGRENZE_SPLITTING));
  });
});

describe('Kirchensteuer (§ 51a EStG)', () => {
  it('ist ohne Kirchenmitgliedschaft null', () => {
    const r = berechneEinkommensteuer({ einkommen: 100000 });
    expect(r.kirchensteuer).toBe(0);
    expect(r.kirchensteuersatz).toBe(0);
  });

  it('rechnet 8 % in Bayern und 9 % in Nordrhein-Westfalen', () => {
    const by = berechneEinkommensteuer({ einkommen: 100000, kirchensteuer: true, bundesland: 'BY' });
    const nw = berechneEinkommensteuer({ einkommen: 100000, kirchensteuer: true, bundesland: 'NW' });
    expect(by.kirchensteuer).toBe(2469.12);
    expect(nw.kirchensteuer).toBe(2777.76);
    expect(nw.gesamt).toBe(34892.92); // 30.864 + 1.251,16 + 2.777,76
  });

  it('wirft bei unbekanntem Bundesland', () => {
    expect(() => berechneEinkommensteuer({ einkommen: 50000, kirchensteuer: true, bundesland: 'XX' })).toThrow();
  });
});

describe('Kinder: Günstigerprüfung (§ 31 EStG) und Zuschlagsteuern (§ 51a Abs. 2 EStG)', () => {
  it('lässt bei niedrigem Einkommen das Kindergeld wirken und kein Freibetrag das zvE mindern', () => {
    const r = berechneEinkommensteuer({ einkommen: 40000, tarif: 'zusammen', kinder: 1 });
    expect(r.freibetraegeGuenstiger).toBe(false);
    expect(r.freibetraegeKinder).toBe(2 * FREIBETRAG_EINZELN);
    expect(r.zvE).toBe(40000);
    expect(r.einkommensteuer).toBe(2 * einkommensteuer(20000));
    expect(r.hinzurechnungKindergeld).toBe(0);
  });

  it('zieht bei hohem Einkommen die Freibeträge ab und rechnet das Kindergeld hinzu (§ 31 Satz 4)', () => {
    const r = berechneEinkommensteuer({ einkommen: 200000, tarif: 'zusammen', kinder: 1 });
    expect(r.freibetraegeGuenstiger).toBe(true);
    expect(r.zvE).toBe(200000 - 2 * FREIBETRAG_EINZELN);
    expect(r.kindergeldJahr).toBe(12 * KINDERGELD_MONAT);
    expect(r.hinzurechnungKindergeld).toBe(12 * KINDERGELD_MONAT);
    expect(r.einkommensteuer).toBe(r.tariflicheSteuer + 12 * KINDERGELD_MONAT);
  });

  it('setzt bei nicht zusammenveranlagten Eltern das Kindergeld nur im Umfang des Kinderfreibetrags an', () => {
    const r = berechneEinkommensteuer({ einkommen: 200000, kinder: 1 });
    expect(r.freibetraegeKinder).toBe(FREIBETRAG_EINZELN);
    expect(r.kindergeldJahr).toBe(6 * KINDERGELD_MONAT);
  });

  it('bemisst Soli und Kirchensteuer immer nach der Steuer mit Freibeträgen', () => {
    const r = berechneEinkommensteuer({ einkommen: 60000, kinder: 2, kirchensteuer: true, bundesland: 'NW' });
    const mitFreibetraegen = einkommensteuer(60000 - 2 * FREIBETRAG_EINZELN);
    expect(r.bemessungZuschlag).toBe(mitFreibetraegen);
    expect(r.kirchensteuer).toBe(Math.round(mitFreibetraegen * 0.09 * 100) / 100);
  });

  it('wirft bei ungültiger Kinderzahl', () => {
    expect(() => berechneEinkommensteuer({ einkommen: 50000, kinder: -1 })).toThrow();
    expect(() => berechneEinkommensteuer({ einkommen: 50000, kinder: 1.5 })).toThrow();
  });
});
