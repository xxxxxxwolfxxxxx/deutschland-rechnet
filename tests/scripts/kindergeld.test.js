import { describe, it, expect } from 'vitest';
import { berechneKindergeld } from '../../public/scripts/kindergeld.js';

describe('berechneKindergeld', () => {
  it('1 Kind = 255 €/Monat', () => {
    const r = berechneKindergeld({ anzahlKinder: 1 });
    expect(r.monat).toBe(255);
    expect(r.jahr).toBe(3060);
  });
  it('3 Kinder = 765 €/Monat', () => {
    const r = berechneKindergeld({ anzahlKinder: 3 });
    expect(r.monat).toBe(765);
  });
  it('betragProKind ist 255', () => {
    const r = berechneKindergeld({ anzahlKinder: 2 });
    expect(r.betragProKind).toBe(255);
  });
});
