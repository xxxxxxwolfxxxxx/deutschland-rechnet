import { describe, it, expect } from 'vitest';
import { berechneAnkerkette } from '../../public/scripts/ankerkette.js';

describe('berechneAnkerkette', () => {
  it('rechnet ab Ankerrolle, nicht ab Wasseroberfläche', () => {
    const r = berechneAnkerkette({ wassertiefeM: 5, bughoeheM: 1 });
    expect(r.rechentiefeM).toBe(6);
    expect(r.faktor).toBe(5);
    expect(r.benoetigtM).toBe(30);
  });

  it('rechnet den Tidenhub auf die Tiefe auf', () => {
    const r = berechneAnkerkette({
      wassertiefeM: 5,
      bughoeheM: 1,
      tidenhubM: 2,
      lage: 'sturm',
    });
    expect(r.rechentiefeM).toBe(8);
    expect(r.faktor).toBe(7);
    expect(r.benoetigtM).toBe(56);
  });

  it('Leine braucht mehr Vorlauf als Kette', () => {
    const kette = berechneAnkerkette({ wassertiefeM: 5, material: 'kette', lage: 'maessig' });
    const leine = berechneAnkerkette({ wassertiefeM: 5, material: 'leine', lage: 'maessig' });
    expect(leine.benoetigtM).toBeGreaterThan(kette.benoetigtM);
    expect(leine.faktor).toBe(7);
  });

  it('Sturm verlangt mehr Vorlauf als ruhiges Wetter', () => {
    const ruhig = berechneAnkerkette({ wassertiefeM: 5, lage: 'ruhig' });
    const sturm = berechneAnkerkette({ wassertiefeM: 5, lage: 'sturm' });
    expect(sturm.benoetigtM).toBeGreaterThan(ruhig.benoetigtM);
  });

  it('nutzt Kette bei mäßigem Wind als Standard', () => {
    const r = berechneAnkerkette({ wassertiefeM: 4 });
    expect(r.faktor).toBe(5);
    expect(r.lageText).toContain('5 Bft');
  });

  it('Tiefe null ergibt keinen Vorlauf ohne Bughöhe', () => {
    const r = berechneAnkerkette({ wassertiefeM: 0, bughoeheM: 0 });
    expect(r.benoetigtM).toBe(0);
  });
});
