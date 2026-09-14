import { describe, it, expect } from 'vitest';
import { anrechenbareJahre, berechneAbfindung, MONATSVERDIENSTE_JE_JAHR, steuerAufAbfindung } from '../../public/scripts/abfindung.js';
import { einkommensteuer } from '../../public/scripts/einkommensteuer.js';

// § 1a Abs. 2 KSchG, abgerufen am 14.09.2026.

describe('anrechenbareJahre – § 1a Abs. 2 Satz 3 KSchG', () => {
  it('volle Jahre bleiben', () => {
    expect(anrechenbareJahre({ jahre: 10 })).toBe(10);
  });

  it('mehr als sechs Monate werden aufgerundet', () => {
    expect(anrechenbareJahre({ jahre: 5, monate: 7 })).toBe(6);
  });

  it('genau sechs Monate werden nicht aufgerundet', () => {
    expect(anrechenbareJahre({ jahre: 5, monate: 6 })).toBe(5);
  });

  it('Monate über zwölf werden zu Jahren', () => {
    expect(anrechenbareJahre({ jahre: 2, monate: 19 })).toBe(4);
  });

  it('unter sieben Monaten insgesamt: null Jahre', () => {
    expect(anrechenbareJahre({ jahre: 0, monate: 6 })).toBe(0);
    expect(anrechenbareJahre({ jahre: 0, monate: 7 })).toBe(1);
  });
});

describe('berechneAbfindung', () => {
  it('0,5 Monatsverdienste je Jahr', () => {
    expect(MONATSVERDIENSTE_JE_JAHR).toBe(0.5);
  });

  it('3.000 € × 10 Jahre = 15.000 €', () => {
    const r = berechneAbfindung({ bruttoMonat: 3000, jahre: 10 });
    expect(r.abfindung).toBe(15000);
    expect(r.monatsgehaelter).toBe(5);
  });

  it('mit Aufrundung: 4.000 € bei 7 Jahren und 8 Monaten', () => {
    const r = berechneAbfindung({ bruttoMonat: 4000, jahre: 7, monate: 8 });
    expect(r.jahre).toBe(8);
    expect(r.abfindung).toBe(16000);
  });

  it('ältere Schnittstelle mit dienstjahre', () => {
    expect(berechneAbfindung({ bruttoMonat: 3000, dienstjahre: 10 }).abfindung).toBe(15000);
  });
});

describe('steuerAufAbfindung – § 34 Abs. 1 EStG', () => {
  it('ohne Regel: Tarifdifferenz, mit Regel: Fünffaches der Differenz auf ein Fünftel', () => {
    const r = steuerAufAbfindung({ zvEOhne: 40000, abfindung: 15000 });

    expect(r.ohneFuenftelregelung).toBe(einkommensteuer(55000) - einkommensteuer(40000));
    expect(r.mitFuenftelregelung).toBe(5 * (einkommensteuer(43000) - einkommensteuer(40000)));
    expect(r.ersparnis).toBeGreaterThan(0);
  });

  it('im Spitzensteuersatz bringt die Regel nichts', () => {
    const r = steuerAufAbfindung({ zvEOhne: 300000, abfindung: 50000 });
    expect(r.ersparnis).toBeLessThanOrEqual(5);
  });
});
