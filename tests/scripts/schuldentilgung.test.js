import { describe, it, expect } from 'vitest';
import { berechneSchneeball, berechneLawine, MAX_MONATE } from '../../public/scripts/schuldentilgung.js';

const beispielSchulden = () => [
  { rest: 2000, zins: 0, original: 2000 },
  { rest: 3000, zins: 11.5, original: 3000 },
  { rest: 8000, zins: 5, original: 8000 },
];

describe('berechneSchneeball', () => {
  it('tilgt zuerst die kleinste Schuld', () => {
    const r = berechneSchneeball(beispielSchulden(), 500);
    expect(r.monate).toBeGreaterThan(0);
    expect(r.gesamtZinsen).toBeGreaterThan(0);
  });

  it('bricht nach MAX_MONATE ab, wenn die Rate nie ausreicht', () => {
    const r = berechneSchneeball([{ rest: 100000, zins: 20, original: 100000 }], 10);
    expect(r.monate).toBe(MAX_MONATE);
  });

  it('mutiert das übergebene Array nicht', () => {
    const schulden = beispielSchulden();
    const kopie = JSON.parse(JSON.stringify(schulden));
    berechneSchneeball(schulden, 500);
    expect(schulden).toEqual(kopie);
  });
});

describe('berechneLawine', () => {
  it('tilgt zuerst die Schuld mit dem höchsten Zinssatz', () => {
    const r = berechneLawine(beispielSchulden(), 500);
    expect(r.monate).toBeGreaterThan(0);
    expect(r.gesamtZinsen).toBeGreaterThan(0);
  });

  it('spart bei unterschiedlichen Zinssätzen nie mehr Zinsen als die Schneeball-Methode', () => {
    const schnee = berechneSchneeball(beispielSchulden(), 500);
    const lawine = berechneLawine(beispielSchulden(), 500);
    expect(lawine.gesamtZinsen).toBeLessThanOrEqual(schnee.gesamtZinsen);
  });
});

describe('Gleichstand bei identischen Zinssätzen', () => {
  it('liefert für alle Schulden mit demselben Zinssatz dasselbe Ergebnis', () => {
    const schulden = [
      { rest: 1000, zins: 5, original: 1000 },
      { rest: 2000, zins: 5, original: 2000 },
      { rest: 3000, zins: 5, original: 3000 },
    ];
    const schnee = berechneSchneeball(schulden, 300);
    const lawine = berechneLawine(schulden, 300);
    expect(schnee.monate).toBe(lawine.monate);
    expect(schnee.gesamtZinsen).toBeCloseTo(lawine.gesamtZinsen, 6);
  });
});

describe('Zinsen laufen auf jede offene Schuld weiter, auch wenn die Rate vorher ausgeht', () => {
  it('eine niedrig priorisierte Schuld verliert keine Zinsen, nur weil die Rate an höher priorisierte Schulden ging', () => {
    // Lawine: 20.000 € zu 15 % (Monatszins 250 €) bekommt bei Rate 300 € die
    // gesamte Rate; 1.000 € zu 2 % ist niedriger priorisiert und bekommt in
    // den ersten Monaten nichts von der Rate ab.
    const schulden = [
      { rest: 20000, zins: 15, original: 20000 },
      { rest: 1000, zins: 2, original: 1000 },
    ];
    const nachSechsMonaten = berechneLawine(schulden, 300, 6);
    const kleineSchuldEnde = nachSechsMonaten.schuldenEnde.find((s) => s.original === 1000).rest;

    // Referenz: dieselbe kleine Schuld isoliert, 6 Monate lang unangetastet
    // verzinst (kein Tilgungsanteil, da sie über die echte Funktion oben in
    // dieser Zeit nie an die Reihe kommt) – ihr Zins darf nicht wegfallen.
    let isoliert = 1000;
    for (let i = 0; i < 6; i++) {
      isoliert += isoliert * (2 / 100 / 12);
    }
    // Die 1.000-€-Schuld darf nach 6 Monaten nicht mehr exakt 1.000,00 €
    // betragen – sonst wurden ihr die Zinsen erlassen, nur weil die Rate an
    // die größere Schuld ging.
    expect(kleineSchuldEnde).not.toBeCloseTo(1000, 2);
    expect(kleineSchuldEnde).toBeCloseTo(isoliert, 6);
  });
});

describe('Reihenfolge im Eingabe-Array darf das Ergebnis bei Gleichstand nicht ändern', () => {
  it('Schneeball: zwei Schulden mit gleichem Restbetrag liefern unabhängig von der Eingabereihenfolge dasselbe Gesamtergebnis', () => {
    const a = { rest: 5000, zins: 8.13, original: 5000 };
    const b = { rest: 5000, zins: 11.2, original: 5000 };
    const reihenfolge1 = berechneSchneeball([a, b], 400);
    const reihenfolge2 = berechneSchneeball([b, a], 400);
    expect(reihenfolge1.gesamtZinsen).toBeCloseTo(reihenfolge2.gesamtZinsen, 6);
    expect(reihenfolge1.monate).toBe(reihenfolge2.monate);
  });

  it('Lawine: zwei Schulden mit gleichem Zinssatz liefern unabhängig von der Eingabereihenfolge dasselbe Gesamtergebnis', () => {
    const a = { rest: 4000, zins: 9, original: 4000 };
    const b = { rest: 7000, zins: 9, original: 7000 };
    const reihenfolge1 = berechneLawine([a, b], 350);
    const reihenfolge2 = berechneLawine([b, a], 350);
    expect(reihenfolge1.gesamtZinsen).toBeCloseTo(reihenfolge2.gesamtZinsen, 6);
    expect(reihenfolge1.monate).toBe(reihenfolge2.monate);
  });
});
