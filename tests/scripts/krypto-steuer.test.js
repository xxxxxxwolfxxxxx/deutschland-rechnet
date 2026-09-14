import { describe, it, expect } from 'vitest';
import {
  FREIGRENZE,
  steuerpflichtigerGewinn,
  berechneKryptoSteuer,
} from '../../public/scripts/krypto-steuer.js';
import { einkommensteuer } from '../../public/scripts/einkommensteuer.js';

// § 23 Abs. 3 Satz 5 EStG: steuerfrei, wenn der Gesamtgewinn "weniger als
// 1 000 Euro" beträgt. Freigrenze, kein Freibetrag.

describe('steuerpflichtigerGewinn – Freigrenze', () => {
  it('999,99 € bleiben vollständig steuerfrei', () => {
    expect(steuerpflichtigerGewinn(999.99)).toBe(0);
  });

  it('genau 1.000 € sind in voller Höhe steuerpflichtig', () => {
    expect(FREIGRENZE).toBe(1000);
    expect(steuerpflichtigerGewinn(1000)).toBe(1000);
  });

  it('1.500 € werden ganz versteuert, nicht nur die 500 € darüber', () => {
    expect(steuerpflichtigerGewinn(1500)).toBe(1500);
  });

  it('ein Verlust mindert das übrige Einkommen nicht', () => {
    expect(steuerpflichtigerGewinn(-2000)).toBe(0);
  });

  it('ungültige Eingaben ergeben 0', () => {
    expect(steuerpflichtigerGewinn(undefined)).toBe(0);
    expect(steuerpflichtigerGewinn('abc')).toBe(0);
  });
});

describe('berechneKryptoSteuer – Einzelveranlagung', () => {
  it('rechnet die Mehrsteuer als Tarifdifferenz', () => {
    const r = berechneKryptoSteuer({ zvEOhne: 40000, gewinn: 5000 });

    expect(r.steuerpflichtig).toBe(5000);
    expect(r.mehrsteuer).toBe(einkommensteuer(45000) - einkommensteuer(40000));
    expect(r.mehrsteuer).toBeGreaterThan(0);
  });

  it('der Sprung an der Freigrenze: 999 € kosten nichts, 1.000 € kosten Steuer auf 1.000 €', () => {
    const drunter = berechneKryptoSteuer({ zvEOhne: 40000, gewinn: 999 });
    const drauf = berechneKryptoSteuer({ zvEOhne: 40000, gewinn: 1000 });

    expect(drunter.mehrsteuer).toBe(0);
    expect(drunter.freiNachFreigrenze).toBe(true);
    expect(drauf.mehrsteuer).toBe(einkommensteuer(41000) - einkommensteuer(40000));
    expect(drauf.freiNachFreigrenze).toBe(false);
  });

  it('der Partnergewinn zählt ohne Zusammenveranlagung nicht mit', () => {
    const r = berechneKryptoSteuer({ zvEOhne: 30000, gewinn: 2000, gewinnPartner: 5000 });

    expect(r.steuerpflichtigPartner).toBe(0);
    expect(r.steuerpflichtigGesamt).toBe(2000);
  });

  it('unter dem Grundfreibetrag entsteht keine Mehrsteuer', () => {
    const r = berechneKryptoSteuer({ zvEOhne: 5000, gewinn: 3000 });

    expect(r.steuerpflichtig).toBe(3000);
    expect(r.mehrsteuer).toBe(0);
  });
});

describe('berechneKryptoSteuer – Zusammenveranlagung', () => {
  it('die Freigrenze gilt je Ehegatte, nicht als gemeinsame 2.000 €', () => {
    // 1.500 € des einen und 0 € des anderen: kein gemeinsamer Freibetrag von 2.000 €.
    const r = berechneKryptoSteuer({ zvEOhne: 60000, gewinn: 1500, gewinnPartner: 0, zusammen: true });

    expect(r.steuerpflichtigGesamt).toBe(1500);
    expect(r.mehrsteuer).toBeGreaterThan(0);
  });

  it('je 900 € bleiben bei beiden steuerfrei', () => {
    const r = berechneKryptoSteuer({ zvEOhne: 60000, gewinn: 900, gewinnPartner: 900, zusammen: true });

    expect(r.steuerpflichtigGesamt).toBe(0);
    expect(r.freiNachFreigrenze).toBe(true);
    expect(r.freiNachFreigrenzePartner).toBe(true);
    expect(r.mehrsteuer).toBe(0);
  });

  it('rechnet im Splittingverfahren', () => {
    const r = berechneKryptoSteuer({ zvEOhne: 60000, gewinn: 4000, gewinnPartner: 2000, zusammen: true });
    const splitting = (x) => 2 * einkommensteuer(x / 2);

    expect(r.steuerpflichtigGesamt).toBe(6000);
    expect(r.mehrsteuer).toBe(splitting(66000) - splitting(60000));
  });
});
