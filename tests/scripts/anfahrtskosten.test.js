import { describe, it, expect } from 'vitest';
import {
  berechneAnfahrtskosten,
  VERBRAUCH,
  VERBRAUCH_STANDARD,
  PAUSCHALE_PRO_KM,
} from '../../public/scripts/anfahrtskosten.js';

// Kilometerpauschale bei Auswärtstätigkeit: 0,30 Euro je tatsächlich
// gefahrenem Kilometer (§ 9 Abs. 1 Satz 3 Nr. 4a Satz 2 EStG i. V. m. § 5
// Abs. 2 BRKG). Die Entfernungspauschale für den Weg zur ersten
// Tätigkeitsstätte ist eine andere Größe und steht in fahrtkosten.js.
//
// Bis zum 14.08.2026 war das Eingabefeld mit "Anzahl Fahrten (Hin + Rück)"
// beschriftet und mit 2 vorbelegt, während das Modul jede Fahrt ohnehin
// doppelt zählt – aus 50 km einfacher Entfernung wurden 200 statt 100 km.

describe('Rechengrößen', () => {
  it('Kilometerpauschale 0,30 € je gefahrenem Kilometer', () => {
    expect(PAUSCHALE_PRO_KM).toBe(0.30);
  });

  it('Verbrauchswerte je Fahrzeugklasse', () => {
    expect(VERBRAUCH).toEqual({ small: 6, compact: 7, large: 9, van: 12 });
    expect(VERBRAUCH_STANDARD).toBe(7);
  });
});

describe('berechneAnfahrtskosten – gefahrene Kilometer', () => {
  it('eine Hin- und Rückfahrt zählt die einfache Entfernung doppelt', () => {
    const r = berechneAnfahrtskosten({ km: 50, fahrzeug: 'compact', spritpreis: 1.7, fahrten: 1 });

    expect(r.gesamtKm).toBe(100);
  });

  it('drei Hin- und Rückfahrten zählen sechsmal die einfache Entfernung', () => {
    const r = berechneAnfahrtskosten({ km: 50, fahrzeug: 'compact', spritpreis: 1.7, fahrten: 3 });

    expect(r.gesamtKm).toBe(300);
  });
});

describe('berechneAnfahrtskosten – Spritkosten', () => {
  it('100 km bei 7 l/100km und 1,70 €/l kosten 11,90 €', () => {
    const r = berechneAnfahrtskosten({ km: 50, fahrzeug: 'compact', spritpreis: 1.7, fahrten: 1 });

    expect(r.spritkosten).toBe(11.9);
    expect(r.gesamtkosten).toBe(11.9);
  });

  it('der Transporter verbraucht das Doppelte des Kleinwagens', () => {
    const basis = { km: 100, spritpreis: 1.7, fahrten: 1 };
    const klein = berechneAnfahrtskosten({ ...basis, fahrzeug: 'small' });
    const transporter = berechneAnfahrtskosten({ ...basis, fahrzeug: 'van' });

    expect(klein.verbrauch).toBe(6);
    expect(transporter.verbrauch).toBe(12);
    expect(transporter.spritkosten).toBeCloseTo(klein.spritkosten * 2, 2);
  });

  it('unbekannte Fahrzeugklasse rechnet mit 7 l/100km', () => {
    const r = berechneAnfahrtskosten({ km: 100, fahrzeug: 'wohnmobil', spritpreis: 2, fahrten: 1 });

    expect(r.verbrauch).toBe(7);
    expect(r.spritkosten).toBe(28);
  });

  it('steigt linear mit dem Spritpreis', () => {
    const guenstig = berechneAnfahrtskosten({ km: 100, fahrzeug: 'compact', spritpreis: 1.5, fahrten: 1 });
    const teuer = berechneAnfahrtskosten({ km: 100, fahrzeug: 'compact', spritpreis: 3, fahrten: 1 });

    expect(teuer.spritkosten).toBeCloseTo(guenstig.spritkosten * 2, 2);
  });
});

describe('berechneAnfahrtskosten – Kilometerpauschale', () => {
  it('beträgt 0,30 € je gefahrenem Kilometer, nicht je Entfernungskilometer', () => {
    const r = berechneAnfahrtskosten({ km: 50, fahrzeug: 'compact', spritpreis: 1.7, fahrten: 1 });

    expect(r.pauschale).toBe(30);
  });

  it('wird nicht zu den Spritkosten addiert', () => {
    const r = berechneAnfahrtskosten({ km: 200, fahrzeug: 'large', spritpreis: 1.8, fahrten: 2 });

    expect(r.gesamtkosten).toBe(r.spritkosten);
    expect(r.pauschale).toBeGreaterThan(0);
  });
});

describe('berechneAnfahrtskosten – Randfälle', () => {
  it('ohne Fahrt entstehen keine Kosten', () => {
    const r = berechneAnfahrtskosten({ km: 50, fahrzeug: 'compact', spritpreis: 1.7, fahrten: 0 });

    expect(r.gesamtKm).toBe(0);
    expect(r.spritkosten).toBe(0);
    expect(r.pauschale).toBe(0);
  });

  it('negative Eingaben ergeben keine negativen Kosten', () => {
    const r = berechneAnfahrtskosten({ km: -50, fahrzeug: 'compact', spritpreis: 1.7, fahrten: -2 });

    expect(r.gesamtKm).toBe(0);
    expect(r.gesamtkosten).toBe(0);
  });
});
