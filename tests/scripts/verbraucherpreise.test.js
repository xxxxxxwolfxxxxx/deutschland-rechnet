import { describe, it, expect } from 'vitest';
import {
  VPI_BASISJAHR,
  VPI_STAND,
  VPI_VORJAHR,
  VPI_ABTEILUNGEN,
  ABTEILUNGEN,
  GESAMTINDEX,
  anstiegSeitBasis,
  jahresrate,
  kaufkraft,
  heutigerPreis,
} from '../../public/scripts/verbraucherpreise.js';

// Werte des Statistischen Bundesamts, Stand Juli 2026, Basis 2020 = 100.
describe('Verbraucherpreisindex', () => {
  it('trägt Basisjahr und Stand', () => {
    expect(VPI_BASISJAHR).toBe(2020);
    expect(VPI_STAND).toBe('2026-07');
    expect(VPI_VORJAHR).toBe('2025-07');
  });

  it('führt den Gesamtindex und genau zwölf Abteilungen', () => {
    expect(VPI_ABTEILUNGEN).toHaveLength(13);
    expect(ABTEILUNGEN).toHaveLength(12);
    expect(GESAMTINDEX.nr).toBe(0);
  });

  it('vergibt die COICOP-Nummern eins bis zwölf lückenlos', () => {
    expect(ABTEILUNGEN.map((a) => a.nr)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('Gesamtindex liegt bei 125,6 – 25,6 Prozent über dem Basisjahr', () => {
    expect(GESAMTINDEX.aktuell).toBe(125.6);
    expect(anstiegSeitBasis(GESAMTINDEX)).toBeCloseTo(0.256, 5);
  });

  it('Jahresrate des Gesamtindex aus Juli gegen Juli', () => {
    expect(jahresrate(GESAMTINDEX)).toBeCloseTo(125.6 / 122.2 - 1, 10);
  });

  // Der Gesamtindex ist ein gewichteter Durchschnitt. Er muss deshalb zwischen
  // den Extremen liegen – täte er das nicht, wäre eine Zahl falsch abgetippt.
  it('Gesamtindex liegt zwischen der teuersten und der günstigsten Abteilung', () => {
    const staende = ABTEILUNGEN.map((a) => a.aktuell);
    expect(GESAMTINDEX.aktuell).toBeGreaterThan(Math.min(...staende));
    expect(GESAMTINDEX.aktuell).toBeLessThan(Math.max(...staende));
  });

  it('Post und Telekommunikation ist die einzige Abteilung unter dem Basisjahr', () => {
    const guenstiger = ABTEILUNGEN.filter((a) => a.aktuell < 100);
    expect(guenstiger.map((a) => a.nr)).toEqual([8]);
    expect(anstiegSeitBasis(guenstiger[0])).toBeLessThan(0);
  });

  it('Verkehr ist die teuerste Abteilung', () => {
    const teuerste = [...ABTEILUNGEN].sort((a, b) => b.aktuell - a.aktuell)[0];
    expect(teuerste.nr).toBe(7);
  });

  it('kaufkraft teilt durch den Index, statt den Anstieg abzuziehen', () => {
    expect(kaufkraft(100, GESAMTINDEX)).toBeCloseTo(79.62, 2);
    // Der verbreitete Fehler wäre 100 − 25,6 = 74,40 €.
    expect(kaufkraft(100, GESAMTINDEX)).not.toBeCloseTo(74.4, 1);
  });

  it('kaufkraft steigt, wo der Index unter 100 liegt', () => {
    const post = ABTEILUNGEN.find((a) => a.nr === 8);
    expect(kaufkraft(100, post)).toBeGreaterThan(100);
  });

  it('heutigerPreis und kaufkraft sind zueinander invers', () => {
    for (const a of VPI_ABTEILUNGEN) {
      expect(kaufkraft(heutigerPreis(250, a), a)).toBeCloseTo(250, 8);
    }
  });
});
