import { describe, it, expect } from 'vitest';
import {
  besteuerungsanteil,
  nettorente,
  kapitalbedarf,
  sparrateFuer,
  berechneRentenluecke,
} from '../../public/scripts/rentenluecke.js';
import { einkommensteuer } from '../../public/scripts/einkommensteuer.js';
import { rentnerBeitraege } from '../../public/scripts/rentenwerte.js';

// § 22 Nr. 1 Satz 3 Buchst. a Doppelbuchst. aa EStG, abgerufen am 14.09.2026.
const TABELLE = [
  [2000, 50], [2005, 50], [2006, 52], [2020, 80], [2021, 81], [2022, 82],
  [2023, 82.5], [2024, 83], [2025, 83.5], [2026, 84], [2030, 86], [2032, 87],
  [2033, 87.5], [2048, 95], [2050, 96], [2057, 99.5], [2058, 100], [2070, 100],
];

describe('besteuerungsanteil', () => {
  it.each(TABELLE)('Rentenbeginn %i → %d %%', (jahr, anteil) => {
    expect(besteuerungsanteil(jahr)).toBe(anteil);
  });
});

describe('nettorente', () => {
  it('Beiträge aus rentenwerte.js, Steuer auf den Besteuerungsanteil', () => {
    const r = nettorente({ bruttoMonat: 1800, jahrRentenbeginn: 2050, elternteil: true });
    const sv = rentnerBeitraege({ bruttorente: 1800, elternteil: true });
    const zvE = 1800 * 12 * 0.96 - 102 - sv.gesamt * 12 - 36;

    expect(r.besteuerungsanteil).toBe(96);
    expect(r.krankenversicherung).toBe(sv.krankenversicherung);
    expect(r.zvE).toBe(Math.floor(zvE));
    expect(r.steuerMonat).toBe(Math.round((einkommensteuer(zvE) / 12) * 100) / 100);
    expect(r.netto).toBe(Math.round((1800 - sv.gesamt - einkommensteuer(zvE) / 12) * 100) / 100);
  });

  it('kleine Rente: keine Einkommensteuer', () => {
    expect(nettorente({ bruttoMonat: 1000, jahrRentenbeginn: 2040 }).steuerMonat).toBe(0);
  });

  it('Kinderlose zahlen mehr Pflegeversicherung', () => {
    const eltern = nettorente({ bruttoMonat: 1500, jahrRentenbeginn: 2040, elternteil: true });
    const kinderlos = nettorente({ bruttoMonat: 1500, jahrRentenbeginn: 2040, elternteil: false });
    expect(kinderlos.pflegeversicherung).toBeGreaterThan(eltern.pflegeversicherung);
  });
});

describe('kapitalbedarf und sparrateFuer', () => {
  it('ohne Rendite: einfache Summen', () => {
    expect(kapitalbedarf({ lueckeMonat: 500, jahre: 20 })).toBe(120000);
    expect(sparrateFuer({ zielkapital: 120000, jahre: 30 })).toBe(333.33);
  });

  it('mit Rendite: Barwert kleiner als die Summe, Rate kleiner als ohne Rendite', () => {
    const k = kapitalbedarf({ lueckeMonat: 500, jahre: 20, renditeProzent: 3 });
    expect(k).toBeLessThan(120000);
    expect(k).toBeCloseTo(500 * (1 - Math.pow(1.0025, -240)) / 0.0025, 1);

    const rate = sparrateFuer({ zielkapital: k, jahre: 30, renditeProzent: 3 });
    const endwert = rate * (Math.pow(1.0025, 360) - 1) / 0.0025;
    expect(endwert).toBeCloseTo(k, -1);
  });

  it('Sonderfälle', () => {
    expect(kapitalbedarf({ lueckeMonat: 0, jahre: 20 })).toBe(0);
    expect(sparrateFuer({ zielkapital: 1000, jahre: 0 })).toBeNull();
  });
});

describe('berechneRentenluecke', () => {
  it('keine Lücke, wenn das Netto reicht', () => {
    const r = berechneRentenluecke({ bruttoMonat: 2000, jahrRentenbeginn: 2045, wunschNetto: 1000, jahreBisRente: 20, bezugsjahre: 20 });
    expect(r.lueckeMonat).toBe(0);
    expect(r.kapitalbedarf).toBe(0);
    expect(r.sparrate).toBe(0);
  });

  it('Lücke = Wunschnetto minus Nettorente', () => {
    const r = berechneRentenluecke({ bruttoMonat: 1500, jahrRentenbeginn: 2055, wunschNetto: 2000, jahreBisRente: 30, bezugsjahre: 20, renditeProzent: 0 });
    expect(r.lueckeMonat).toBe(Math.round((2000 - r.rente.netto) * 100) / 100);
    expect(r.kapitalbedarf).toBe(Math.round(r.lueckeMonat * 240 * 100) / 100);
  });
});
