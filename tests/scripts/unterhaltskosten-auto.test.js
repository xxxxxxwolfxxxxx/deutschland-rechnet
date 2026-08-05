import { describe, it, expect } from 'vitest';
import { berechneUnterhaltskosten } from '../../public/scripts/unterhaltskosten-auto.js';

const basis = {
  kaufpreis: 25000,
  restwert: 12000,
  haltedauerJahre: 5,
  kmProJahr: 15000,
  verbrauch: 7,
  spritpreis: 1.75,
  versicherungProJahr: 600,
  steuerProJahr: 150,
  wartungProJahr: 700,
  sonstigesProJahr: 240,
};

describe('berechneUnterhaltskosten', () => {
  it('liefert plausible Jahreskosten', () => {
    const r = berechneUnterhaltskosten(basis);
    expect(r.gesamtProJahr).toBeGreaterThan(0);
    expect(r.gesamtProMonat).toBeCloseTo(r.gesamtProJahr / 12, 2);
  });

  it('trennt Fixkosten von variablen Kosten', () => {
    const r = berechneUnterhaltskosten(basis);
    expect(r.gesamtProJahr).toBeCloseTo(r.fixkostenProJahr + r.variableKostenProJahr, 2);
  });

  it('zählt Wertverlust, Versicherung, Steuer und Sonstiges zu den Fixkosten', () => {
    const r = berechneUnterhaltskosten(basis);
    const erwartet = r.wertverlustProJahr + basis.versicherungProJahr + basis.steuerProJahr + basis.sonstigesProJahr;
    expect(r.fixkostenProJahr).toBeCloseTo(erwartet, 2);
  });

  it('verteilt den Wertverlust über die Haltedauer', () => {
    const r = berechneUnterhaltskosten(basis);
    expect(r.wertverlustProJahr).toBeCloseTo((25000 - 12000) / 5, 2);
  });

  it('rechnet Spritkosten aus Verbrauch, Strecke und Preis', () => {
    const r = berechneUnterhaltskosten(basis);
    expect(r.spritkostenProJahr).toBeCloseTo((15000 / 100) * 7 * 1.75, 2);
  });

  it('senkt die Kosten pro Kilometer bei höherer Fahrleistung', () => {
    const wenig = berechneUnterhaltskosten({ ...basis, kmProJahr: 5000 });
    const viel = berechneUnterhaltskosten({ ...basis, kmProJahr: 30000 });
    expect(viel.centProKm).toBeLessThan(wenig.centProKm);
  });

  it('erhöht die Jahreskosten bei höherer Fahrleistung', () => {
    const wenig = berechneUnterhaltskosten({ ...basis, kmProJahr: 5000 });
    const viel = berechneUnterhaltskosten({ ...basis, kmProJahr: 30000 });
    expect(viel.gesamtProJahr).toBeGreaterThan(wenig.gesamtProJahr);
  });

  it('behandelt einen Restwert über dem Kaufpreis als keinen Wertverlust', () => {
    const r = berechneUnterhaltskosten({ ...basis, restwert: 30000 });
    expect(r.wertverlustProJahr).toBe(0);
  });

  it('bleibt bei 0 km pro Jahr endlich', () => {
    const r = berechneUnterhaltskosten({ ...basis, kmProJahr: 0 });
    expect(Number.isFinite(r.gesamtProJahr)).toBe(true);
    expect(r.centProKm).toBe(0);
  });

  it('bricht bei Haltedauer 0 nicht mit einer Division durch null', () => {
    const r = berechneUnterhaltskosten({ ...basis, haltedauerJahre: 0 });
    expect(Number.isFinite(r.wertverlustProJahr)).toBe(true);
  });

  it('behandelt fehlende Kostenangaben als null', () => {
    const r = berechneUnterhaltskosten({ kmProJahr: 10000, verbrauch: 6, spritpreis: 1.8 });
    expect(r.gesamtProJahr).toBeGreaterThan(0);
    expect(r.fixkostenProJahr).toBe(0);
  });

  it('weist den Fixkostenanteil als Prozentwert aus', () => {
    const r = berechneUnterhaltskosten(basis);
    expect(r.fixkostenAnteilProzent).toBeGreaterThan(0);
    expect(r.fixkostenAnteilProzent).toBeLessThan(100);
  });
});
