// Sozialversicherung – Beitragssätze und Rechengrößen
//
// Rechtsstand: 2026-01-01
//
// Primärquellen:
// - Beitragsbemessungsgrenzen, Bezugsgröße, Versicherungspflichtgrenze:
//   Sozialversicherungsrechengrößen-Verordnung 2026 (SVBezGrV 2026),
//   https://www.gesetze-im-internet.de/svbezgrv_2026/
// - Krankenversicherung: § 241 SGB V (14,6 %), § 243 SGB V (ermäßigt 14,0 %);
//   durchschnittlicher Zusatzbeitragssatz 2,9 % nach Bekanntmachung des BMG
// - Pflegeversicherung: § 55 SGB XI i. V. m. der Beitragssatz-Anpassungs-
//   verordnung (3,6 %), Zuschlag und Abschläge nach § 55 Abs. 3 SGB XI,
//   Tragung nach § 58 SGB XI
// - Rentenversicherung: § 158 SGB VI (18,6 %)
// - Arbeitslosenversicherung: § 341 Abs. 2 SGB III (2,6 %)
// - Gesamtübersicht: GKV-Spitzenverband, Rechengrößen und Grenzwerte 2026
//
// Dies ist die einzige Stelle mit diesen Zahlen. Vorher standen sie doppelt in
// brutto-netto.js und steuerklassen.js – beide veraltet und untereinander
// verschieden.

import { pruefeBundesland } from './bundeslaender.js';

export const SV_STAND = '2026-01-01';

/** Beitragsbemessungsgrenze Kranken- und Pflegeversicherung (§ 2 Abs. 2 SVBezGrV 2026). */
export const BBG_KV_PV_MONAT = 5812.5;
export const BBG_KV_PV_JAHR = 69750;

/** Beitragsbemessungsgrenze allgemeine Renten- und Arbeitslosenversicherung (§ 4, § 5 SVBezGrV 2026). */
export const BBG_RV_AV_MONAT = 8450;
export const BBG_RV_AV_JAHR = 101400;

/** Jahresarbeitsentgeltgrenze, ab der Krankenversicherungsfreiheit eintritt (§ 2 Abs. 1 SVBezGrV 2026). */
export const VERSICHERUNGSPFLICHTGRENZE_MONAT = 6450;
export const VERSICHERUNGSPFLICHTGRENZE_JAHR = 77400;

export const BEITRAGSSAETZE = {
  krankenversicherungAllgemein: 0.146,
  krankenversicherungErmaessigt: 0.14,
  zusatzbeitragDurchschnitt: 0.029,
  pflegeversicherung: 0.036,
  pflegeZuschlagKinderlose: 0.006,
  pflegeAbschlagJeKind: 0.0025,
  rentenversicherung: 0.186,
  arbeitslosenversicherung: 0.026,
};

/**
 * Arbeitgeberanteil zur Pflegeversicherung.
 *
 * § 58 Abs. 1 SGB XI: hälftige Tragung des Beitragssatzes von 3,6 %, also
 * 1,8 %. Weder der Zuschlag für Kinderlose noch die Abschläge für Kinder
 * verändern ihn – beide wirken allein beim Arbeitnehmer.
 */
export const PFLEGE_ARBEITGEBERANTEIL = 0.018;

/**
 * Arbeitgeberanteil zur Pflegeversicherung in Sachsen.
 *
 * § 58 Abs. 3 SGB XI: Wo kein gesetzlicher Feiertag gestrichen wurde – das ist
 * nur Sachsen –, trägt der Beschäftigte einen Prozentpunkt allein. Der
 * Arbeitgeber trägt dann 1,3 statt 1,8 Prozent.
 */
export const PFLEGE_ARBEITGEBERANTEIL_SACHSEN = 0.013;

/** Das einzige Bundesland mit abweichender Beitragstragung in der Pflegeversicherung. */
export const PFLEGE_SONDERWEG = 'SN';

/** Höchstzahl der Kinder, für die ein Beitragsabschlag gewährt wird (§ 55 Abs. 3 Satz 4 SGB XI: bis zum fünften Kind). */
const PFLEGE_ABSCHLAG_MAX_KINDER = 5;

/**
 * Arbeitnehmeranteil zur Krankenversicherung.
 *
 * Die Hälfte des allgemeinen Beitragssatzes plus die Hälfte des
 * Zusatzbeitragssatzes der Krankenkasse (§ 249 Abs. 1 SGB V).
 *
 * @param {number} [zusatzbeitrag] Zusatzbeitragssatz der Kasse als Dezimalzahl;
 *   ohne Angabe der durchschnittliche Satz von 2,9 %
 * @returns {number} Satz als Dezimalzahl, im Regelfall 0,0875
 */
