// Lohnsteuerabzug nach § 39b Abs. 2 EStG
//
// Rechtsstand: 2026-01-01
// Primärquellen:
// - § 39b EStG   https://www.gesetze-im-internet.de/estg/__39b.html
// - § 9a EStG    Arbeitnehmer-Pauschbetrag
// - § 10c EStG   Sonderausgaben-Pauschbetrag
// - § 24b EStG   Entlastungsbetrag für Alleinerziehende
// - SolzG 1995   §§ 3 und 4, Freigrenzen und Milderungszone
//
// Der Weg vom Bruttolohn zur Lohnsteuer geht über den zu versteuernden
// Jahresbetrag: Bruttolohn minus Pauschbeträge minus Vorsorgepauschale. Die
// Vorsorgepauschale ist nicht dasselbe wie die tatsächlichen Sozialabgaben –
// sie rechnet die Krankenversicherung mit dem ermäßigten Beitragssatz und
// deckelt den Arbeitslosen-Teilbetrag bei 1.900 Euro.
//
// Der Grundfreibetrag wird hier nicht abgezogen. Er steckt im Tarif nach
// § 32a EStG. Genau dieser doppelte Abzug hat den Brutto-Netto-Rechner bis zum
// 11.08.2026 auf etwa ein Fünftel der richtigen Lohnsteuer gebracht.

import { einkommensteuer } from './einkommensteuer.js';
import {
  BBG_KV_PV_JAHR,
  BBG_RV_AV_JAHR,
  BEITRAGSSAETZE,
  pflegeArbeitnehmerSatz,
} from './sozialversicherung.js';

/** § 9a Satz 1 Nr. 1a EStG. */
export const ARBEITNEHMER_PAUSCHBETRAG = 1230;

/** § 10c Satz 1 EStG. */
export const SONDERAUSGABEN_PAUSCHBETRAG = 36;

/** § 24b Abs. 2 Satz 1 EStG – nur für das erste Kind, nur in Steuerklasse II. */
export const ENTLASTUNGSBETRAG_ALLEINERZIEHENDE = 4260;

/** § 39b Abs. 2 Satz 5 Nr. 3e EStG – Deckel für den Arbeitslosen-Teilbetrag. */
export const VORSORGEPAUSCHALE_HOECHSTBETRAG = 1900;

/** § 3 Abs. 3 Satz 1 Nr. 2 SolzG 1995. */
export const SOLI_FREIGRENZE = 20350;

/** § 3 Abs. 3 Satz 1 Nr. 1 SolzG 1995 – Steuerklasse III. */
export const SOLI_FREIGRENZE_SPLITTING = 40700;

/** § 4 SolzG 1995. */
const SOLI_SATZ = 0.055;
const SOLI_MILDERUNGSSATZ = 0.119;

export const STEUERKLASSEN = [1, 2, 3, 4, 5, 6];

/** § 39b Abs. 2 Satz 7 EStG – Staffelung der Höchstbelastung in den Klassen V und VI. */
const KLASSE_V_VI_STUFEN = [
  { bis: 14071, satz: 0.14 },
  { bis: 34939, satz: 0.42 },
  { bis: 222260, satz: 0.42 },
  { bis: Infinity, satz: 0.45 },
];

function pruefeSteuerklasse(steuerklasse) {
  if (!STEUERKLASSEN.includes(steuerklasse)) {
    throw new Error(`Unbekannte Steuerklasse: ${steuerklasse}`);
  }
  return steuerklasse;
}

/**
 * Vorsorgepauschale nach § 39b Abs. 2 Satz 5 Nr. 3 EStG.
 *
 * Gilt für gesetzlich kranken- und pflegeversicherte Arbeitnehmer. Privat
 * Versicherte (Buchstabe d) bleiben außen vor: Dafür müsste der tatsächliche
 * Beitrag bekannt sein, den ein Rechner nicht kennen kann.
 *
 * @param {object} eingabe
 * @param {number} eingabe.jahresarbeitslohn Bruttolohn im Jahr, in Euro
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @param {number} eingabe.kinder Kinder unter 25 Jahren; 0 bedeutet kinderlos
 * @param {number} [eingabe.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse
 * @returns {number} Vorsorgepauschale in Euro
 */
