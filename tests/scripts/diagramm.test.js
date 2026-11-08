import { describe, it, expect } from 'vitest';
import { reihe, achsenMarken } from '../../public/scripts/diagramm.js';

describe('reihe', () => {
  it('liefert beide Enden und rechnet jeden Punkt mit der Funktion', () => {
    const r = reihe(0, 1000, 250, (x) => ({ y: x * 2 }));
    expect(r.map((p) => p.x)).toEqual([0, 250, 500, 750, 1000]);
    expect(r.map((p) => p.y)).toEqual([0, 500, 1000, 1500, 2000]);
  });

  it('verliert durch Gleitkommafehler den letzten Punkt nicht', () => {
    const r = reihe(0, 1, 0.1, () => ({ y: 0 }));
    expect(r).toHaveLength(11);
  });
});

describe('achsenMarken', () => {
  it('verteilt die Marken gleichmäßig inklusive beider Enden', () => {
    expect(achsenMarken(0, 100, 3)).toEqual([0, 50, 100]);
  });

  it('gibt bei weniger als zwei Marken nur den Anfang zurück', () => {
    expect(achsenMarken(5, 100, 1)).toEqual([5]);
  });
});
