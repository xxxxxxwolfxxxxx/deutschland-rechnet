import { describe, it, expect } from 'vitest';
import {
  berechneImmokaufNebenkosten,
  MAKLER_PROVISION_PROZENT_JE_SEITE,
} from '../../public/scripts/immokauf-nebenkosten.js';
import { berechneNotarUndGrundbuch } from '../../public/scripts/gnotkg.js';

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

describe('Maklerprovision je Seite nach § 656c BGB', () => {
  // 3,57 % sind der Bruttosatz je Seite (3,0 % zzgl. 19 % USt). Das Modul
  // schlug darauf bis 12.08.2026 ein zweites Mal Umsatzsteuer auf und
  // halbierte den Betrag zusätzlich – der Käuferanteil war dadurch zu niedrig.
  it('ist der Bruttosatz je Seite, nicht ein Nettosatz', () => {
    expect(MAKLER_PROVISION_PROZENT_JE_SEITE).toBe(3.57);
  });

  it('rechnet den Käuferanteil ohne zweite Umsatzsteuer und ohne zweite Halbierung', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'by' });
    expect(r.maklerKaeufer).toBe(14280); // 400.000 × 3,57 %
  });
});

describe('Notarkosten kommen aus gnotkg.js', () => {
  // Vorher pauschal 1,5 % des Kaufpreises – tatsächlich Wertgebühren nach
  // § 34 GNotKG und damit degressiv.
  it('rechnet die Wertgebühren nach Tabelle B statt einer Pauschale', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'by', mitMakler: false });
    expect(r.notar).toBe(berechneNotarUndGrundbuch(400000).gesamt);
    expect(r.notar).toBe(3979.95);
  });
});
