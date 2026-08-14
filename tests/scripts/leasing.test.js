import { describe, it, expect } from 'vitest';
import { berechneLeasing } from '../../public/scripts/leasing.js';

// Kilometerleasing: Die Raten decken den Wertverlust vom Fahrzeugpreis auf den
// Restwert, vermindert um die Anzahlung, zuzüglich Zinsen auf das
// durchschnittlich gebundene Kapital.
//
// Bis zum 14.08.2026 blieb die Anzahlung bei den Zinsen und bei den Kosten je
// Kilometer unberücksichtigt; die Rückgabe hieß außerdem gesamtKosten,
// während die Seite gesamtkosten las.

const BASIS = { neupreis: 35000, anzahlung: 5000, laufzeit: 36, restwert: 18000, zins: 3.5, km: 15000 };

describe('berechneLeasing – Rate', () => {
  it('Wertverlust und Zinsen verteilt auf die Laufzeit', () => {
    // Wertverlust: 35.000 − 18.000 − 5.000 = 12.000
    // Zinsen: (30.000 + 18.000) / 2 × 3,5 % × 3 Jahre = 2.520
    // Rate: (12.000 + 2.520) / 36 = 403,33
    const r = berechneLeasing(BASIS);

    expect(r.zinskosten).toBe(2520);
    expect(r.gesamtLeasing).toBe(14520);
    expect(r.rate).toBe(403.33);
  });

  it('eine höhere Anzahlung senkt die Rate', () => {
    const wenig = berechneLeasing({ ...BASIS, anzahlung: 0 });
    const viel = berechneLeasing({ ...BASIS, anzahlung: 10000 });

    expect(viel.rate).toBeLessThan(wenig.rate);
  });

  it('ein höherer Restwert senkt die Rate', () => {
    const niedrig = berechneLeasing({ ...BASIS, restwert: 12000 });
    const hoch = berechneLeasing({ ...BASIS, restwert: 22000 });

    expect(hoch.rate).toBeLessThan(niedrig.rate);
  });
});

describe('berechneLeasing – Zinsen auf das gebundene Kapital', () => {
  it('die Anzahlung senkt das verzinste Kapital', () => {
    const ohne = berechneLeasing({ ...BASIS, anzahlung: 0 });
    const mit = berechneLeasing({ ...BASIS, anzahlung: 10000 });

    expect(mit.zinskosten).toBeLessThan(ohne.zinskosten);
    // (35.000 + 18.000) / 2 × 3,5 % × 3 = 2782,50 ohne Anzahlung
    expect(ohne.zinskosten).toBe(2782.5);
  });

  it('ohne Zins bleibt nur der Wertverlust', () => {
    const r = berechneLeasing({ ...BASIS, zins: 0 });

    expect(r.zinskosten).toBe(0);
    expect(r.gesamtLeasing).toBe(12000);
    expect(r.rate).toBeCloseTo(12000 / 36, 2);
  });

  it('die Zinskosten wachsen mit der Laufzeit', () => {
    const kurz = berechneLeasing({ ...BASIS, laufzeit: 24 });
    const lang = berechneLeasing({ ...BASIS, laufzeit: 48 });

    expect(lang.zinskosten).toBeGreaterThan(kurz.zinskosten);
  });
});

describe('berechneLeasing – Gesamtkosten', () => {
  it('enthalten die Anzahlung und alle Raten', () => {
    const r = berechneLeasing(BASIS);

    expect(r.gesamtkosten).toBeCloseTo(5000 + r.rate * 36, 0);
    expect(r.gesamtkosten).toBeGreaterThan(r.gesamtLeasing);
  });

  it('werden unter dem Namen ausgegeben, den die Seite ausliest', () => {
    const r = berechneLeasing(BASIS);

    expect(r.gesamtkosten).toBeTypeOf('number');
    expect(r.kostenProKm).toBeTypeOf('number');
  });
});

describe('berechneLeasing – Kosten je Kilometer', () => {
  it('rechnen die Anzahlung mit ein', () => {
    // 45.000 km in drei Jahren, Gesamtkosten 19.520 € → 0,434 €/km
    const r = berechneLeasing(BASIS);

    expect(r.kilometer).toBe(45000);
    expect(r.kostenProKm).toBeCloseTo(r.gesamtkosten / 45000, 3);
    expect(r.kostenProKm).toBe(0.434);
  });

  it('sinken mit höherer Fahrleistung', () => {
    const wenig = berechneLeasing({ ...BASIS, km: 10000 });
    const viel = berechneLeasing({ ...BASIS, km: 30000 });

    expect(viel.kostenProKm).toBeLessThan(wenig.kostenProKm);
  });
});

describe('berechneLeasing – Randfälle', () => {
  it('ohne Fahrleistung wird nicht durch null geteilt', () => {
    const r = berechneLeasing({ ...BASIS, km: 0 });

    expect(r.kostenProKm).toBe(0);
    expect(Number.isFinite(r.kostenProKm)).toBe(true);
  });

  it('ohne Laufzeit entstehen keine Raten', () => {
    const r = berechneLeasing({ ...BASIS, laufzeit: 0 });

    expect(r.rate).toBe(0);
    expect(r.zinskosten).toBe(0);
    expect(r.gesamtkosten).toBe(5000);
  });

  it('ein Restwert oberhalb des Fahrzeugpreises ergibt keinen negativen Wertverlust', () => {
    const r = berechneLeasing({ ...BASIS, restwert: 40000 });

    expect(r.rate).toBeGreaterThanOrEqual(0);
  });

  it('eine Anzahlung über dem Fahrzeugpreis wird begrenzt', () => {
    const r = berechneLeasing({ ...BASIS, anzahlung: 50000 });

    expect(r.gesamtkosten).toBeGreaterThanOrEqual(35000);
    expect(r.rate).toBeGreaterThanOrEqual(0);
  });
});
