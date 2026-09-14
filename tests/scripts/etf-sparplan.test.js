import { describe, it, expect } from 'vitest';
import {
  TEILFREISTELLUNG_AKTIENFONDS,
  sparplanVerlauf,
  steuerBeimVerkauf,
} from '../../public/scripts/etf-sparplan.js';

describe('sparplanVerlauf', () => {
  it('ohne Rendite ist das Endkapital die Summe der Einzahlungen', () => {
    const r = sparplanVerlauf({ startkapital: 1000, sparrate: 100, renditeProzent: 0, jahre: 1 });

    expect(r.endkapital).toBe(2200);
    expect(r.eingezahlt).toBe(2200);
    expect(r.gewinn).toBe(0);
  });

  it('das Startkapital wächst mit dem Monatssatz', () => {
    const r = sparplanVerlauf({ startkapital: 10000, sparrate: 0, renditeProzent: 6, jahre: 1 });

    expect(r.endkapital).toBeCloseTo(10000 * Math.pow(1.005, 12), 2);
  });

  it('negative und leere Eingaben werden abgefangen', () => {
    const r = sparplanVerlauf({ startkapital: -500, sparrate: undefined, renditeProzent: 5, jahre: 10 });

    expect(r.endkapital).toBe(0);
    expect(r.eingezahlt).toBe(0);
  });
});

describe('steuerBeimVerkauf – § 20 InvStG und § 32d EStG', () => {
  it('Teilfreistellung 30 Prozent', () => {
    expect(TEILFREISTELLUNG_AKTIENFONDS).toBe(0.3);
  });

  it('Aktien-ETF: 30 % frei, Pauschbetrag, dann 26,375 %', () => {
    const r = steuerBeimVerkauf({ gewinn: 10000, aktienfonds: true, pauschbetrag: 1000 });

    expect(r.teilfreistellung).toBe(3000);
    expect(r.ertrag).toBe(7000);
    expect(r.zuVersteuern).toBe(6000);
    expect(r.steuer).toBe(1582.5);
    expect(r.nettoGewinn).toBe(8417.5);
  });

  it('ohne Aktienfonds-Status keine Teilfreistellung', () => {
    const r = steuerBeimVerkauf({ gewinn: 10000, aktienfonds: false, pauschbetrag: 1000 });

    expect(r.teilfreistellung).toBe(0);
    expect(r.steuer).toBe(2373.75);
  });

  it('die alte Rechnung (Gewinn − 1.000) × 26,375 % war zu hoch', () => {
    const r = steuerBeimVerkauf({ gewinn: 50000, aktienfonds: true, pauschbetrag: 1000 });
    const alt = (50000 - 1000) * 0.26375;

    expect(r.steuer).toBeLessThan(alt);
    // 50.000 − 15.000 Teilfreistellung − 1.000 Pauschbetrag = 34.000 € × 26,375 %
    expect(r.steuer).toBe(8967.5);
  });

  it('Verlust oder kein Gewinn: keine Steuer', () => {
    expect(steuerBeimVerkauf({ gewinn: -3000 }).steuer).toBe(0);
    expect(steuerBeimVerkauf({ gewinn: 0 }).steuer).toBe(0);
  });

  it('Zusammenveranlagte mit 2.000 € Pauschbetrag', () => {
    const r = steuerBeimVerkauf({ gewinn: 2800, aktienfonds: true, pauschbetrag: 2000 });

    expect(r.ertrag).toBe(1960);
    expect(r.steuer).toBe(0);
  });
});
