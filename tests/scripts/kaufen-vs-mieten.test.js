import { describe, it, expect } from 'vitest';
import {
  vergleicheKaufenMieten,
  INSTANDHALTUNG_STANDARD_PROZENT,
  KAPITALRENDITE_STANDARD_PROZENT,
} from '../../public/scripts/kaufen-vs-mieten.js';
import { berechneImmokaufNebenkosten } from '../../public/scripts/immokauf-nebenkosten.js';

// Verglichen wird der Vermögensverzehr beider Wege über den Zeitraum.
//
// Bis zum 14.08.2026 fehlten dem Kauf drei Posten – Restschuld,
// Kaufnebenkosten und Instandhaltung –, und die Raten liefen weiter, auch
// wenn das Darlehen längst getilgt war.

const BASIS = {
  kaufpreis: 350000,
  miete: 1200,
  eigenkapital: 70000,
  zins: 3.5,
  laufzeit: 20,
  mietsteigerung: 2,
  wertsteigerung: 2,
  bundesland: 'NW',
  mitMakler: true,
};

describe('Standardannahmen', () => {
  it('1 % Instandhaltung und 4 % Kapitalrendite im Jahr', () => {
    expect(INSTANDHALTUNG_STANDARD_PROZENT).toBe(1);
    expect(KAPITALRENDITE_STANDARD_PROZENT).toBe(4);
  });
});

describe('Finanzierung', () => {
  it('die Annuität aus Zins und 2 % Anfangstilgung', () => {
    // 280.000 € Darlehen × (3,5 % + 2 %) / 12 = 1283,33 €
    const r = vergleicheKaufenMieten(BASIS);

    expect(r.rate).toBeCloseTo(1283.33, 2);
  });

  it('nach 20 Jahren bleibt eine Restschuld', () => {
    const r = vergleicheKaufenMieten(BASIS);

    expect(r.restschuld).toBeGreaterThan(0);
    expect(r.restschuld).toBeLessThan(280000);
  });

  it('die Restschuld sinkt mit längerer Laufzeit', () => {
    const kurz = vergleicheKaufenMieten({ ...BASIS, laufzeit: 10 });
    const lang = vergleicheKaufenMieten({ ...BASIS, laufzeit: 30 });

    expect(lang.restschuld).toBeLessThan(kurz.restschuld);
  });

  it('nach vollständiger Tilgung werden keine Raten mehr gezahlt', () => {
    // Bei 40 Jahren ist das Darlehen längst zurückgezahlt.
    const r = vergleicheKaufenMieten({ ...BASIS, laufzeit: 40 });
    const alleMonate = r.rate * 40 * 12;

    expect(r.restschuld).toBe(0);
    expect(r.gezahlteRaten).toBeLessThan(alleMonate);
  });

  it('ohne Darlehen fallen keine Raten an', () => {
    const r = vergleicheKaufenMieten({ ...BASIS, eigenkapital: 350000 });

    expect(r.rate).toBe(0);
    expect(r.gezahlteRaten).toBe(0);
    expect(r.restschuld).toBe(0);
  });

  it('Eigenkapital über dem Kaufpreis wird auf den Kaufpreis begrenzt', () => {
    const genau = vergleicheKaufenMieten({ ...BASIS, eigenkapital: 350000 });
    const zuviel = vergleicheKaufenMieten({ ...BASIS, eigenkapital: 500000 });

    expect(zuviel.kostenKaufen).toBe(genau.kostenKaufen);
  });
});

describe('Kaufnebenkosten', () => {
  it('kommen aus immokauf-nebenkosten.js', () => {
    const r = vergleicheKaufenMieten(BASIS);
    const erwartet = berechneImmokaufNebenkosten({
      kaufpreis: 350000,
      bundesland: 'NW',
      mitMakler: true,
    }).gesamt;

    expect(r.nebenkosten).toBe(erwartet);
  });

  it('richten sich nach dem Bundesland', () => {
    const bayern = vergleicheKaufenMieten({ ...BASIS, bundesland: 'BY' });
    const nrw = vergleicheKaufenMieten({ ...BASIS, bundesland: 'NW' });

    expect(bayern.nebenkosten).toBeLessThan(nrw.nebenkosten);
    expect(bayern.kostenKaufen).toBeLessThan(nrw.kostenKaufen);
  });

  it('ohne Makler sinken Nebenkosten und Kaufkosten', () => {
    const mit = vergleicheKaufenMieten({ ...BASIS, mitMakler: true });
    const ohne = vergleicheKaufenMieten({ ...BASIS, mitMakler: false });

    expect(ohne.nebenkosten).toBeLessThan(mit.nebenkosten);
    expect(ohne.kostenKaufen).toBeLessThan(mit.kostenKaufen);
  });
});

