import { describe, it, expect } from 'vitest';
import {
  HU_ERSTE_NACH_MONATEN,
  HU_ABSTAND_MONATE,
  faelligkeitenProJahr,
  berechneWartungskosten,
} from '../../public/scripts/wartungskosten.js';

// Die frühere Fassung testete Fahrzeugklassen und einen Altersfaktor ohne
// Quelle ("Oberklasse kostet mehr als Kleinwagen"). Das Modul rechnet jetzt nur
// mit Beträgen und Intervallen des Nutzers.

describe('Hauptuntersuchung – Anlage VIII Nr. 2.1.2.1 StVZO', () => {
  it('Pkw erstmals nach 36, danach alle 24 Monate', () => {
    expect(HU_ERSTE_NACH_MONATEN).toBe(36);
    expect(HU_ABSTAND_MONATE).toBe(24);
  });
});

describe('faelligkeitenProJahr', () => {
  it('nur Kilometerintervall', () => {
    expect(faelligkeitenProJahr({ alleKm: 30000 }, 15000)).toBe(0.5);
  });

  it('nur Zeitintervall', () => {
    expect(faelligkeitenProJahr({ alleMonate: 24 }, 15000)).toBe(0.5);
  });

  it('beide Intervalle: was zuerst erreicht wird', () => {
    // Inspektion alle 30.000 km oder 12 Monate: Wenigfahrer zahlen nach Zeit
    expect(faelligkeitenProJahr({ alleKm: 30000, alleMonate: 12 }, 10000)).toBe(1);
    // Vielfahrer nach Kilometern
    expect(faelligkeitenProJahr({ alleKm: 30000, alleMonate: 12 }, 45000)).toBe(1.5);
  });

  it('ohne Intervall nie fällig', () => {
    expect(faelligkeitenProJahr({}, 15000)).toBe(0);
  });
});

describe('berechneWartungskosten', () => {
  const posten = [
    { name: 'Inspektion', betrag: 400, alleKm: 30000, alleMonate: 24 },
    { name: 'Hauptuntersuchung', betrag: 150, alleMonate: HU_ABSTAND_MONATE },
    { name: 'Reifensatz', betrag: 600, alleKm: 40000 },
    { name: 'Bremsen vorn', betrag: 350, alleKm: 60000 },
  ];

  it('summiert die Posten je Jahr', () => {
    const r = berechneWartungskosten({ kmProJahr: 15000, posten });

    expect(r.posten.map((p) => p.proJahr)).toEqual([200, 75, 225, 87.5]);
    expect(r.gesamtProJahr).toBe(587.5);
    expect(r.gesamtProMonat).toBe(48.96);
    expect(r.centProKm).toBe(3.92);
  });

  it('mehr Kilometer: laufleistungsabhängige Posten steigen, zeitabhängige nicht', () => {
    const wenig = berechneWartungskosten({ kmProJahr: 15000, posten });
    const viel = berechneWartungskosten({ kmProJahr: 30000, posten });

    expect(viel.posten[1].proJahr).toBe(wenig.posten[1].proJahr);
    expect(viel.posten[2].proJahr).toBe(wenig.posten[2].proJahr * 2);
    expect(viel.centProKm).toBeLessThan(wenig.centProKm);
  });

  it('ohne Fahrleistung keine Kosten je Kilometer', () => {
    expect(berechneWartungskosten({ kmProJahr: 0, posten }).centProKm).toBeNull();
  });

  it('negative Beträge zählen nicht', () => {
    expect(berechneWartungskosten({ kmProJahr: 10000, posten: [{ name: 'x', betrag: -100, alleMonate: 12 }] }).gesamtProJahr).toBe(0);
  });
});
