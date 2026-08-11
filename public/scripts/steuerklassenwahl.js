// Steuerklassenwahl für Ehegatten und eingetragene Lebenspartner
//
// Rechtsstand: 2026-01-01
// Rechtsgrundlagen:
// - § 39b Abs. 2 EStG   Lohnsteuerabzug je Steuerklasse
// - § 32a Abs. 5 EStG   Splittingverfahren
// - § 39f EStG          Faktorverfahren
// - §§ 3, 4 SolzG 1995  Solidaritätszuschlag
//
// Der entscheidende Punkt, den ein Steuerklassenrechner richtig darstellen
// muss: Die Steuerklasse ändert die Jahressteuer nicht. Sie ändert nur, wie
// viel davon im Laufe des Jahres einbehalten wird. Was als "Ersparnis durch
// Wechsel" ausgewiesen wird, ist in Wahrheit eine Verschiebung – und der
// Unterschied zur Jahressteuer kommt als Nachzahlung oder Erstattung zurück.
//
// Genau das rechnete dieser Rechner bis zum 11.08.2026 falsch: Er multiplizierte
// das Einkommen mit Faktoren von 0,78 / 0,68 / 0,58 je Steuerklasse und wies die
// Differenz als jährliche Steuerersparnis aus. Diese Faktoren stehen in keinem
// Gesetz, und eine Ersparnis dieser Art gibt es nicht.
//
// Grenze des Modells: Die Jahressteuer wird nach § 39f Satz 3 mit den
// Abzugsbeträgen des § 39b Abs. 2 EStG geschätzt. Die tatsächliche Veranlagung
// setzt die Vorsorgeaufwendungen nach § 10 EStG an, die davon abweichen.

import { einkommensteuer } from './einkommensteuer.js';
import {
  jahreslohnsteuer,
  zuVersteuernderJahresbetrag,
  solidaritaetszuschlag,
  solidaritaetszuschlagJahr,
  SOLI_FREIGRENZE_SPLITTING,
} from './lohnsteuer.js';

/** Die wählbaren Kombinationen nach § 38b Abs. 1 Satz 2 Nr. 4 und 5 EStG sowie § 39f EStG. */
export const KOMBINATIONEN = [
  { id: 'IV/IV', name: 'IV / IV', klasseA: 4, klasseB: 4, faktorverfahren: false },
  { id: 'III/V', name: 'III / V', klasseA: 3, klasseB: 5, faktorverfahren: false },
  { id: 'V/III', name: 'V / III', klasseA: 5, klasseB: 3, faktorverfahren: false },
  { id: 'IV/IV-Faktor', name: 'IV / IV mit Faktor', klasseA: 4, klasseB: 4, faktorverfahren: true },
];

/**
 * Voraussichtliche gemeinsame Jahressteuer nach dem Splittingverfahren.
 *
 * Das ist die Größe „Y“ des § 39f Satz 3 EStG: die Einkommensteuer beider
 * Ehegatten nach § 32a Abs. 5 EStG, ermittelt mit den Abzugsbeträgen des
 * § 39b Abs. 2 EStG. Sie hängt nicht von der gewählten Steuerklasse ab.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttoJahrA Jahresarbeitslohn Partner A, in Euro
 * @param {number} eingabe.bruttoJahrB Jahresarbeitslohn Partner B, in Euro
 * @param {number} [eingabe.kinder] Kinder unter 25 Jahren, für die Pflegeversicherung
 * @param {number} [eingabe.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse
 */
export function jahressteuerEhegatten({ bruttoJahrA, bruttoJahrB, kinder = 0, zusatzbeitrag }) {
  const zvJB =
    zuVersteuernderJahresbetrag({ jahresarbeitslohn: lohn(bruttoJahrA), steuerklasse: 4, kinder, zusatzbeitrag }) +
    zuVersteuernderJahresbetrag({ jahresarbeitslohn: lohn(bruttoJahrB), steuerklasse: 4, kinder, zusatzbeitrag });

  const steuer = 2 * einkommensteuer(zvJB / 2);
  const soli = solidaritaetszuschlag(steuer, SOLI_FREIGRENZE_SPLITTING);

  return {
    zuVersteuernderJahresbetrag: runde(zvJB),
    einkommensteuer: steuer,
    soli,
    gesamt: runde(steuer + soli),
  };
}

