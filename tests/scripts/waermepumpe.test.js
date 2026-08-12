import { describe, it, expect } from 'vitest';
import { berechneWärmepumpe } from '../../public/scripts/waermepumpe.js';
import { emissionsfaktor } from '../../public/scripts/heizkosten.js';
import { STROMMIX_KG_JE_KWH } from '../../public/scripts/emissionsfaktoren.js';

// Standardfall der Seite: 15.000 kWh Gas, JAZ 3,5, 10 ct/kWh Gas,
// 30 ct/kWh Strom, 15.000 Euro Investition, 30 % Förderung.
const standard = {
  verbrauch: 15000,
  gaskosten: 10,
  stromkosten: 30,
  wpJahrescope: 3.5,
  investition: 15000,
  förderung: 30,
};

describe('berechneWärmepumpe – Betriebskosten und Amortisation', () => {
  it('rechnet die Gaskosten aus Verbrauch und Arbeitspreis in Cent', () => {
    expect(berechneWärmepumpe(standard).gasKosten).toBeCloseTo(1500, 2);
  });

  it('rechnet den Wärmepumpenstrom über die Jahresarbeitszahl', () => {
    // 15.000 kWh / 3,5 = 4.285,71 kWh Strom × 30 ct
    expect(berechneWärmepumpe(standard).wpKosten).toBeCloseTo(1285.71, 2);
  });

  it('weist die Ersparnis als Differenz beider Betriebskosten aus', () => {
    expect(berechneWärmepumpe(standard).ersparnis).toBeCloseTo(214.29, 2);
  });

  it('zieht die Förderung von der Investition ab', () => {
    expect(berechneWärmepumpe(standard).investitionNetto).toBeCloseTo(10500, 2);
  });

  it('gibt ohne Ersparnis keine Amortisationszeit aus', () => {
    const teuerStrom = berechneWärmepumpe({ ...standard, stromkosten: 50 });
    expect(teuerStrom.ersparnis).toBeLessThan(0);
    expect(teuerStrom.amortisation).toBe('N/A');
  });
});

describe('berechneWärmepumpe – CO2-Einsparung', () => {
  it('liefert das Ergebnis in Kilogramm, nicht in Tonnen', () => {
    const { co2EinsparungKg } = berechneWärmepumpe(standard);
    // Gas:  15.000 kWh × 0,18140 kg/kWh = 2.720,9 kg
    // Strom: 4.285,71 kWh × 0,344 kg/kWh = 1.474,3 kg
    expect(co2EinsparungKg).toBe(1247);
  });

  it('rundet auf volle Kilogramm', () => {
    expect(Number.isInteger(berechneWärmepumpe(standard).co2EinsparungKg)).toBe(true);
  });

  it('verwendet für Erdgas den Standardwert der EBeV 2030 Anlage 2 Teil 4', () => {
    // Ohne Wärmepumpenstrom (JAZ so hoch, dass er vernachlässigbar ist) muss
    // die Einsparung den Gasemissionen entsprechen.
    const ohneStrom = berechneWärmepumpe({ ...standard, wpJahrescope: 1e9 });
    expect(ohneStrom.co2EinsparungKg).toBe(Math.round(15000 * emissionsfaktor('gas')));
    expect(emissionsfaktor('gas')).toBeCloseTo(0.1814, 4);
  });

  it('verwendet für den Wärmepumpenstrom den UBA-Strommix', () => {
    // Bei JAZ 1 arbeitet die Wärmepumpe wie ein Heizstab: der volle Verbrauch
    // wird zu Strom, die Differenz ist rein faktorbedingt.
    const heizstab = berechneWärmepumpe({ ...standard, wpJahrescope: 1 });
    const erwartet = 15000 * emissionsfaktor('gas') - 15000 * STROMMIX_KG_JE_KWH;
    expect(heizstab.co2EinsparungKg).toBe(Math.round(erwartet));
  });

  it('weist eine Mehrbelastung als negativen Wert aus, statt sie zu kappen', () => {
    // Mit JAZ 1 ist der Strommix schmutziger als die Gasverbrennung.
    expect(berechneWärmepumpe({ ...standard, wpJahrescope: 1 }).co2EinsparungKg).toBeLessThan(0);
  });

  it('skaliert linear mit dem Verbrauch', () => {
    const einfach = berechneWärmepumpe(standard).co2EinsparungKg;
    const doppelt = berechneWärmepumpe({ ...standard, verbrauch: 30000 }).co2EinsparungKg;
    expect(doppelt).toBeCloseTo(einfach * 2, -1);
  });

  it('führt den alten Schlüssel co2Einsparung nicht mehr, der Tonnen meinte', () => {
    expect(berechneWärmepumpe(standard).co2Einsparung).toBeUndefined();
  });
});
