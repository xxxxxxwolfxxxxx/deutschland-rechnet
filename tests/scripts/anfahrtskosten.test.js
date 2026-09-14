import { describe, it, expect } from 'vitest';
import { berechneAnfahrtskosten, PAUSCHALE_PRO_KM } from '../../public/scripts/anfahrtskosten.js';

// § 9 Abs. 1 Satz 3 Nr. 4a Satz 2 EStG i. V. m. § 5 Abs. 2 BRKG (30 Cent je km),
// abgerufen am 14.09.2026. Die früheren Verbrauchswerte je Fahrzeugklasse
// hatten keine Quelle; der Verbrauch ist jetzt eine Eingabe.

const basis = { km: 50, verbrauch: 7, spritpreis: 1.7, fahrten: 1 };

describe('Rechengrößen', () => {
  it('Kilometerpauschale 0,30 € je gefahrenem Kilometer', () => {
    expect(PAUSCHALE_PRO_KM).toBe(0.3);
  });
});

describe('berechneAnfahrtskosten – gefahrene Kilometer', () => {
  it('eine Hin- und Rückfahrt zählt die einfache Entfernung doppelt', () => {
    expect(berechneAnfahrtskosten(basis).gesamtKm).toBe(100);
  });

  it('drei Hin- und Rückfahrten zählen sechsmal die einfache Entfernung', () => {
    expect(berechneAnfahrtskosten({ ...basis, fahrten: 3 }).gesamtKm).toBe(300);
  });
});

describe('berechneAnfahrtskosten – Spritkosten', () => {
  it('100 km bei 7 l/100km und 1,70 €/l kosten 11,90 €', () => {
    const r = berechneAnfahrtskosten(basis);
    expect(r.liter).toBe(7);
    expect(r.spritkosten).toBe(11.9);
    expect(r.gesamtkosten).toBe(11.9);
  });

  it('doppelter Verbrauch, doppelte Kosten', () => {
    const sieben = berechneAnfahrtskosten(basis);
    const vierzehn = berechneAnfahrtskosten({ ...basis, verbrauch: 14 });
    expect(vierzehn.spritkosten).toBe(sieben.spritkosten * 2);
  });

  it('steigt linear mit dem Spritpreis', () => {
    const r = berechneAnfahrtskosten({ ...basis, spritpreis: 3.4 });
    expect(r.spritkosten).toBe(23.8);
  });
});

describe('berechneAnfahrtskosten – Kilometerpauschale', () => {
  it('beträgt 0,30 € je gefahrenem Kilometer, nicht je Entfernungskilometer', () => {
    expect(berechneAnfahrtskosten(basis).pauschale).toBe(30);
  });

  it('wird nicht zu den Spritkosten addiert', () => {
    const r = berechneAnfahrtskosten(basis);
    expect(r.gesamtkosten).toBe(r.spritkosten);
  });
});

describe('berechneAnfahrtskosten – Randfälle', () => {
  it('ohne Fahrt entstehen keine Kosten', () => {
    const r = berechneAnfahrtskosten({ ...basis, fahrten: 0 });
    expect(r.gesamtkosten).toBe(0);
    expect(r.pauschale).toBe(0);
  });

  it('negative Eingaben ergeben keine negativen Kosten', () => {
    const r = berechneAnfahrtskosten({ km: -50, verbrauch: -7, spritpreis: -1, fahrten: -2 });
    expect(r.gesamtkosten).toBe(0);
    expect(r.pauschale).toBe(0);
  });
});
