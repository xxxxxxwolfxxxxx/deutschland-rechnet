import { describe, it, expect } from 'vitest';
import { berechneKfzSteuer } from '../../public/scripts/kfz-steuer.js';

describe('berechneKfzSteuer', () => {
  it('Benziner 1400 ccm, kein CO2-Aufschlag', () => {
    const r = berechneKfzSteuer({ antrieb: 'benzin', hubraum: 1400, co2: 0 });
    expect(r.steuerJahr).toBeGreaterThan(0);
  });
  it('Diesel hat höheren Grundsteuersatz als Benzin', () => {
    const b = berechneKfzSteuer({ antrieb: 'benzin', hubraum: 1400, co2: 120 });
    const d = berechneKfzSteuer({ antrieb: 'diesel', hubraum: 1400, co2: 120 });
    expect(d.steuerJahr).toBeGreaterThan(b.steuerJahr);
  });
  it('Elektro: keine Steuer bis 2030 (0 €)', () => {
    const r = berechneKfzSteuer({ antrieb: 'elektro', hubraum: 0, co2: 0 });
    expect(r.steuerJahr).toBe(0);
  });
});
