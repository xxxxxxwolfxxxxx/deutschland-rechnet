import { describe, it, expect } from 'vitest';
import { berechneGrundumsatz } from '../../public/scripts/grundumsatz.js';

// Formel: Harris-Benedict in der von Roza und Shizgal 1984 revidierten
// Fassung (Am J Clin Nutr 40:168-182). Der Grundumsatz ist der Energiebedarf
// in völliger Ruhe; der Gesamtumsatz ergibt sich erst durch Multiplikation
// mit dem PAL-Wert und wird hier bewusst nicht berechnet.
//
//   Männer: 88,362 + 13,397 × kg + 4,799 × cm − 5,677 × Jahre
//   Frauen: 447,593 +  9,247 × kg + 3,098 × cm − 4,330 × Jahre

describe('berechneGrundumsatz – Männer', () => {
  it('80 kg, 180 cm, 30 Jahre ergeben 1854 kcal', () => {
    // 88,362 + 1071,76 + 863,82 − 170,31 = 1853,632
    const r = berechneGrundumsatz({ gewicht: 80, groesse: 180, alter: 30, geschlecht: 'm' });
    expect(r.grundumsatz).toBe(1854);
  });

  it('folgt exakt der revidierten Harris-Benedict-Formel', () => {
    const gewicht = 92;
    const groesse = 187;
    const alter = 45;
    const erwartet = Math.round(88.362 + 13.397 * gewicht + 4.799 * groesse - 5.677 * alter);

    expect(berechneGrundumsatz({ gewicht, groesse, alter, geschlecht: 'm' }).grundumsatz).toBe(erwartet);
  });
});

describe('berechneGrundumsatz – Frauen', () => {
  it('65 kg, 168 cm, 30 Jahre ergeben 1439 kcal', () => {
    // 447,593 + 601,055 + 520,464 − 129,90 = 1439,212
    const r = berechneGrundumsatz({ gewicht: 65, groesse: 168, alter: 30, geschlecht: 'w' });
    expect(r.grundumsatz).toBe(1439);
  });

  it('folgt exakt der revidierten Harris-Benedict-Formel', () => {
    const gewicht = 58;
    const groesse = 162;
    const alter = 52;
    const erwartet = Math.round(447.593 + 9.247 * gewicht + 3.098 * groesse - 4.33 * alter);

    expect(berechneGrundumsatz({ gewicht, groesse, alter, geschlecht: 'w' }).grundumsatz).toBe(erwartet);
  });

  it('rechnet für jede Angabe außer "m" mit der Frauenformel', () => {
    const divers = berechneGrundumsatz({ gewicht: 70, groesse: 175, alter: 40, geschlecht: 'd' });
    const frau = berechneGrundumsatz({ gewicht: 70, groesse: 175, alter: 40, geschlecht: 'w' });

    expect(divers.grundumsatz).toBe(frau.grundumsatz);
  });
});

describe('Verhalten der Formel', () => {
  it('bei gleichen Maßen liegt der Wert für Männer höher', () => {
    const mann = berechneGrundumsatz({ gewicht: 75, groesse: 175, alter: 35, geschlecht: 'm' });
    const frau = berechneGrundumsatz({ gewicht: 75, groesse: 175, alter: 35, geschlecht: 'w' });

    expect(mann.grundumsatz).toBeGreaterThan(frau.grundumsatz);
  });

  it('sinkt mit steigendem Alter um 5,677 kcal je Jahr (Männer)', () => {
    const jung = berechneGrundumsatz({ gewicht: 80, groesse: 180, alter: 30, geschlecht: 'm' });
    const aelter = berechneGrundumsatz({ gewicht: 80, groesse: 180, alter: 40, geschlecht: 'm' });

    expect(jung.grundumsatz - aelter.grundumsatz).toBe(Math.round(5.677 * 10));
  });

  it('steigt mit dem Gewicht', () => {
    const leicht = berechneGrundumsatz({ gewicht: 60, groesse: 170, alter: 30, geschlecht: 'w' });
    const schwer = berechneGrundumsatz({ gewicht: 90, groesse: 170, alter: 30, geschlecht: 'w' });

    expect(schwer.grundumsatz).toBeGreaterThan(leicht.grundumsatz);
  });

  it('liefert einen ganzzahligen Wert', () => {
    const r = berechneGrundumsatz({ gewicht: 73.4, groesse: 176.5, alter: 41, geschlecht: 'm' });

    expect(Number.isInteger(r.grundumsatz)).toBe(true);
  });
});
