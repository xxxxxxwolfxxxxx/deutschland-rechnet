import { describe, it, expect } from 'vitest';
import { berechneMutterschutz } from '../../public/scripts/mutterschutz.js';

describe('berechneMutterschutz', () => {
  it('beginnt 6 Wochen vor Geburtstermin', () => {
    const r = berechneMutterschutz({ geburtstermin: '2025-06-01' });
    expect(r.beginn).toBe('2025-04-20'); // 1. Juni - 42 Tage
  });
  it('endet 8 Wochen nach Geburt (normal)', () => {
    const r = berechneMutterschutz({ geburtstermin: '2025-06-01' });
    expect(r.ende).toBe('2025-07-27'); // 1. Juni + 56 Tage
  });
  it('endet 12 Wochen nach Frühgeburt', () => {
    const r = berechneMutterschutz({ geburtstermin: '2025-06-01', fruehgeburt: true });
    expect(r.ende).toBe('2025-08-24'); // 1. Juni + 84 Tage
  });
});
