import { describe, it, expect } from 'vitest';
import {
  berechneSteuernachzahlung,
  pruefeKombination,
  ENTLASTUNGSBETRAG_JE_WEITEREM_KIND,
} from '../../public/scripts/steuernachzahlung.js';
import { jahreslohnsteuer, ARBEITNEHMER_PAUSCHBETRAG } from '../../public/scripts/lohnsteuer.js';
import { berechneEinkommensteuer } from '../../public/scripts/einkommensteuer-rechner.js';
import { KINDERGELD_MONAT } from '../../public/scripts/kindergeld.js';

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
    const kombinationen = [[1, 0], [3, 5], [5, 3], [4, 4]];
    for (const werbung of [0, 2000, 8000]) {
      for (const [sk, psk] of kombinationen) {
        const r = berechneSteuernachzahlung({
          ...ledig, steuerklasse: sk, partnerSteuerklasse: psk, partnerBruttoJahr: psk ? 25000 : 0, werbungskosten: werbung,
        });
        expect(r.nachzahlung === 0 || r.erstattung === 0, `SK ${sk}/${psk}, WK ${werbung}`).toBe(true);
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
    const r = berechneSteuernachzahlung({ ...paar, steuerklasse: 1, partnerSteuerklasse: 0 });
    expect(r.zusammenveranlagung).toBe(false);
  });
});

describe('Steuerklassen-Kombinationen (§ 38b Abs. 1 Satz 2 EStG)', () => {
  it('lässt I, II mit Kind und VI ohne Partner zu', () => {
    expect(pruefeKombination({ steuerklasse: 1 })).toBeNull();
    expect(pruefeKombination({ steuerklasse: 2, kinderKindergeld: 1 })).toBeNull();
    expect(pruefeKombination({ steuerklasse: 6 })).toBeNull();
  });

  it('lässt nur III/V, V/III und IV/IV als Ehegatten-Kombination zu', () => {
    expect(pruefeKombination({ steuerklasse: 3, partnerSteuerklasse: 5 })).toBeNull();
    expect(pruefeKombination({ steuerklasse: 5, partnerSteuerklasse: 3 })).toBeNull();
    expect(pruefeKombination({ steuerklasse: 4, partnerSteuerklasse: 4 })).toBeNull();
    expect(pruefeKombination({ steuerklasse: 1, partnerSteuerklasse: 5 })).toMatch(/passt nicht/);
    expect(pruefeKombination({ steuerklasse: 4, partnerSteuerklasse: 3 })).toMatch(/passt nicht/);
    expect(pruefeKombination({ steuerklasse: 3, partnerSteuerklasse: 3 })).toMatch(/passt nicht/);
    expect(pruefeKombination({ steuerklasse: 2, partnerSteuerklasse: 4, kinderKindergeld: 1 })).toMatch(/passt nicht/);
  });

  it('verlangt für III, IV und V einen Ehegatten', () => {
    for (const sk of [3, 4, 5]) {
      expect(pruefeKombination({ steuerklasse: sk })).toMatch(/Ehegatten/);
    }
  });

  it('verlangt für II ein Kind mit Kindergeld oder Freibetrag (§ 24b Abs. 1)', () => {
    expect(pruefeKombination({ steuerklasse: 2 })).toMatch(/§ 24b/);
  });

  it('weist unbekannte Steuerklassen zurück', () => {
    expect(pruefeKombination({ steuerklasse: 9 })).toMatch(/Unbekannte/);
    expect(pruefeKombination({ steuerklasse: 3, partnerSteuerklasse: 7 })).toMatch(/Unbekannte/);
  });

  it('rechnet ungültige Kombinationen nicht, sondern wirft', () => {
    expect(() => berechneSteuernachzahlung({ bruttoJahr: 60000, steuerklasse: 1, partnerBruttoJahr: 30000, partnerSteuerklasse: 5 })).toThrow(/passt nicht/);
    expect(() => berechneSteuernachzahlung({ bruttoJahr: 50000, steuerklasse: 4 })).toThrow(/Ehegatten/);
    expect(() => berechneSteuernachzahlung({ bruttoJahr: 50000, steuerklasse: 9 })).toThrow();
  });
});

