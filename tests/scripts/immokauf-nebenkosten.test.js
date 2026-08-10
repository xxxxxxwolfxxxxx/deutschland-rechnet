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

describe('Grunderwerbsteuersätze kommen aus grunderwerbsteuer.js', () => {
  // Das Modul führte bis 10.08.2026 eine eigene Kopie der Satztabelle, die zwei
  // Gesetzesänderungen hinterher war. Diese Tests halten die Kopplung fest.
  it('Thüringen rechnet mit 5,0 % (nicht mehr 6,5 %)', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'th', mitMakler: false });
    expect(r.gewSatz).toBe(5.0);
    expect(r.grunderwerbsteuer).toBe(20000);
  });
  it('Bremen rechnet mit 5,5 % (nicht mehr 5,0 %)', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'hb', mitMakler: false });
    expect(r.gewSatz).toBe(5.5);
    expect(r.grunderwerbsteuer).toBe(22000);
  });
});
