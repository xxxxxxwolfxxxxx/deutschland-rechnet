import { describe, it, expect } from 'vitest';
import { berechneBootstrailer } from '../../public/scripts/bootstrailer.js';

describe('berechneBootstrailer', () => {
  it('Anhänger bis 750 kg ist mit B immer erlaubt', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2000, anhaengerKg: 700 });
    expect(r.klasse).toBe('B');
    expect(r.erlaubtMitB).toBe(true);
    expect(r.kombinationKg).toBe(2700);
  });

  it('schwerer Anhänger bleibt B, solange die Kombination unter 3.500 kg liegt', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2000, anhaengerKg: 1300 });
    expect(r.klasse).toBe('B');
    expect(r.kombinationKg).toBe(3300);
    expect(r.spielraumKg).toBe(200);
  });

  it('3.500 bis 4.250 kg Kombination erfordert B96', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2500, anhaengerKg: 1300 });
    expect(r.klasse).toBe('B96');
    expect(r.erlaubtMitB).toBe(false);
    expect(r.kombinationKg).toBe(3800);
  });

  it('über 4.250 kg Kombination erfordert BE', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2500, anhaengerKg: 2000 });
    expect(r.klasse).toBe('BE');
    expect(r.kombinationKg).toBe(4500);
  });

  it('genau 3.500 kg Kombination ist noch B', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2200, anhaengerKg: 1300 });
    expect(r.klasse).toBe('B');
    expect(r.spielraumKg).toBe(0);
  });

  it('Zugfahrzeug über 3,5 t verlässt den B-Bereich', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 4000, anhaengerKg: 1000 });
    expect(r.klasse).toBe('C1E');
    expect(r.zugfahrzeugZuSchwer).toBe(true);
  });

  it('Anhänger über 3,5 t sprengt auch BE', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 3000, anhaengerKg: 4000 });
    expect(r.klasse).toBe('C1E');
    expect(r.anhaengerZuSchwer).toBe(true);
  });
});
