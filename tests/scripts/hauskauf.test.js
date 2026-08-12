import { describe, it, expect } from 'vitest';
import { berechneHauskauf } from '../../public/scripts/hauskauf.js';
import { STEUERSAETZE } from '../../public/scripts/grunderwerbsteuer.js';
import { berechneNotarUndGrundbuch } from '../../public/scripts/gnotkg.js';
import { MAKLER_PROVISION_PROZENT_JE_SEITE } from '../../public/scripts/immokauf-nebenkosten.js';

const BASIS = {
  kaufpreis: 400000,
  bundesland: 'NW',
  eigenkapital: 80000,
  zins: 3.5,
  tilgung: 2,
  laufzeit: 10,
  makler: false,
};

describe('Notar- und Grundbuchkosten nach GNotKG statt 2-%-Pauschale', () => {
  // Das Modul rechnete bis 12.08.2026 pauschal 2 % des Kaufpreises. Die
  // Wertgebühren nach Tabelle B (§ 34, Anlage 2 GNotKG) sind degressiv.
  it('rechnet bei 400.000 € rund 3.980 € statt 8.000 €', () => {
    const r = berechneHauskauf({ ...BASIS });
    expect(r.notarUndGrundbuch).toBe(3979.95);
  });

  it('bezieht die Gebühren aus gnotkg.js, statt sie zweitzupflegen', () => {
    for (const kaufpreis of [150000, 400000, 950000]) {
      const r = berechneHauskauf({ ...BASIS, kaufpreis });
      expect(r.notarUndGrundbuch).toBe(berechneNotarUndGrundbuch(kaufpreis).gesamt);
    }
  });

  it('lässt den Anteil am Kaufpreis mit steigendem Kaufpreis sinken', () => {
    const anteil = (kaufpreis) =>
      berechneHauskauf({ ...BASIS, kaufpreis }).notarUndGrundbuch / kaufpreis;
    expect(anteil(1000000)).toBeLessThan(anteil(200000));
    expect(anteil(200000)).toBeLessThan(0.02);
  });
});

describe('Grunderwerbsteuer kommt aus grunderwerbsteuer.js', () => {
  // Die Kopie in diesem Modul war für Bremen (5,0 statt 5,5 %) und das
  // Saarland (6,65 statt 6,5 %) falsch.
  it('rechnet Bremen mit 5,5 % (nicht mehr 5,0 %)', () => {
    const r = berechneHauskauf({ ...BASIS, bundesland: 'HB' });
    expect(r.gewSatz).toBe(5.5);
    expect(r.grunderwerbsteuer).toBe(22000);
  });

  it('rechnet das Saarland mit 6,5 % (nicht mehr 6,65 %)', () => {
    const r = berechneHauskauf({ ...BASIS, bundesland: 'SL' });
    expect(r.gewSatz).toBe(6.5);
    expect(r.grunderwerbsteuer).toBe(26000);
  });

  it('stimmt für jedes Bundesland mit der gepflegten Satztabelle überein', () => {
    for (const [kuerzel, satz] of Object.entries(STEUERSAETZE)) {
      const r = berechneHauskauf({ ...BASIS, bundesland: kuerzel.toUpperCase() });
      expect(r.gewSatz).toBe(satz);
      expect(r.grunderwerbsteuer).toBe(400000 * satz / 100);
    }
  });

  it('versteht Groß- und Kleinschreibung der Länderkürzel', () => {
    expect(berechneHauskauf({ ...BASIS, bundesland: 'by' }).gewSatz).toBe(3.5);
    expect(berechneHauskauf({ ...BASIS, bundesland: 'BY' }).gewSatz).toBe(3.5);
  });

  it('fällt bei unbekanntem Kürzel auf den Bundessatz von 3,5 % zurück (§ 11 GrEStG)', () => {
    expect(berechneHauskauf({ ...BASIS, bundesland: 'XX' }).gewSatz).toBe(3.5);
  });
});

describe('Maklerprovision ist der Käuferanteil nach § 656c BGB', () => {
  it('rechnet 3,57 % des Kaufpreises als Käuferanteil', () => {
    const r = berechneHauskauf({ ...BASIS, makler: true });
    expect(MAKLER_PROVISION_PROZENT_JE_SEITE).toBe(3.57);
    expect(r.maklerKosten).toBe(14280); // 400.000 × 3,57 %
  });

  it('lässt die Provision weg, wenn kein Makler beteiligt ist', () => {
    expect(berechneHauskauf({ ...BASIS, makler: false }).maklerKosten).toBe(0);
  });

  it('schlägt auf den Bruttosatz keine zweite Umsatzsteuer auf', () => {
    const r = berechneHauskauf({ ...BASIS, makler: true });
    expect(r.maklerKosten).toBeLessThan(400000 * 0.0357 * 1.19);
  });
});

