import { describe, it, expect } from 'vitest';
import { angebotFuerRechner, PARTNER, ANGEBOTE } from '../../src/data/affiliate.mjs';

describe('angebotFuerRechner', () => {
  it('liefert null für Rechner ohne Angebot', () => {
    expect(angebotFuerRechner('bmi-rechner', PARTNER)).toBeNull();
  });

  it('liefert null, solange der Partner keinen Link hat', () => {
    const partner = { x: { name: 'X', url: '' } };
    const angebote = { 'kreditvergleich': { partner: 'x', text: 't', button: 'b' } };
    expect(angebotFuerRechner('kreditvergleich', partner, angebote)).toBeNull();
  });

  it('liefert Angebot samt Link, wenn der Partner eine https-URL hat', () => {
    const partner = { x: { name: 'X', url: 'https://example.com/a' } };
    const angebote = { 'kreditvergleich': { partner: 'x', text: 't', button: 'b' } };
    expect(angebotFuerRechner('kreditvergleich', partner, angebote)).toEqual({
      name: 'X', url: 'https://example.com/a', text: 't', button: 'b',
    });
  });

  it('lehnt Nicht-https-Links ab', () => {
    const partner = { x: { name: 'X', url: 'javascript:alert(1)' } };
    const angebote = { 'a-rechner': { partner: 'x', text: 't', button: 'b' } };
    expect(angebotFuerRechner('a-rechner', partner, angebote)).toBeNull();
  });

  it('verweist jedes Angebot auf einen existierenden Partner', () => {
    for (const [slug, a] of Object.entries(ANGEBOTE)) {
      expect(PARTNER[a.partner], slug).toBeDefined();
    }
  });
});
