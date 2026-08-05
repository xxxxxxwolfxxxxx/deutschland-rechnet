import { describe, it, expect } from 'vitest';
import { berechneWartungskosten, FAHRZEUGKLASSEN } from '../../public/scripts/wartungskosten.js';

const basis = { klasse: 'kompakt', alter: 5, kmProJahr: 15000 };

describe('berechneWartungskosten', () => {
  it('liefert positive Kosten für einen typischen Fall', () => {
    const r = berechneWartungskosten(basis);
    expect(r.gesamtProJahr).toBeGreaterThan(0);
    expect(r.centProKm).toBeGreaterThan(0);
  });

  it('teilt die Kosten in Wartung, Verschleiß und Reifen auf', () => {
    const r = berechneWartungskosten(basis);
    const summe = r.wartungProJahr + r.verschleissProJahr + r.reifenProJahr;
    expect(r.gesamtProJahr).toBeCloseTo(summe, 2);
  });

  it('größere Fahrzeugklasse kostet mehr', () => {
    const klein = berechneWartungskosten({ ...basis, klasse: 'kleinwagen' });
    const ober = berechneWartungskosten({ ...basis, klasse: 'oberklasse' });
    expect(ober.gesamtProJahr).toBeGreaterThan(klein.gesamtProJahr);
  });

  it('älteres Fahrzeug verursacht höhere Kosten als ein neues', () => {
    const neu = berechneWartungskosten({ ...basis, alter: 1 });
    const alt = berechneWartungskosten({ ...basis, alter: 12 });
    expect(alt.gesamtProJahr).toBeGreaterThan(neu.gesamtProJahr);
  });

  it('mehr Fahrleistung erhöht die Jahreskosten', () => {
    const wenig = berechneWartungskosten({ ...basis, kmProJahr: 5000 });
    const viel = berechneWartungskosten({ ...basis, kmProJahr: 30000 });
    expect(viel.gesamtProJahr).toBeGreaterThan(wenig.gesamtProJahr);
  });

  it('senkt die Kosten pro Kilometer bei hoher Fahrleistung (Fixkostendegression)', () => {
    const wenig = berechneWartungskosten({ ...basis, kmProJahr: 5000 });
    const viel = berechneWartungskosten({ ...basis, kmProJahr: 30000 });
    expect(viel.centProKm).toBeLessThan(wenig.centProKm);
  });

  it('rechnet die Kosten pro Kilometer konsistent zur Jahressumme', () => {
    const r = berechneWartungskosten(basis);
    expect(r.centProKm).toBeCloseTo((r.gesamtProJahr / basis.kmProJahr) * 100, 1);
  });

  it('bleibt bei 0 km pro Jahr endlich und ohne Division durch null', () => {
    const r = berechneWartungskosten({ ...basis, kmProJahr: 0 });
    expect(Number.isFinite(r.centProKm)).toBe(true);
    expect(r.centProKm).toBe(0);
  });

  it('fängt unbekannte Fahrzeugklassen mit dem Kompakt-Wert ab', () => {
    const unbekannt = berechneWartungskosten({ ...basis, klasse: 'raumschiff' });
    const kompakt = berechneWartungskosten({ ...basis, klasse: 'kompakt' });
    expect(unbekannt.gesamtProJahr).toBe(kompakt.gesamtProJahr);
  });

  it('behandelt negative Eingaben wie null', () => {
    const r = berechneWartungskosten({ klasse: 'kompakt', alter: -5, kmProJahr: -100 });
    expect(r.gesamtProJahr).toBeGreaterThanOrEqual(0);
    expect(r.centProKm).toBe(0);
  });

  it('liefert für jede definierte Klasse plausible Werte (1–60 ct/km)', () => {
    for (const klasse of Object.keys(FAHRZEUGKLASSEN)) {
      const r = berechneWartungskosten({ klasse, alter: 5, kmProJahr: 15000 });
      expect(r.centProKm).toBeGreaterThan(1);
      expect(r.centProKm).toBeLessThan(60);
    }
  });

  it('nennt den Reifenwechsel-Rhythmus passend zur Fahrleistung', () => {
    const r = berechneWartungskosten({ ...basis, kmProJahr: 15000 });
    expect(r.reifenwechselAlleJahre).toBeGreaterThan(0);
  });
});
