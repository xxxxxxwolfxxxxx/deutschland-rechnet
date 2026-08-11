// Steuerklassen-Vergleich
//
// Rechtsstand: 2026-01-01
//
// Das Modul rechnet nicht selbst, sondern lässt für jede der sechs
// Steuerklassen denselben Lohnsteuerabzug laufen wie der Brutto-Netto-Rechner.
// Vorher stand hier eine eigene, abweichende Rechnung: der Tarif von 2025 mit
// Grundfreibetrag 12.084 €, die Sozialversicherungssätze von 2025 und für die
// Klassen V und VI frei gegriffene Aufschläge von 25 und 40 Prozent auf die
// Steuer der Klasse I. § 39b Abs. 2 Satz 7 EStG schreibt dafür eine Formel vor.

import { berechneNettoGehalt } from './brutto-netto.js';

/** Die sechs Steuerklassen in römischer Schreibweise, in der Reihenfolge des § 38b EStG. */
export const STEUERKLASSEN_ROEMISCH = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/**
 * Nettolohn in allen sechs Steuerklassen.
 *
 * @param {number} bruttoJahr Bruttolohn im Jahr, in Euro
 * @param {object} [optionen]
 * @param {string} [optionen.bundesland] Kürzel aus BUNDESLAENDER
 * @param {number} [optionen.kinder] Kinder unter 25 Jahren, für die Pflegeversicherung
 * @param {boolean} [optionen.kirchensteuer]
 * @returns {Array<object>} ein Eintrag je Steuerklasse
 */
export function berechneAlleKlassen(bruttoJahr, { bundesland = 'NW', kinder = 0, kirchensteuer = false } = {}) {
  const brutto = Number.isFinite(bruttoJahr) ? Math.max(0, bruttoJahr) : 0;
  const bruttoMonat = runde(brutto / 12);

  return STEUERKLASSEN_ROEMISCH.map((klasse, index) => {
    const r = berechneNettoGehalt({
      bruttoMonat: brutto / 12,
      steuerklasse: index + 1,
      bundesland,
      kirchensteuer,
      kinder,
    });

    return {
      klasse,
      bruttoMonat,
      lstMonat: r.lohnsteuer,
      soliMonat: r.soli,
      kirchensteuerMonat: r.kirchensteuer,
      svMonat: r.sozialversicherung,
      nettoMonat: r.netto,
    };
  });
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}
