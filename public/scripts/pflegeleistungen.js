// Pflegeversicherung – Leistungsbeträge und Eigenanteile im Heim
//
// Rechtsstand der Leistungsbeträge: 2025-01-01. Sie wurden zuletzt durch die
// Bekanntmachung vom 14.11.2024 (BAnz AT 12.12.2024 B7) nach § 30 Abs. 1 SGB XI
// angehoben und gelten unverändert fort.
//
// Primärquellen, abgerufen am 15.08.2026:
// - Pflegegeld: § 37 Abs. 1 Satz 3 SGB XI
//   https://www.gesetze-im-internet.de/sgb_11/__37.html
// - Pflegesachleistung: § 36 Abs. 3 SGB XI
//   https://www.gesetze-im-internet.de/sgb_11/__36.html
// - Vollstationäre Pflege: § 43 Abs. 2 Satz 2 und Abs. 3 SGB XI
//   https://www.gesetze-im-internet.de/sgb_11/__43.html
// - Leistungszuschläge nach Verweildauer: § 43c SGB XI
//   https://www.gesetze-im-internet.de/sgb_11/__43c.html
// - Entlastungsbetrag: § 45b Abs. 1 Satz 1 SGB XI
//   https://www.gesetze-im-internet.de/sgb_11/__45b.html
//
// Die Beitragsseite steht nicht hier, sondern in sozialversicherung.js.

import { pruefeBundesland } from './bundeslaender.js';

export const PFLEGELEISTUNGEN_STAND = '2025-01-01';

/**
 * Pflegegeld für selbst beschaffte Pflegehilfen, monatlich (§ 37 Abs. 1 Satz 3).
 *
 * Pflegegrad 1 ist bewusst nicht enthalten: Er begründet keinen Anspruch auf
 * Pflegegeld. Anspruchsberechtigt sind nur die Pflegegrade 2 bis 5.
 */
export const PFLEGEGELD = {
  2: 347,
  3: 599,
  4: 800,
  5: 990,
};

/** Häusliche Pflegehilfe als Sachleistung, monatlicher Höchstwert (§ 36 Abs. 3). */
export const PFLEGESACHLEISTUNG = {
  2: 796,
  3: 1497,
  4: 1859,
  5: 2299,
};

/** Leistungsbetrag der Pflegekasse bei vollstationärer Pflege, monatlich (§ 43 Abs. 2 Satz 2). */
export const VOLLSTATIONAER = {
  2: 805,
  3: 1319,
  4: 1855,
  5: 2096,
};

/**
 * Zuschuss für Pflegegrad 1 bei vollstationärer Pflege (§ 43 Abs. 3).
 *
 * Betragsgleich mit dem Entlastungsbetrag, aber eine eigene Leistung mit
 * eigener Anspruchsgrundlage.
 */
export const VOLLSTATIONAER_ZUSCHUSS_GRAD1 = 131;

/** Entlastungsbetrag bei häuslicher Pflege, monatlich, alle Pflegegrade (§ 45b Abs. 1 Satz 1). */
export const ENTLASTUNGSBETRAG = 131;

/**
 * Leistungszuschlag auf den Eigenanteil an den pflegebedingten Aufwendungen
 * nach Dauer des Heimaufenthalts (§ 43c Sätze 1 bis 4).
 *
 * Das Gesetz staffelt nach "bis einschließlich zwölf Monate", "seit mehr als
 * zwölf", "mehr als 24" und "mehr als 36 Monaten". `bisMonat` ist deshalb
 * einschließlich zu lesen.
 */
export const LEISTUNGSZUSCHLAG_STUFEN = [
  { bisMonat: 12, satz: 0.15 },
  { bisMonat: 24, satz: 0.30 },
  { bisMonat: 36, satz: 0.50 },
  { bisMonat: Infinity, satz: 0.75 },
];

export const EIGENANTEIL_STAND = '2026-07-01';

/**
 * Durchschnittliche Heimkosten je Bundesland, in Euro im Monat.
 *
 * Quelle: vdek, "Finanzielle Belastung einer/eines Pflegebedürftigen im
 * Pflegeheim – 1. Juli 2026, Bund und Bundesländer",
 * https://www.vdek.com/presse/daten/f_pflegeversicherung.html
 *
 * `eee` ist der einrichtungseinheitliche Eigenanteil einschließlich der
 * Ausbildungskosten, die in `ausbildung` noch einmal gesondert ausgewiesen
 * sind. Nur der EEE ist Bemessungsgrundlage des Leistungszuschlags; Unterkunft,
 * Verpflegung und Investitionskosten trägt der Bewohner in voller Höhe – und
 * zwar dauerhaft, egal wie lange er im Heim lebt.
 */