describe('Nebenkosten und Gesamtkosten', () => {
  it('summiert Grunderwerbsteuer, Notar/Grundbuch und Makler', () => {
    const r = berechneHauskauf({ ...BASIS, makler: true });
    expect(r.nebenkosten).toBe(
      Math.round((r.grunderwerbsteuer + r.notarUndGrundbuch + r.maklerKosten) * 100) / 100
    );
    expect(r.gesamtkosten).toBe(Math.round((r.kaufpreis + r.nebenkosten) * 100) / 100);
  });

  it('bleibt bei 400.000 € in NRW mit Makler unter 15 % Nebenkosten', () => {
    const r = berechneHauskauf({ ...BASIS, makler: true });
    // 26.000 (6,5 %) + 3.979,95 + 14.280 = 44.259,95 € = 11,1 %
    expect(r.nebenkosten).toBe(44259.95);
    expect(r.nebenkosten / r.kaufpreis).toBeLessThan(0.15);
  });

  it('finanziert die Nebenkosten nicht mit: das Darlehen deckt den Kaufpreis', () => {
    const r = berechneHauskauf({ ...BASIS });
    expect(r.darlehen).toBe(320000);
  });
});

describe('Finanzierung', () => {
  it('rechnet die Annuität aus Zins und Tilgung des Darlehens', () => {
    const r = berechneHauskauf({ ...BASIS });
    // 320.000 × (3,5 % + 2 %) / 12
    expect(r.monatlicheRate).toBe(1466.67);
  });

  it('gibt kein Darlehen aus, wenn das Eigenkapital den Kaufpreis deckt', () => {
    const r = berechneHauskauf({ ...BASIS, eigenkapital: 400000 });
    expect(r.darlehen).toBe(0);
    expect(r.monatlicheRate).toBe(0);
  });

  it('weist bei vollständiger Eigenfinanzierung keine NaN-Tilgungszeit aus', () => {
    const r = berechneHauskauf({ ...BASIS, eigenkapital: 400000 });
    expect(Number.isFinite(r.tilgungszeit)).toBe(true);
    expect(r.tilgungszeit).toBe(0);
    expect(Number.isFinite(r.zinsaufwand)).toBe(true);
    expect(r.zinsaufwand).toBe(0);
  });

  it('rechnet die Tilgungszeit aus der Annuitätenformel', () => {
    const r = berechneHauskauf({ ...BASIS });
    // 3,5 % Zins und 2 % Anfangstilgung: rund 29 Jahre bis zur Volltilgung.
    // Die alte Formel gab hier über 800 Jahre aus.
    expect(r.tilgungszeit).toBeGreaterThan(28);
    expect(r.tilgungszeit).toBeLessThan(30);
  });

  it('tilgt bei höherer Tilgung schneller', () => {
    const langsam = berechneHauskauf({ ...BASIS, tilgung: 2 });
    const schnell = berechneHauskauf({ ...BASIS, tilgung: 4 });
    expect(schnell.tilgungszeit).toBeLessThan(langsam.tilgungszeit);
  });

  it('weist den Zinsaufwand nur für die Zinsbindung aus', () => {
    const kurz = berechneHauskauf({ ...BASIS, laufzeit: 10 });
    const lang = berechneHauskauf({ ...BASIS, laufzeit: 20 });
    expect(lang.zinsaufwand).toBeGreaterThan(kurz.zinsaufwand);
    // Zinsen sinken mit der Restschuld – 20 Jahre kosten weniger als das Doppelte.
    expect(lang.zinsaufwand).toBeLessThan(kurz.zinsaufwand * 2);
  });

  it('gibt keinen negativen Zinsaufwand aus', () => {
    const r = berechneHauskauf({ ...BASIS });
    // Die alte Formel (Rate × Monate − Darlehen) ergab hier −144.000 €:
    // sie verrechnete die gezahlten Raten mit der vollen Darlehenssumme,
    // obwohl nach 10 Jahren erst ein Teil getilgt ist.
    expect(r.zinsaufwand).toBeGreaterThan(90000);
    expect(r.zinsaufwand).toBeLessThan(105000);
  });

  it('weist die Restschuld am Ende der Zinsbindung aus', () => {
    const r = berechneHauskauf({ ...BASIS });
    // Gezahlte Raten minus Zinsen sind die Tilgung; der Rest bleibt offen.
    const getilgt = Math.round((r.monatlicheRate * 120 - r.zinsaufwand) * 100) / 100;
    expect(r.restschuld).toBe(Math.round((r.darlehen - getilgt) * 100) / 100);
    expect(r.restschuld).toBeGreaterThan(240000);
    expect(r.restschuld).toBeLessThan(247000);
  });
});
