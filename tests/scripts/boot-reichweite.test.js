import { describe, it, expect } from 'vitest';
import {
  berechneBootReichweite,
  schaetzeVerbrauchProStunde,
} from '../../public/scripts/boot-reichweite.js';

describe('berechneBootReichweite', () => {
  it('rechnet Reichweite aus Tank, Verbrauch und Fahrt', () => {
    const r = berechneBootReichweite({
      tankLiter: 200,
      verbrauchProStunde: 20,
      geschwindigkeitKn: 6,
      reserveProzent: 33,
    });
    expect(r.nutzbarLiter).toBe(134);
    expect(r.fahrzeitStunden).toBe(6.7);
    expect(r.reichweiteSm).toBe(40.2);
    expect(r.reichweiteKm).toBe(74.5);
  });

  it('ohne Reserve steht der ganze Tank zur Verfügung', () => {
    const r = berechneBootReichweite({
      tankLiter: 100,
      verbrauchProStunde: 10,
      geschwindigkeitKn: 5,
      reserveProzent: 0,
    });
    expect(r.nutzbarLiter).toBe(100);
    expect(r.fahrzeitStunden).toBe(10);
    expect(r.reichweiteSm).toBe(50);
  });

  it('rechnet Kosten je Seemeile aus dem Literpreis', () => {
    const r = berechneBootReichweite({
      tankLiter: 200,
      verbrauchProStunde: 20,
      geschwindigkeitKn: 10,
      preisProLiter: 2,
    });
    expect(r.verbrauchProSm).toBe(2);
    expect(r.kostenProSm).toBe(4);
    expect(r.kostenTankfuellung).toBe(400);
  });

  it('Verbrauch null führt nicht zu Division durch null', () => {
    const r = berechneBootReichweite({
      tankLiter: 200,
      verbrauchProStunde: 0,
      geschwindigkeitKn: 6,
    });
    expect(r.fahrzeitStunden).toBe(0);
    expect(r.reichweiteSm).toBe(0);
  });

  it('Geschwindigkeit null ergibt keine Reichweite', () => {
    const r = berechneBootReichweite({
      tankLiter: 200,
      verbrauchProStunde: 20,
      geschwindigkeitKn: 0,
    });
    expect(r.reichweiteSm).toBe(0);
    expect(r.verbrauchProSm).toBe(0);
  });
});

describe('schaetzeVerbrauchProStunde', () => {
  it('schätzt Benziner mit 0,35 l je PS bei 75 % Last', () => {
    expect(schaetzeVerbrauchProStunde(100, 'benzin')).toBe(26.3);
  });

  it('Diesel verbraucht weniger als Benzin', () => {
    expect(schaetzeVerbrauchProStunde(100, 'diesel')).toBe(16.5);
  });

  it('fällt ohne Angabe auf Benzin zurück', () => {
    expect(schaetzeVerbrauchProStunde(100)).toBe(26.3);
  });
});