export const HEIMKOSTEN = {
  BUND: { eee: 2088, ausbildung: 150, unterkunftVerpflegung: 1068, investition: 521 },
  BW: { eee: 2401, ausbildung: 164, unterkunftVerpflegung: 1153, investition: 463 },
  BY: { eee: 2185, ausbildung: 123, unterkunftVerpflegung: 979, investition: 434 },
  BE: { eee: 2410, ausbildung: 239, unterkunftVerpflegung: 870, investition: 469 },
  BB: { eee: 2172, ausbildung: 129, unterkunftVerpflegung: 972, investition: 332 },
  HB: { eee: 2296, ausbildung: 179, unterkunftVerpflegung: 1179, investition: 630 },
  HH: { eee: 2159, ausbildung: 229, unterkunftVerpflegung: 1074, investition: 572 },
  HE: { eee: 2233, ausbildung: 174, unterkunftVerpflegung: 1005, investition: 528 },
  MV: { eee: 2070, ausbildung: 148, unterkunftVerpflegung: 901, investition: 371 },
  NI: { eee: 1862, ausbildung: 136, unterkunftVerpflegung: 857, investition: 568 },
  NW: { eee: 1983, ausbildung: 173, unterkunftVerpflegung: 1331, investition: 654 },
  RP: { eee: 1766, ausbildung: 145, unterkunftVerpflegung: 1280, investition: 508 },
  SL: { eee: 2176, ausbildung: 254, unterkunftVerpflegung: 1271, investition: 574 },
  SN: { eee: 2136, ausbildung: 135, unterkunftVerpflegung: 881, investition: 455 },
  ST: { eee: 1993, ausbildung: 104, unterkunftVerpflegung: 852, investition: 345 },
  SH: { eee: 1782, ausbildung: 76, unterkunftVerpflegung: 1060, investition: 573 },
  TH: { eee: 2045, ausbildung: 122, unterkunftVerpflegung: 971, investition: 454 },
};

/** Schlüssel für den bundesweiten Durchschnitt in HEIMKOSTEN. */
export const BUND = 'BUND';

/**
 * Satz des Leistungszuschlags nach Dauer des Heimaufenthalts.
 *
 * @param {number} monateImHeim volle Monate des Leistungsbezugs nach § 43
 * @returns {number} Satz als Dezimalzahl
 */
export function leistungszuschlagSatz(monateImHeim) {
  const monate = Number.isFinite(monateImHeim) ? Math.max(0, monateImHeim) : 0;
  return LEISTUNGSZUSCHLAG_STUFEN.find((stufe) => monate <= stufe.bisMonat).satz;
}

/**
 * Eigenanteil eines Heimbewohners für einen Monat.
 *
 * Der Leistungszuschlag des § 43c mindert allein den EEE. Die Zuschlagsbeträge
 * der vdek-Statistik entsprechen genau 15, 30, 50 und 75 Prozent des EEE
 * einschließlich der Ausbildungskosten; die Tests rechnen das für alle 16
 * Länder nach.
 *
 * @param {object} eingabe
 * @param {string} [eingabe.land] Kürzel aus BUNDESLAENDER oder 'BUND'
 * @param {number} eingabe.monateImHeim volle Monate des Leistungsbezugs
 */
export function berechneHeimEigenanteil({ land = BUND, monateImHeim = 0 } = {}) {
  const schluessel = land === BUND ? BUND : pruefeBundesland(land);
  const kosten = HEIMKOSTEN[schluessel];
  const satz = leistungszuschlagSatz(monateImHeim);
  const zuschlag = runde(kosten.eee * satz);
  const ohneZuschlag = kosten.eee + kosten.unterkunftVerpflegung + kosten.investition;

  return {
    land: schluessel,
    eee: kosten.eee,
    ausbildung: kosten.ausbildung,
    unterkunftVerpflegung: kosten.unterkunftVerpflegung,
    investition: kosten.investition,
    ohneZuschlag,
    zuschlagSatz: satz,
    zuschlag,
    eigenanteil: runde(ohneZuschlag - zuschlag),
  };
}

/**
 * Monatliche Leistung der Pflegekasse bei vollstationärer Pflege.
 *
 * @param {number} pflegegrad 1 bis 5
 * @returns {number} Betrag in Euro; Pflegegrad 1 erhält nur den Zuschuss nach § 43 Abs. 3
 */
export function stationaereLeistung(pflegegrad) {
  if (pflegegrad === 1) return VOLLSTATIONAER_ZUSCHUSS_GRAD1;
  return VOLLSTATIONAER[pflegegrad] ?? 0;
}

function runde(betrag) {
  return Math.round(betrag);
}
