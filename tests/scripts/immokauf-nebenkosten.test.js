import { describe, it, expect } from 'vitest';
import { berechneImmokaufNebenkosten } from '../../public/scripts/immokauf-nebenkosten.js';

describe('berechneImmokaufNebenkosten', () => {
  it('Bayern ohne Makler: nur GEW + Notar', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'by', mitMakler: false });
    expect(r.grunderwerbsteuer).toBe(14000); // 3,5%
    expect(r.maklerKaeufer).toBe(0);
    expect(r.gesamt).toBe(14000 + r.notar);
  });
  it('NRW hat 6,5% GEW', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 200000, bundesland: 'nw', mitMakler: false });
    expect(r.grunderwerbsteuer).toBe(13000);
  });
});