export function vorsorgepauschale({ jahresarbeitslohn, steuerklasse, kinder = 0, zusatzbeitrag = BEITRAGSSAETZE.zusatzbeitragDurchschnitt }) {
  pruefeSteuerklasse(steuerklasse);
  const lohn = Number.isFinite(jahresarbeitslohn) ? Math.max(0, jahresarbeitslohn) : 0;
  const kvBasis = Math.min(lohn, BBG_KV_PV_JAHR);
  const rvBasis = Math.min(lohn, BBG_RV_AV_JAHR);

  // a) Rentenversicherung: 50 % des Beitrags, Klassen I bis VI.
  const rente = rvBasis * BEITRAGSSAETZE.rentenversicherung / 2;

  // b) Krankenversicherung: ermäßigter Beitragssatz nach § 243 SGB V, nicht der
  //    allgemeine – der Anspruch auf Krankengeld bleibt beim Lohnsteuerabzug
  //    außer Betracht.
  const kranken = kvBasis * (BEITRAGSSAETZE.krankenversicherungErmaessigt + zusatzbeitrag) / 2;

  // c) Pflegeversicherung: bundeseinheitlicher Satz, deshalb ohne Bundesland.
  const pflege = kvBasis * pflegeArbeitnehmerSatz({ kinder });

  // e) Arbeitslosenversicherung: nur Klassen I bis V und nur, soweit die
  //    Teilbeträge b bis d zusammen 1.900 Euro noch nicht ausschöpfen.
  const arbeitslosVoll = steuerklasse <= 5 ? rvBasis * BEITRAGSSAETZE.arbeitslosenversicherung / 2 : 0;
  const restBisHoechstbetrag = Math.max(0, VORSORGEPAUSCHALE_HOECHSTBETRAG - (kranken + pflege));
  const arbeitslos = Math.min(arbeitslosVoll, restBisHoechstbetrag);

  return rente + kranken + pflege + arbeitslos;
}

/**
 * Zu versteuernder Jahresbetrag nach § 39b Abs. 2 Satz 5 EStG.
 *
 * @param {object} eingabe siehe vorsorgepauschale
 * @returns {number} zu versteuernder Jahresbetrag in Euro, nie negativ
 */
export function zuVersteuernderJahresbetrag({ jahresarbeitslohn, steuerklasse, kinder = 0, zusatzbeitrag }) {
  pruefeSteuerklasse(steuerklasse);
  const lohn = Number.isFinite(jahresarbeitslohn) ? Math.max(0, jahresarbeitslohn) : 0;

  let abzuege = vorsorgepauschale({ jahresarbeitslohn: lohn, steuerklasse, kinder, zusatzbeitrag });

  // Nr. 1 und 2: Pauschbeträge nur in den Steuerklassen I bis V.
  if (steuerklasse <= 5) {
    abzuege += ARBEITNEHMER_PAUSCHBETRAG + SONDERAUSGABEN_PAUSCHBETRAG;
  }
  // Nr. 4: Entlastungsbetrag nur in Steuerklasse II.
  if (steuerklasse === 2) {
    abzuege += ENTLASTUNGSBETRAG_ALLEINERZIEHENDE;
  }

  return Math.max(0, lohn - abzuege);
}

/**
 * Jahreslohnsteuer nach § 39b Abs. 2 Sätze 6 und 7 EStG.
 *
 * @param {object} eingabe siehe vorsorgepauschale
 * @returns {number} Jahreslohnsteuer in vollen Euro
 */