describe('Kosten des Kaufens', () => {
  it('setzen sich aus Eigenkapital, Nebenkosten, Raten, Instandhaltung und Restschuld abzüglich Immobilienwert zusammen', () => {
    const r = vergleicheKaufenMieten(BASIS);
    const erwartet =
      70000 + r.nebenkosten + r.gezahlteRaten + r.instandhaltungGesamt + r.restschuld - r.immobilienwert;

    // Toleranz von einem Cent: die Einzelposten werden je für sich gerundet.
    expect(r.kostenKaufen).toBeCloseTo(erwartet, 1);
  });

  it('die Instandhaltung beträgt 1 % des Kaufpreises je Jahr', () => {
    const r = vergleicheKaufenMieten(BASIS);

    expect(r.instandhaltungGesamt).toBe(350000 * 0.01 * 20);
  });

  it('die Restschuld senkt den Vorteil des Kaufs', () => {
    const r = vergleicheKaufenMieten(BASIS);
    const ohneRestschuld = r.kostenKaufen - r.restschuld;

    expect(r.kostenKaufen).toBeGreaterThan(ohneRestschuld);
  });

  it('höhere Wertsteigerung senkt die Kosten des Kaufens', () => {
    const flau = vergleicheKaufenMieten({ ...BASIS, wertsteigerung: 0 });
    const stark = vergleicheKaufenMieten({ ...BASIS, wertsteigerung: 4 });

    expect(stark.kostenKaufen).toBeLessThan(flau.kostenKaufen);
  });

  it('fallende Preise verteuern den Kauf', () => {
    const fallend = vergleicheKaufenMieten({ ...BASIS, wertsteigerung: -2 });
    const stabil = vergleicheKaufenMieten({ ...BASIS, wertsteigerung: 0 });

    expect(fallend.kostenKaufen).toBeGreaterThan(stabil.kostenKaufen);
  });
});

describe('Kosten des Mietens', () => {
  it('summieren die Mieten mit jährlicher Steigerung', () => {
    const r = vergleicheKaufenMieten({ ...BASIS, laufzeit: 2, mietsteigerung: 10 });

    expect(r.gesamtmiete).toBeCloseTo(1200 * 12 + 1320 * 12, 2);
  });

  it('ohne Mietsteigerung ist die Gesamtmiete das Zwölffache je Jahr', () => {
    const r = vergleicheKaufenMieten({ ...BASIS, mietsteigerung: 0 });

    expect(r.gesamtmiete).toBe(1200 * 12 * 20);
  });

  it('das beim Kauf gebundene Kapital wird beim Mieten angelegt', () => {
    const r = vergleicheKaufenMieten(BASIS);
    const angelegt = 70000 + r.nebenkosten;

    expect(r.kapitalertrag).toBeCloseTo(angelegt * (Math.pow(1.04, 20) - 1), 2);
    expect(r.kostenMieten).toBeCloseTo(r.gesamtmiete - r.kapitalertrag, 2);
  });

  it('höhere Kapitalrendite senkt die Kosten des Mietens', () => {
    const niedrig = vergleicheKaufenMieten({ ...BASIS, kapitalrendite: 1 });
    const hoch = vergleicheKaufenMieten({ ...BASIS, kapitalrendite: 7 });

    expect(hoch.kostenMieten).toBeLessThan(niedrig.kostenMieten);
  });
});

describe('Vergleich', () => {
  it('die Differenz ist der Vorteil des Kaufens', () => {
    const r = vergleicheKaufenMieten(BASIS);

    expect(r.differenz).toBeCloseTo(r.kostenMieten - r.kostenKaufen, 2);
    expect(r.kaufenGuenstiger).toBe(r.kostenKaufen < r.kostenMieten);
  });

  it('eine sehr niedrige Miete macht das Mieten günstiger', () => {
    const r = vergleicheKaufenMieten({ ...BASIS, miete: 400 });

    expect(r.kaufenGuenstiger).toBe(false);
  });

  it('eine sehr hohe Miete macht den Kauf günstiger', () => {
    const r = vergleicheKaufenMieten({ ...BASIS, miete: 3000 });

    expect(r.kaufenGuenstiger).toBe(true);
  });

  it('bei einem Zeitraum von 0 Jahren stehen nur die Anschaffungskosten zu Buche', () => {
    const r = vergleicheKaufenMieten({ ...BASIS, laufzeit: 0 });

    expect(r.gesamtmiete).toBe(0);
    expect(r.kostenKaufen).toBeCloseTo(70000 + r.nebenkosten + 280000 - 350000, 2);
  });
});