/**
 * Faktor nach § 39f Abs. 1 EStG.
 *
 * Y geteilt durch X, mit drei Nachkommastellen ohne Rundung – also
 * abgeschnitten, nicht kaufmännisch gerundet. Das Finanzamt bildet den Faktor
 * nur, wenn er kleiner als 1 ist.
 *
 * @returns {{wert: number, anwendbar: boolean}}
 */
export function faktor({ bruttoJahrA, bruttoJahrB, kinder = 0, zusatzbeitrag }) {
  const y = jahressteuerEhegatten({ bruttoJahrA, bruttoJahrB, kinder, zusatzbeitrag }).einkommensteuer;
  const x =
    jahreslohnsteuer({ jahresarbeitslohn: lohn(bruttoJahrA), steuerklasse: 4, kinder, zusatzbeitrag }) +
    jahreslohnsteuer({ jahresarbeitslohn: lohn(bruttoJahrB), steuerklasse: 4, kinder, zusatzbeitrag });

  if (x <= 0) return { wert: 1, anwendbar: false };

  // § 39f Abs. 1 Satz 2: drei Nachkommastellen ohne Rundung.
  const wert = Math.floor((y / x) * 1000) / 1000;
  return { wert, anwendbar: wert < 1 };
}

/**
 * Alle Steuerklassen-Kombinationen im Vergleich.
 *
 * Für jede Kombination: der monatliche Lohnsteuerabzug beider Partner und die
 * Abweichung von der Jahressteuer. Ein positiver Wert bedeutet Erstattung, ein
 * negativer Nachzahlung.
 */
export function vergleicheKombinationen({ bruttoJahrA, bruttoJahrB, kinder = 0, zusatzbeitrag }) {
  const jahressteuer = jahressteuerEhegatten({ bruttoJahrA, bruttoJahrB, kinder, zusatzbeitrag });
  const f = faktor({ bruttoJahrA, bruttoJahrB, kinder, zusatzbeitrag });

  const kombinationen = KOMBINATIONEN.map(kombi => {
    const a = abzug(bruttoJahrA, kombi.klasseA, kombi.faktorverfahren ? f.wert : 1, kinder, zusatzbeitrag);
    const b = abzug(bruttoJahrB, kombi.klasseB, kombi.faktorverfahren ? f.wert : 1, kinder, zusatzbeitrag);
    const abzugJahr = runde(a.gesamt + b.gesamt);

    return {
      ...kombi,
      anwendbar: kombi.faktorverfahren ? f.anwendbar : true,
      partnerA: a,
      partnerB: b,
      abzugJahr,
      abzugMonat: runde(abzugJahr / 12),
      // Positiv: es wurde mehr einbehalten als geschuldet, es gibt Geld zurück.
      differenz: runde(abzugJahr - jahressteuer.gesamt),
    };
  });

  return { jahressteuer, faktor: f, kombinationen };
}

function abzug(bruttoJahr, steuerklasse, faktorWert, kinder, zusatzbeitrag) {
  const lst = jahreslohnsteuer({ jahresarbeitslohn: lohn(bruttoJahr), steuerklasse, kinder, zusatzbeitrag });
  // § 39f Abs. 3 EStG: Der Faktor wird auf die Lohnsteuer der Klasse IV
  // angewendet; der Solidaritätszuschlag folgt der so ermittelten Lohnsteuer.
  const lohnsteuer = faktorWert === 1 ? lst : Math.floor(lst * faktorWert);
  const soli = solidaritaetszuschlagJahr(lohnsteuer, steuerklasse);

  return {
    lohnsteuerJahr: lohnsteuer,
    lohnsteuerMonat: runde(lohnsteuer / 12),
    soliJahr: soli,
    gesamt: runde(lohnsteuer + soli),
  };
}

function lohn(betrag) {
  return Number.isFinite(betrag) ? Math.max(0, betrag) : 0;
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}