export function jahreslohnsteuer({ jahresarbeitslohn, steuerklasse, kinder = 0, zusatzbeitrag }) {
  pruefeSteuerklasse(steuerklasse);
  const zvJB = zuVersteuernderJahresbetrag({ jahresarbeitslohn, steuerklasse, kinder, zusatzbeitrag });

  if (steuerklasse === 3) {
    // § 32a Abs. 5 EStG, Splittingverfahren.
    return 2 * einkommensteuer(zvJB / 2);
  }
  if (steuerklasse === 5 || steuerklasse === 6) {
    return lohnsteuerKlasseVundVI(zvJB);
  }
  return einkommensteuer(zvJB);
}

/**
 * Jahreslohnsteuer der Steuerklassen V und VI (§ 39b Abs. 2 Satz 7 EStG).
 *
 * Zweifacher Unterschiedsbetrag zwischen der Steuer auf das Eineinviertelfache
 * und der Steuer auf das Dreiviertelfache, begrenzt nach unten auf 14 Prozent
 * und nach oben auf die gestaffelten Sätze des Satzes 7.
 */
function lohnsteuerKlasseVundVI(zvJB) {
  const x = Math.floor(Math.max(0, zvJB));
  if (x === 0) return 0;

  const unterschiedsbetrag = 2 * (einkommensteuer(1.25 * x) - einkommensteuer(0.75 * x));
  const untergrenze = 0.14 * x;

  let obergrenze = 0;
  let vorherigeStufe = 0;
  for (const stufe of KLASSE_V_VI_STUFEN) {
    obergrenze += stufe.satz * Math.max(0, Math.min(x, stufe.bis) - vorherigeStufe);
    vorherigeStufe = stufe.bis;
    if (x <= stufe.bis) break;
  }

  return Math.floor(Math.max(untergrenze, Math.min(unterschiedsbetrag, obergrenze)));
}

/**
 * Solidaritätszuschlag auf die Jahreslohnsteuer (§§ 3, 4 SolzG 1995).
 *
 * 5,5 Prozent der Lohnsteuer, aber höchstens 11,9 Prozent des Betrags, um den
 * die Lohnsteuer die Freigrenze übersteigt. Diese Milderungszone sorgt dafür,
 * dass der Zuschlag an der Freigrenze bei null beginnt und nicht springt.
 *
 * @param {number} jahreslohnsteuerBetrag Jahreslohnsteuer in Euro
 * @param {number} steuerklasse 1 bis 6
 * @returns {number} Solidaritätszuschlag im Jahr, in Euro
 */
export function solidaritaetszuschlagJahr(jahreslohnsteuerBetrag, steuerklasse) {
  pruefeSteuerklasse(steuerklasse);
  return solidaritaetszuschlag(
    jahreslohnsteuerBetrag,
    steuerklasse === 3 ? SOLI_FREIGRENZE_SPLITTING : SOLI_FREIGRENZE
  );
}

/**
 * Solidaritätszuschlag auf eine beliebige Bemessungsgrundlage.
 *
 * Für die veranlagte Einkommensteuer nach § 3 Abs. 1 Nr. 1 SolzG – etwa bei
 * Selbständigen – gelten dieselben Freigrenzen wie beim Lohnsteuerabzug.
 *
 * @param {number} bemessungsgrundlage Einkommen- oder Lohnsteuer in Euro
 * @param {number} [freigrenze] SOLI_FREIGRENZE oder SOLI_FREIGRENZE_SPLITTING
 * @returns {number} Solidaritätszuschlag in Euro
 */
export function solidaritaetszuschlag(bemessungsgrundlage, freigrenze = SOLI_FREIGRENZE) {
  const lst = Number.isFinite(bemessungsgrundlage) ? Math.max(0, bemessungsgrundlage) : 0;
  if (lst <= freigrenze) return 0;

  const voll = SOLI_SATZ * lst;
  const gemildert = SOLI_MILDERUNGSSATZ * (lst - freigrenze);
  // § 4 Satz 3 SolzG: Bruchteile eines Cents bleiben außer Ansatz. Vor dem
  // Abschneiden auf sechs Nachkommastellen runden, sonst macht die binäre
  // Darstellung aus 77,35 ein 77,34.
  const cent = Number((Math.min(voll, gemildert) * 100).toFixed(6));
  return Math.floor(cent) / 100;
}
