import { describe, it, expect } from 'vitest';
import {
  maximalpulsFox,
  maximalpulsTanaka,
  zoneNachMaximalpuls,
  zoneNachKarvonen,
  trainingszonen,
  ZONEN,
} from '../../public/scripts/trainingspuls.js';

// Fox: HFmax = 220 − Alter. Tanaka u. a. 2001: HFmax = 208 − 0,7 × Alter
// (J Am Coll Cardiol 37, S. 153–156). Karvonen: Zielpuls = Ruhepuls +
// (HFmax − Ruhepuls) × Intensität.

describe('maximalpulsFox', () => {
  it('zieht das Alter von 220 ab', () => {
    expect(maximalpulsFox(35)).toBe(185);
    expect(maximalpulsFox(20)).toBe(200);
    expect(maximalpulsFox(60)).toBe(160);
  });
});

describe('maximalpulsTanaka', () => {
  it('rechnet 208 minus 0,7 mal Alter', () => {
    expect(maximalpulsTanaka(35)).toBeCloseTo(183.5, 10);
    expect(maximalpulsTanaka(60)).toBeCloseTo(166, 10);
  });

  it('schneidet sich mit Fox bei 40 Jahren', () => {
    // 220 − a = 208 − 0,7a  ⇔  0,3a = 12  ⇔  a = 40
    expect(maximalpulsTanaka(40)).toBeCloseTo(maximalpulsFox(40), 10);
  });

  it('liegt unter 40 Jahren unter Fox, darüber darüber', () => {
    expect(maximalpulsTanaka(20)).toBeLessThan(maximalpulsFox(20));
    expect(maximalpulsTanaka(70)).toBeGreaterThan(maximalpulsFox(70));
  });
});

describe('zoneNachMaximalpuls', () => {
  it('nimmt den reinen Prozentsatz des Maximalpuls', () => {
    expect(zoneNachMaximalpuls(185, 0.6)).toBeCloseTo(111, 10);
    expect(zoneNachMaximalpuls(185, 1)).toBeCloseTo(185, 10);
  });

  it('ignoriert den Ruhepuls – das ist der Unterschied zu Karvonen', () => {
    expect(zoneNachMaximalpuls(185, 0.5)).toBeCloseTo(92.5, 10);
  });
});

describe('zoneNachKarvonen', () => {
  it('setzt auf dem Ruhepuls auf', () => {
    // 65 + (185 − 65) × 0,6 = 65 + 72 = 137
    expect(zoneNachKarvonen(185, 65, 0.6)).toBeCloseTo(137, 10);
  });

  it('ergibt bei 0 % den Ruhepuls und bei 100 % den Maximalpuls', () => {
    expect(zoneNachKarvonen(185, 65, 0)).toBeCloseTo(65, 10);
    expect(zoneNachKarvonen(185, 65, 1)).toBeCloseTo(185, 10);
  });

  it('liegt für jede Intensität unter 100 % über dem reinen Prozentwert', () => {
    for (const i of [0.5, 0.6, 0.7, 0.8, 0.9]) {
      expect(zoneNachKarvonen(185, 65, i)).toBeGreaterThan(zoneNachMaximalpuls(185, i));
    }
  });

  it('fällt mit dem reinen Prozentwert zusammen, wenn der Ruhepuls null wäre', () => {
    expect(zoneNachKarvonen(185, 0, 0.7)).toBeCloseTo(zoneNachMaximalpuls(185, 0.7), 10);
  });
});

describe('trainingszonen', () => {
  const r = trainingszonen({ alter: 35, ruhepuls: 65 });

  it('liefert beide Maximalpuls-Schätzungen', () => {
    expect(r.maxFox).toBe(185);
    expect(r.maxTanaka).toBeCloseTo(183.5, 10);
  });

  it('liefert fünf Zonen', () => {
    expect(r.zonen).toHaveLength(5);
    expect(ZONEN).toHaveLength(5);
  });

  it('gibt je Zone beide Rechenwege aus', () => {
    const z = r.zonen.find((x) => x.von === 0.6);
    expect(z.prozentVon).toBe(111);
    expect(z.karvonenVon).toBe(137);
  });

  it('die Zonen stoßen lückenlos aneinander', () => {
    for (let i = 1; i < r.zonen.length; i++) {
      expect(r.zonen[i].von).toBeCloseTo(r.zonen[i - 1].bis, 10);
    }
  });

  it('die oberste Zone endet beim Maximalpuls', () => {
    const letzte = r.zonen[r.zonen.length - 1];
    expect(letzte.bis).toBe(1);
    expect(letzte.prozentBis).toBe(185);
    expect(letzte.karvonenBis).toBe(185);
  });

  it('meldet den Abstand der beiden Rechenwege je Zone', () => {
    const z = r.zonen.find((x) => x.von === 0.6);
    expect(z.abstandVon).toBe(26);
  });

  it('der Ruhepuls verändert das Ergebnis – anders als in der alten Fassung', () => {
    const a = trainingszonen({ alter: 35, ruhepuls: 50 });
    const b = trainingszonen({ alter: 35, ruhepuls: 80 });
    expect(a.zonen[1].karvonenVon).not.toBe(b.zonen[1].karvonenVon);
    // Der reine Prozentwert bleibt dagegen gleich.
    expect(a.zonen[1].prozentVon).toBe(b.zonen[1].prozentVon);
  });

  it('nimmt auf Wunsch Tanaka als Grundlage', () => {
    const t = trainingszonen({ alter: 35, ruhepuls: 65, formel: 'tanaka' });
    expect(t.maximalpuls).toBeCloseTo(183.5, 10);
    expect(t.zonen[t.zonen.length - 1].prozentBis).toBe(184);
  });

  it('weist unbrauchbare Eingaben zurück', () => {
    expect(() => trainingszonen({ alter: 0, ruhepuls: 65 })).toThrow();
    expect(() => trainingszonen({ alter: 35, ruhepuls: 200 })).toThrow();
  });
});
