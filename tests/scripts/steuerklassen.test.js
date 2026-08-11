import { describe, it, expect } from 'vitest';
import { berechneAlleKlassen, STEUERKLASSEN_ROEMISCH } from '../../public/scripts/steuerklassen.js';
import { berechneNettoGehalt } from '../../public/scripts/brutto-netto.js';

// Bis zum 11.08.2026 rechnete dieses Modul eigenständig: Tarif 2025 mit
// Grundfreibetrag 12.084 €, Sozialversicherungssätze von 2025, und für die
// Klassen V und VI wurde die Steuer der Klasse I einfach mit 1,25 bzw. 1,40
// multipliziert. § 39b Abs. 2 Satz 7 EStG schreibt dafür eine Formel vor.
describe('berechneAlleKlassen', () => {
  it('liefert alle sechs Steuerklassen in der Reihenfolge des § 38b EStG', () => {
    expect(berechneAlleKlassen(42000).map(r => r.klasse)).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI']);
    expect(STEUERKLASSEN_ROEMISCH).toHaveLength(6);
  });

  it('stimmt Klasse für Klasse mit dem Brutto-Netto-Rechner überein', () => {
    const bruttoJahr = 42000;
    const ergebnisse = berechneAlleKlassen(bruttoJahr, { bundesland: 'NW', kinder: 1 });
    ergebnisse.forEach((r, index) => {
      const referenz = berechneNettoGehalt({
        bruttoMonat: bruttoJahr / 12, steuerklasse: index + 1,
        bundesland: 'NW', kirchensteuer: false, kinder: 1,
      });
      expect(r.nettoMonat, r.klasse).toBe(referenz.netto);
      expect(r.lstMonat, r.klasse).toBe(referenz.lohnsteuer);
      expect(r.svMonat, r.klasse).toBe(referenz.sozialversicherung);
    });
  });

  it('Klasse III zahlt am wenigsten, Klasse VI am meisten Lohnsteuer', () => {
    const nach = Object.fromEntries(berechneAlleKlassen(42000, { kinder: 1 }).map(r => [r.klasse, r.lstMonat]));
    expect(nach.III).toBeLessThan(nach.I);
    expect(nach.I).toBeLessThan(nach.V);
    expect(nach.V).toBeLessThan(nach.VI);
  });

  it('Klassen I und IV sind identisch', () => {
    const nach = Object.fromEntries(berechneAlleKlassen(42000, { kinder: 1 }).map(r => [r.klasse, r]));
    expect(nach.IV.nettoMonat).toBe(nach.I.nettoMonat);
  });

  it('Klasse II liegt wegen des Entlastungsbetrags über Klasse I', () => {
    const nach = Object.fromEntries(berechneAlleKlassen(42000, { kinder: 1 }).map(r => [r.klasse, r]));
    expect(nach.II.nettoMonat).toBeGreaterThan(nach.I.nettoMonat);
  });

  it('rechnet die Klassen V und VI nicht als Aufschlag auf Klasse I', () => {
    const nach = Object.fromEntries(berechneAlleKlassen(42000, { kinder: 1 }).map(r => [r.klasse, r.lstMonat]));
    expect(nach.V).not.toBeCloseTo(nach.I * 1.25, 2);
    expect(nach.VI).not.toBeCloseTo(nach.I * 1.4, 2);
  });

  it('in jeder Klasse ergeben Abzüge und Netto zusammen das Brutto', () => {
    for (const r of berechneAlleKlassen(42000, { kinder: 0, kirchensteuer: true, bundesland: 'BY' })) {
      expect(r.nettoMonat + r.lstMonat + r.soliMonat + r.kirchensteuerMonat + r.svMonat, r.klasse)
        .toBeCloseTo(r.bruttoMonat, 2);
    }
  });

  it('kommt mit 0 € Jahresbrutto zurecht', () => {
    for (const r of berechneAlleKlassen(0)) {
      expect(r.nettoMonat).toBe(0);
      expect(r.lstMonat).toBe(0);
    }
  });
});
