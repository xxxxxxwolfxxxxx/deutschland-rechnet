import { describe, it, expect } from 'vitest';
import { berechneRumpfgeschwindigkeit } from '../../public/scripts/rumpfgeschwindigkeit.js';

describe('berechneRumpfgeschwindigkeit', () => {
  it('9 m Wasserlinie ergeben 7,29 Knoten', () => {
    const r = berechneRumpfgeschwindigkeit({ wasserlinieM: 9 });
    expect(r.rumpfgeschwindigkeitKn).toBe(7.29);
  });

  it('rechnet Knoten in km/h um', () => {
    const r = berechneRumpfgeschwindigkeit({ wasserlinieM: 9 });
    expect(r.rumpfgeschwindigkeitKmh).toBe(13.5);
  });

  it('Marschfahrt liegt bei 80 Prozent der Rumpfgeschwindigkeit', () => {
    const r = berechneRumpfgeschwindigkeit({ wasserlinieM: 9 });
    expect(r.gemuetlichKn).toBe(5.83);
  });

  it('die Gleitgrenze liegt deutlich darüber', () => {
    const r = berechneRumpfgeschwindigkeit({ wasserlinieM: 9 });
    expect(r.gleitgrenzeKn).toBe(10.94);
  });

  it('vierfache Länge verdoppelt die Geschwindigkeit', () => {
    const kurz = berechneRumpfgeschwindigkeit({ wasserlinieM: 4 });
    const lang = berechneRumpfgeschwindigkeit({ wasserlinieM: 16 });
    expect(lang.rumpfgeschwindigkeitKn).toBeCloseTo(kurz.rumpfgeschwindigkeitKn * 2, 5);
  });

  it('Länge null ergibt null', () => {
    const r = berechneRumpfgeschwindigkeit({ wasserlinieM: 0 });
    expect(r.rumpfgeschwindigkeitKn).toBe(0);
  });
});
