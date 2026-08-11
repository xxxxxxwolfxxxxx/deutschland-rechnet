import { describe, it, expect } from 'vitest';
import { berechneSteuernachzahlung } from '../../public/scripts/steuernachzahlung.js';
import { jahreslohnsteuer, ARBEITNEHMER_PAUSCHBETRAG } from '../../public/scripts/lohnsteuer.js';

const ledig = { bruttoJahr: 50000, steuerklasse: 1, kinder: 1 };

// Bis zum 11.08.2026 gab dieses Modul die komplette Jahressteuer als
// "Nachzahlung" aus (nachzahlung = gesamteSteuer), rechnete mit dem
// Grundfreibetrag von 2024 und mit einem Tarif, dessen Formel den
// Grundfreibetrag gar nicht abzog: 30.000 € zu versteuerndes Einkommen ergaben
// 12.506 € statt 4.217 €.
describe('berechneSteuernachzahlung', () => {
  it('gibt nicht die ganze Jahressteuer als Nachzahlung aus', () => {
    const r = berechneSteuernachzahlung(ledig);
    expect(r.jahressteuer).toBeGreaterThan(5000);
    expect(Math.abs(r.differenz)).toBeLessThan(r.jahressteuer / 10);
  });

  it('ergibt für einen Ledigen ohne Besonderheiten praktisch null', () => {
    const r = berechneSteuernachzahlung(ledig);
    expect(Math.abs(r.differenz)).toBeLessThan(5);
    expect(r.zusammenveranlagung).toBe(false);
  });

  it('setzt die einbehaltene Lohnsteuer nach § 39b EStG an', () => {
    const r = berechneSteuernachzahlung(ledig);
    expect(r.einbehaltenLohnsteuer).toBe(jahreslohnsteuer({ jahresarbeitslohn: 50000, steuerklasse: 1, kinder: 1 }));
  });

  it('führt bei Werbungskosten über dem Pauschbetrag zur Erstattung', () => {
    const ohne = berechneSteuernachzahlung(ledig);
    const mit = berechneSteuernachzahlung({ ...ledig, werbungskosten: 5000 });
    expect(mit.erstattung).toBeGreaterThan(ohne.erstattung);
    expect(mit.nachzahlung).toBe(0);
  });

  it('ignoriert Werbungskosten unterhalb des Pauschbetrags', () => {
    const ohne = berechneSteuernachzahlung(ledig);
    const knapp = berechneSteuernachzahlung({ ...ledig, werbungskosten: ARBEITNEHMER_PAUSCHBETRAG - 200 });
    expect(knapp.differenz).toBe(ohne.differenz);
  });

  it('führt bei Sonderausgaben zur Erstattung', () => {
    const ohne = berechneSteuernachzahlung(ledig);
    const mit = berechneSteuernachzahlung({ ...ledig, sonderausgaben: 3000 });
    expect(mit.jahressteuer).toBeLessThan(ohne.jahressteuer);
    expect(mit.erstattung).toBeGreaterThan(0);
  });

  it('weist Nachzahlung und Erstattung nie gleichzeitig aus', () => {
    for (const werbung of [0, 2000, 8000]) {
      for (const sk of [1, 3, 5]) {
        const r = berechneSteuernachzahlung({ ...ledig, steuerklasse: sk, werbungskosten: werbung });
        expect(r.nachzahlung === 0 || r.erstattung === 0, `SK ${sk}, WK ${werbung}`).toBe(true);
        expect(r.erstattung - r.nachzahlung).toBeCloseTo(r.differenz, 2);
      }
    }
  });

  it('Einbehalt minus Jahressteuer ergibt die Differenz', () => {
    const r = berechneSteuernachzahlung({ ...ledig, werbungskosten: 4000, sonderausgaben: 1500 });
    expect(r.einbehalten - r.jahressteuer).toBeCloseTo(r.differenz, 2);
    expect(r.einbehalten).toBeCloseTo(r.einbehaltenLohnsteuer + r.einbehaltenSoli, 2);
  });
});

describe('Zusammenveranlagung', () => {
  const paar = { bruttoJahr: 50000, steuerklasse: 3, partnerBruttoJahr: 25000, partnerSteuerklasse: 5, kinder: 1 };

  it('III/V führt zur Nachzahlung', () => {
    const r = berechneSteuernachzahlung(paar);
    expect(r.zusammenveranlagung).toBe(true);
    expect(r.nachzahlung).toBeGreaterThan(0);
  });

  it('IV/IV bei ungleichen Einkommen führt zur Erstattung', () => {
    const r = berechneSteuernachzahlung({ ...paar, steuerklasse: 4, partnerSteuerklasse: 4 });
    expect(r.erstattung).toBeGreaterThan(0);
  });

  it('die Jahressteuer ist von der Steuerklassenkombination unabhängig', () => {
    const dreiFuenf = berechneSteuernachzahlung(paar);
    const vierVier = berechneSteuernachzahlung({ ...paar, steuerklasse: 4, partnerSteuerklasse: 4 });
    expect(dreiFuenf.jahressteuer).toBe(vierVier.jahressteuer);
  });

  it('wendet den Splittingtarif an – die Jahressteuer liegt unter der Einzelveranlagung', () => {
    const gemeinsam = berechneSteuernachzahlung(paar);
    const alleinA = berechneSteuernachzahlung({ bruttoJahr: 50000, steuerklasse: 1, kinder: 1 });
    const alleinB = berechneSteuernachzahlung({ bruttoJahr: 25000, steuerklasse: 1, kinder: 1 });
    expect(gemeinsam.jahressteuer).toBeLessThan(alleinA.jahressteuer + alleinB.jahressteuer);
  });

  it('ohne Partner-Steuerklasse wird einzeln veranlagt', () => {
    const r = berechneSteuernachzahlung({ ...paar, partnerSteuerklasse: 0 });
    expect(r.zusammenveranlagung).toBe(false);
  });
});

describe('Randfälle', () => {
  it('0 € Einkommen ergibt 0 € in jeder Richtung', () => {
    const r = berechneSteuernachzahlung({ bruttoJahr: 0, steuerklasse: 1 });
    expect(r.differenz).toBe(0);
    expect(r.jahressteuer).toBe(0);
    expect(r.einbehalten).toBe(0);
  });

  it('unter dem Grundfreibetrag fällt keine Steuer an', () => {
    const r = berechneSteuernachzahlung({ bruttoJahr: 10000, steuerklasse: 1, kinder: 1 });
    expect(r.jahressteuer).toBe(0);
    expect(r.nachzahlung).toBe(0);
  });

  it('weist unbekannte Steuerklassen zurück', () => {
    expect(() => berechneSteuernachzahlung({ bruttoJahr: 50000, steuerklasse: 9 })).toThrow();
  });

  it('behandelt negative Eingaben wie null', () => {
    const r = berechneSteuernachzahlung({ bruttoJahr: -5000, steuerklasse: 1, werbungskosten: -100 });
    expect(r.differenz).toBe(0);
  });
});