describe('Kinder in der Veranlagung', () => {
  const paar = { bruttoJahr: 150000, steuerklasse: 4, partnerBruttoJahr: 60000, partnerSteuerklasse: 4, kinder: 2 };

  it('zieht bei hohem Einkommen die Freibeträge ab und rechnet das Kindergeld hinzu (§ 31 EStG)', () => {
    const ohne = berechneSteuernachzahlung(paar);
    const mit = berechneSteuernachzahlung({ ...paar, kinderKindergeld: 2 });
    expect(mit.freibetraegeGuenstiger).toBe(true);
    expect(mit.hinzurechnungKindergeld).toBe(2 * 12 * KINDERGELD_MONAT);
    expect(mit.jahressteuer).toBeLessThan(ohne.jahressteuer);
    expect(mit.einbehalten).toBe(ohne.einbehalten);
  });

  it('lässt die Einkommensteuer bei niedrigem Einkommen unverändert, wenn das Kindergeld günstiger ist', () => {
    const basis = { bruttoJahr: 40000, steuerklasse: 3, partnerBruttoJahr: 10000, partnerSteuerklasse: 5, kinder: 1 };
    const ohne = berechneSteuernachzahlung(basis);
    const mit = berechneSteuernachzahlung({ ...basis, kinderKindergeld: 1 });
    expect(mit.freibetraegeGuenstiger).toBe(false);
    expect(mit.einkommensteuer).toBe(ohne.einkommensteuer);
  });

  it('bemisst den Soli der Veranlagung mit Kinderfreibeträgen (§ 3 Abs. 2 SolzG)', () => {
    const basis = { bruttoJahr: 120000, steuerklasse: 1, kinder: 1 };
    const ohne = berechneSteuernachzahlung(basis);
    const mit = berechneSteuernachzahlung({ ...basis, kinderKindergeld: 1 });
    expect(mit.soli).toBe(berechneEinkommensteuer({ einkommen: mit.einkommen, kinder: 1 }).soli);
    expect(mit.soli).toBeLessThan(ohne.soli);
  });

  it('erhöht den Entlastungsbetrag je weiterem Kind um 240 € (§ 24b Abs. 2 Satz 2 EStG)', () => {
    expect(ENTLASTUNGSBETRAG_JE_WEITEREM_KIND).toBe(240);
    const einKind = berechneSteuernachzahlung({ bruttoJahr: 45000, steuerklasse: 2, kinder: 1, kinderKindergeld: 1 });
    const dreiKinder = berechneSteuernachzahlung({ bruttoJahr: 45000, steuerklasse: 2, kinder: 1, kinderKindergeld: 3 });
    expect(einKind.einkommen - dreiKinder.einkommen).toBe(2 * 240);
  });

  it('behält im Lohnsteuerabzug nur den Betrag für ein Kind (§ 39b Abs. 2 Satz 5 Nr. 4 EStG)', () => {
    const einKind = berechneSteuernachzahlung({ bruttoJahr: 45000, steuerklasse: 2, kinder: 1, kinderKindergeld: 1 });
    const dreiKinder = berechneSteuernachzahlung({ bruttoJahr: 45000, steuerklasse: 2, kinder: 1, kinderKindergeld: 3 });
    expect(dreiKinder.einbehaltenLohnsteuer).toBe(einKind.einbehaltenLohnsteuer);
    expect(dreiKinder.erstattung).toBeGreaterThan(einKind.erstattung);
  });

  it('weist eine ungültige Kinderzahl zurück', () => {
    expect(() => berechneSteuernachzahlung({ ...ledig, kinderKindergeld: -1 })).toThrow();
    expect(() => berechneSteuernachzahlung({ ...ledig, kinderKindergeld: 1.5 })).toThrow();
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

  it('behandelt negative Eingaben wie null', () => {
    const r = berechneSteuernachzahlung({ bruttoJahr: -5000, steuerklasse: 1, werbungskosten: -100 });
    expect(r.differenz).toBe(0);
  });
});
