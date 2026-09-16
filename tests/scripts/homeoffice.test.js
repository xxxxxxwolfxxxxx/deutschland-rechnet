import { describe, it, expect } from 'vitest';
import { TAGESPAUSCHALE, TAGESPAUSCHALE_HOECHSTBETRAG, tagespauschale } from '../../public/scripts/homeoffice.js';

describe('Tagespauschale nach § 4 Abs. 5 Satz 1 Nr. 6c EStG', () => {
  it('beträgt 6 € je Tag und höchstens 1.260 € im Jahr', () => {
    expect(TAGESPAUSCHALE).toBe(6);
    expect(TAGESPAUSCHALE_HOECHSTBETRAG).toBe(1260);
  });

  it('rechnet Tage mal 6 € bis zum Höchstbetrag', () => {
    expect(tagespauschale(100)).toBe(600);
    expect(tagespauschale(210)).toBe(1260);
    expect(tagespauschale(250)).toBe(1260);
  });

  it('zählt nur volle Tage und keine negativen Werte', () => {
    expect(tagespauschale(10.9)).toBe(60);
    expect(tagespauschale(-5)).toBe(0);
    expect(tagespauschale(undefined)).toBe(0);
  });
});
