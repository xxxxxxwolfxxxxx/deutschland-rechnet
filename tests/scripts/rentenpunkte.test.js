import { describe, it, expect } from 'vitest';
import { berechneRentenpunkte } from '../../public/scripts/rentenpunkte.js';

describe('berechneRentenpunkte', () => {
  it('Durchschnittsentgelt ergibt genau einen Entgeltpunkt', () => {
    const r = berechneRentenpunkte({ bruttoJahr: 51944 });
    expect(r.entgeltpunkte).toBe(1);
  });

  it('doppeltes Entgelt ergibt keine zwei Punkte, weil die Beitragsbemessungsgrenze dazwischenliegt', () => {
    // 103.888 € liegen über der Grenze von 101.400 €
    const r = berechneRentenpunkte({ bruttoJahr: 103888 });
    expect(r.entgeltpunkte).toBe(1.9521);
    expect(r.ueberBeitragsbemessungsgrenze).toBe(true);
    expect(r.beitragspflichtigesEntgelt).toBe(101400);
  });

  it('meldet kein Überschreiten, solange das Entgelt unter der Grenze bleibt', () => {
    const r = berechneRentenpunkte({ bruttoJahr: 45000 });
    expect(r.ueberBeitragsbemessungsgrenze).toBe(false);
    expect(r.beitragspflichtigesEntgelt).toBe(45000);
    expect(r.entgeltpunkte).toBe(0.8663);
  });

  it('addiert die Punkte über mehrere Jahre', () => {
    const r = berechneRentenpunkte({ bruttoJahr: 51944, jahre: 10 });
    expect(r.entgeltpunkteGesamt).toBe(10);
  });

  it('bewertet einen Entgeltpunkt mit dem aktuellen Rentenwert', () => {
    const r = berechneRentenpunkte({ bruttoJahr: 51944 });
    expect(r.rentenwert).toBe(42.52);
    expect(r.monatsrente).toBe(42.52);
  });

  it('rechnet die Monatsrente aus den Punkten aller Jahre', () => {
    const r = berechneRentenpunkte({ bruttoJahr: 51944, jahre: 40 });
    expect(r.entgeltpunkteGesamt).toBe(40);
    expect(r.monatsrente).toBe(1700.8);
  });

  it('behandelt fehlende Angaben als ein Jahr ohne Entgelt', () => {
    const r = berechneRentenpunkte({});
    expect(r.entgeltpunkte).toBe(0);
    expect(r.entgeltpunkteGesamt).toBe(0);
    expect(r.monatsrente).toBe(0);
  });
});