export function krankenkasseArbeitnehmerSatz(zusatzbeitrag = BEITRAGSSAETZE.zusatzbeitragDurchschnitt) {
  return (BEITRAGSSAETZE.krankenversicherungAllgemein + zusatzbeitrag) / 2;
}

/**
 * Beitragssatz der Pflegeversicherung insgesamt, also Arbeitgeber- und
 * Arbeitnehmeranteil zusammen (§ 55 Abs. 1 und 3 SGB XI).
 *
 * @param {object} eingabe
 * @param {number} eingabe.kinder Zahl der Kinder unter 25 Jahren; 0 bedeutet kinderlos
 * @returns {number} Satz als Dezimalzahl
 */
export function pflegeGesamtsatz({ kinder = 0 } = {}) {
  const anzahl = Math.max(0, Math.floor(kinder));
  if (anzahl === 0) {
    return BEITRAGSSAETZE.pflegeversicherung + BEITRAGSSAETZE.pflegeZuschlagKinderlose;
  }
  const abschlagsKinder = Math.min(anzahl, PFLEGE_ABSCHLAG_MAX_KINDER) - 1;
  return BEITRAGSSAETZE.pflegeversicherung - abschlagsKinder * BEITRAGSSAETZE.pflegeAbschlagJeKind;
}

/**
 * Arbeitnehmeranteil zur Pflegeversicherung.
 *
 * Der Arbeitgeberanteil ist fest; Zuschlag und Abschläge verschieben nur den
 * Arbeitnehmeranteil. Deshalb ergibt er sich als Gesamtsatz minus
 * Arbeitgeberanteil und nicht als Hälfte des Gesamtsatzes.
 *
 * @param {object} eingabe
 * @param {number} eingabe.kinder Zahl der Kinder unter 25 Jahren; 0 bedeutet kinderlos
 * @param {string} [eingabe.bundesland] Kürzel; ohne Angabe die bundeseinheitliche
 *   hälftige Tragung, die auch § 39b Abs. 2 Satz 5 Nr. 3c EStG zugrunde legt
 * @returns {number} Satz als Dezimalzahl
 */
export function pflegeArbeitnehmerSatz({ kinder = 0, bundesland } = {}) {
  const arbeitgeber = bundesland !== undefined && pruefeBundesland(bundesland) === PFLEGE_SONDERWEG
    ? PFLEGE_ARBEITGEBERANTEIL_SACHSEN
    : PFLEGE_ARBEITGEBERANTEIL;
  return runde6(pflegeGesamtsatz({ kinder }) - arbeitgeber);
}

/**
 * Arbeitnehmeranteile zur Sozialversicherung für einen Monat.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttoMonat Bruttoarbeitsentgelt im Monat, in Euro
 * @param {number} eingabe.kinder Kinder unter 25 Jahren; 0 bedeutet kinderlos
 * @param {string} eingabe.bundesland Kürzel aus BUNDESLAENDER
 * @param {number} [eingabe.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse
 */
export function berechneSozialabgaben({ bruttoMonat, kinder = 0, bundesland, zusatzbeitrag }) {
  const brutto = Number.isFinite(bruttoMonat) ? Math.max(0, bruttoMonat) : 0;
  const kvBasis = Math.min(brutto, BBG_KV_PV_MONAT);
  const rvBasis = Math.min(brutto, BBG_RV_AV_MONAT);

  const krankenversicherung = runde(kvBasis * krankenkasseArbeitnehmerSatz(zusatzbeitrag));
  const pflegeversicherung = runde(kvBasis * pflegeArbeitnehmerSatz({ kinder, bundesland }));
  const rentenversicherung = runde(rvBasis * BEITRAGSSAETZE.rentenversicherung / 2);
  const arbeitslosenversicherung = runde(rvBasis * BEITRAGSSAETZE.arbeitslosenversicherung / 2);

  return {
    krankenversicherung,
    pflegeversicherung,
    rentenversicherung,
    arbeitslosenversicherung,
    gesamt: runde(krankenversicherung + pflegeversicherung + rentenversicherung + arbeitslosenversicherung),
  };
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}

function runde6(satz) {
  return Math.round(satz * 1e6) / 1e6;
}
