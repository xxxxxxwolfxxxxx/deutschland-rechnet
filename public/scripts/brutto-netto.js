// Brutto-Netto-Rechner
//
// Rechtsstand: 2026-01-01
//
// Das Modul rechnet selbst nichts aus, was woanders schon steht: Der Tarif
// kommt aus einkommensteuer.js, der Lohnsteuerabzug aus lohnsteuer.js, die
// Beitragssätze aus sozialversicherung.js, der Kirchensteuersatz aus
// kirchensteuer.js. Vorher standen Tarif und Beitragssätze hier noch einmal –
// veraltet, und mit einem doppelt abgezogenen Grundfreibetrag.
//
// Nicht abgebildet: individuelle Freibeträge nach § 39a EStG, Kinderfreibeträge
// beim Solidaritätszuschlag, private Kranken- und Pflegeversicherung, Renten-
// und Versorgungsbezüge sowie der Übergangsbereich nach § 20 Abs. 2 SGB IV.

import { jahreslohnsteuer, solidaritaetszuschlagJahr, STEUERKLASSEN } from './lohnsteuer.js';
import { berechneSozialabgaben } from './sozialversicherung.js';
import { kirchensteuersatz } from './kirchensteuer.js';

export { STEUERKLASSEN };

/**
 * Nettolohn aus dem Bruttomonatsgehalt.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttoMonat Bruttogehalt im Monat, in Euro
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @param {string} eingabe.bundesland Kürzel aus BUNDESLAENDER, z. B. 'NW'
 * @param {boolean} eingabe.kirchensteuer Mitglied einer steuererhebenden Religionsgemeinschaft
 * @param {number} [eingabe.kinder] Kinder unter 25 Jahren; 0 bedeutet kinderlos
 * @param {number} [eingabe.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse
 */
export function berechneNettoGehalt({ bruttoMonat, steuerklasse, bundesland, kirchensteuer = false, kinder = 0, zusatzbeitrag }) {
  const brutto = Number.isFinite(bruttoMonat) ? Math.max(0, bruttoMonat) : 0;
  const bruttoJahr = brutto * 12;

  const sv = berechneSozialabgaben({ bruttoMonat: brutto, kinder, bundesland, zusatzbeitrag });

  const lohnsteuerJahr = jahreslohnsteuer({ jahresarbeitslohn: bruttoJahr, steuerklasse, kinder, zusatzbeitrag });
  const lohnsteuerMonat = runde(lohnsteuerJahr / 12);
  const soliMonat = runde(solidaritaetszuschlagJahr(lohnsteuerJahr, steuerklasse) / 12);
  const kirchensteuerMonat = kirchensteuer ? runde(lohnsteuerMonat * kirchensteuersatz(bundesland)) : 0;

  const abzuege = sv.gesamt + lohnsteuerMonat + soliMonat + kirchensteuerMonat;

  return {
    netto: runde(brutto - abzuege),
    lohnsteuer: lohnsteuerMonat,
    lohnsteuerJahr,
    soli: soliMonat,
    kirchensteuer: kirchensteuerMonat,
    sozialversicherung: sv.gesamt,
    krankenversicherung: sv.krankenversicherung,
    rentenversicherung: sv.rentenversicherung,
    arbeitslosenversicherung: sv.arbeitslosenversicherung,
    pflegeversicherung: sv.pflegeversicherung,
  };
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}
