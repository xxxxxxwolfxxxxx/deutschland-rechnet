// Kaufen oder mieten – Vermögensvergleich über einen Zeitraum
//
// Rechtsstand: 2026-01-01
//
// Verglichen wird, wie viel Vermögen beide Wege über den Zeitraum kosten:
//
//   Kaufen  = Eigenkapital + Kaufnebenkosten + gezahlte Raten
//             + Instandhaltung + Restschuld − Immobilienwert am Ende
//   Mieten  = gezahlte Mieten − Ertrag des angelegten Kapitals
//
// Das beim Kauf gebundene Kapital (Eigenkapital und Nebenkosten) legt der
// Mieter zum selben Zeitpunkt an; nur so vergleichen beide Seiten denselben
// Kapitaleinsatz.
//
// Bis zum 14.08.2026 fehlten dem Vergleich drei Posten, alle zugunsten des
// Kaufs: Die Restschuld am Ende des Zeitraums wurde nicht abgezogen, obwohl
// der volle Immobilienwert gutgeschrieben wurde – bei 20 Jahren und 2 %
// Anfangstilgung sind das schnell sechsstellige Beträge. Kaufnebenkosten
// (Grunderwerbsteuer, Notar, Grundbuch, Makler) kamen gar nicht vor, und die
// Instandhaltung wurde in der Seitenbeschreibung versprochen, aber nie
// gerechnet. Außerdem liefen die Raten weiter, wenn das Darlehen schon
// getilgt war.
//
// Nicht abgebildet: Steuerwirkungen, Sondertilgungen, Zinsbindung und
// Anschlussfinanzierung (gerechnet wird durchgehend mit einem Zinssatz),
// Umzugs- und Erwerbskosten des Mieters sowie die Anlage monatlicher
// Zahlungsdifferenzen zwischen Rate und Miete.

import { berechneImmokaufNebenkosten } from './immokauf-nebenkosten.js';

/** Anfängliche Tilgung, wenn nichts anderes angegeben ist. */
const TILGUNG_STANDARD_PROZENT = 2;

/** Jährliche Instandhaltungsrücklage in Prozent des Kaufpreises. */
const INSTANDHALTUNG_STANDARD_PROZENT = 1;

/** Angenommene Rendite des alternativ angelegten Kapitals, in Prozent p. a. */
const KAPITALRENDITE_STANDARD_PROZENT = 4;

const aufCent = (betrag) => Math.round(betrag * 100) / 100;

/**
 * Vergleich von Kauf und Miete über einen Zeitraum.
 *
 * @param {object} eingaben
 * @param {number} eingaben.kaufpreis Kaufpreis in Euro
 * @param {number} eingaben.miete Kaltmiete im Monat, in Euro
 * @param {number} eingaben.eigenkapital eingesetztes Eigenkapital in Euro
 * @param {number} eingaben.zins Sollzins in Prozent p. a.
 * @param {number} eingaben.laufzeit Vergleichszeitraum in Jahren
 * @param {number} eingaben.mietsteigerung jährliche Mietsteigerung in Prozent
 * @param {number} eingaben.wertsteigerung jährliche Wertsteigerung in Prozent
 * @param {string} [eingaben.bundesland] Kürzel für die Grunderwerbsteuer
 * @param {boolean} [eingaben.mitMakler]
 * @param {number} [eingaben.tilgung] anfängliche Tilgung in Prozent p. a.
 * @param {number} [eingaben.instandhaltung] Rücklage in Prozent des Kaufpreises p. a.
 * @param {number} [eingaben.kapitalrendite] Rendite der Geldanlage in Prozent p. a.
 */
function vergleicheKaufenMieten({
  kaufpreis,
  miete,
  eigenkapital,
  zins,
  laufzeit,
  mietsteigerung,
  wertsteigerung,
  bundesland = 'NW',
  mitMakler = true,
  tilgung = TILGUNG_STANDARD_PROZENT,
  instandhaltung = INSTANDHALTUNG_STANDARD_PROZENT,
  kapitalrendite = KAPITALRENDITE_STANDARD_PROZENT,
}) {
  const jahre = Math.max(0, laufzeit);
  const eingesetztesEigenkapital = Math.min(Math.max(0, eigenkapital), kaufpreis);
  const darlehen = Math.max(0, kaufpreis - eingesetztesEigenkapital);

  const nebenkosten = berechneImmokaufNebenkosten({ kaufpreis, bundesland, mitMakler }).gesamt;

  const zinsMonat = zins / 100 / 12;
  const rate = darlehen * (zinsMonat + tilgung / 100 / 12);

  // Annuität: konstante Rate, bis das Darlehen getilgt ist. Ist es vor Ablauf
  // des Zeitraums zurückgezahlt, endet die Zahlung – die letzte Rate deckt nur
  // noch Restschuld und Zins.
  let restschuld = darlehen;
  let gezahlteRaten = 0;
  for (let monat = 0; monat < jahre * 12 && restschuld > 0; monat++) {
    const zinsAnteil = restschuld * zinsMonat;
    const faellig = restschuld + zinsAnteil;
    const zahlung = Math.min(rate, faellig);
    restschuld = faellig - zahlung;
    gezahlteRaten += zahlung;
  }

  const instandhaltungGesamt = kaufpreis * (instandhaltung / 100) * jahre;
  const immobilienwert = kaufpreis * Math.pow(1 + wertsteigerung / 100, jahre);

  const kostenKaufen =
    eingesetztesEigenkapital +
    nebenkosten +
    gezahlteRaten +
    instandhaltungGesamt +
    restschuld -
    immobilienwert;

  // Mieten: Mieten steigen jährlich, das nicht gebundene Kapital wird angelegt.
  let gesamtmiete = 0;
  let aktuelleMiete = miete;
  for (let jahr = 0; jahr < jahre; jahr++) {
    gesamtmiete += aktuelleMiete * 12;
    aktuelleMiete *= 1 + mietsteigerung / 100;
  }

  const angelegtesKapital = eingesetztesEigenkapital + nebenkosten;
  const kapitalertrag = angelegtesKapital * (Math.pow(1 + kapitalrendite / 100, jahre) - 1);
  const kostenMieten = gesamtmiete - kapitalertrag;

  return {
    kostenKaufen: aufCent(kostenKaufen),
    kostenMieten: aufCent(kostenMieten),
    differenz: aufCent(kostenMieten - kostenKaufen),
    kaufenGuenstiger: kostenKaufen < kostenMieten,
    immobilienwert: aufCent(immobilienwert),
    gesamtmiete: aufCent(gesamtmiete),
    restschuld: aufCent(restschuld),
    nebenkosten: aufCent(nebenkosten),
    instandhaltungGesamt: aufCent(instandhaltungGesamt),
    gezahlteRaten: aufCent(gezahlteRaten),
    rate: aufCent(rate),
    kapitalertrag: aufCent(kapitalertrag),
  };
}

export {
  vergleicheKaufenMieten,
  TILGUNG_STANDARD_PROZENT,
  INSTANDHALTUNG_STANDARD_PROZENT,
  KAPITALRENDITE_STANDARD_PROZENT,
};
