// Kirchensteuer-Rechner
//
// Rechtsstand: 2026-01-01
// Rechtsgrundlage: § 51a EStG (Bemessungsgrundlage), Kirchensteuergesetze der
// Länder und Kirchensteuerbeschlüsse der Landeskirchen und (Erz-)Bistümer.
//
// Primärquellen für die Sätze:
// - Bayern 8 %: Art. 8 Bayerisches Kirchensteuergesetz (BayKirchStG)
// - Nordrhein-Westfalen 9 %: Evangelische Kirche von Westfalen,
//   https://www.evangelisch-in-westfalen.de/kirche/haeufige-fragen/kirchensteuer/
// - Übersicht: Kirchenamt der EKD / Verband der Diözesen,
//   https://www.kirchenfinanzen.de/kirchensteuer/
//
// Dies ist die einzige Stelle, an der die Sätze stehen. Die Auswahlliste der
// Seite wird daraus erzeugt – keine zweite Kopie anlegen.

import { BUNDESLAENDER } from './bundeslaender.js';

export const KIRCHENSTEUER_STAND = '2026-01-01';

/**
 * Kirchensteuersatz je Bundesland als Zuschlag auf die Lohn-/Einkommensteuer.
 *
 * `kappungMoeglich` sagt nur, ob das Land überhaupt eine Kappungsregelung
 * kennt. Der konkrete Kappungssatz steht bewusst nicht hier: Er unterscheidet
 * sich je Landeskirche und Bistum – in Baden-Württemberg etwa zwischen Baden
 * und Württemberg – und ließe sich nicht als ein Wert je Land abbilden.
 */
const SAETZE = {
  BW: { satz: 0.08, kappungMoeglich: true,  gueltigSeit: '1978-01-01' },
  BY: { satz: 0.08, kappungMoeglich: false, gueltigSeit: '1978-01-01' },
  BE: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1991-01-01' },
  BB: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1991-01-01' },
  HB: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1978-01-01' },
  HH: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1978-01-01' },
  HE: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1978-01-01' },
  MV: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1991-01-01' },
  NI: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1978-01-01' },
  NW: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1978-01-01' },
  RP: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1978-01-01' },
  SL: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1978-01-01' },
  SN: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1991-01-01' },
  ST: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1991-01-01' },
  SH: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1978-01-01' },
  TH: { satz: 0.09, kappungMoeglich: true,  gueltigSeit: '1991-01-01' },
};

// Die Namen kommen aus bundeslaender.js, damit sie nicht in jedem Rechner neu
// getippt werden. Fehlt hier ein Land, fällt es beim Zusammensetzen auf.
export const KIRCHENSTEUER_LAENDER = Object.fromEntries(
  Object.entries(BUNDESLAENDER).map(([kuerzel, name]) => {
    if (!SAETZE[kuerzel]) {
      throw new Error(`Kein Kirchensteuersatz hinterlegt für: ${kuerzel}`);
    }
    return [kuerzel, { name, ...SAETZE[kuerzel] }];
  })
);

/** Untere Grenze der Kappungssätze (Ev. Landeskirche in Württemberg). */
export const KAPPUNG_MIN = 0.0275;
/** Obere Grenze der Kappungssätze (u. a. katholische Bistümer in NRW, RP, SL). */
export const KAPPUNG_MAX = 0.04;

/**
 * Kirchensteuersatz eines Bundeslandes.
 *
 * Einstiegspunkt für alle anderen Rechner – wer den Satz braucht, holt ihn
 * hier und legt keine eigene Tabelle an. Unbekannte Kürzel führen bewusst zu
 * einem Fehler statt zu einem stillen Rückfall auf 9 %.
 *
 * @param {string} bundesland Kürzel aus KIRCHENSTEUER_LAENDER, z. B. 'NW'
 * @returns {number} Satz als Dezimalzahl, also 0.08 oder 0.09
 */
export function kirchensteuersatz(bundesland) {
  const land = KIRCHENSTEUER_LAENDER[bundesland];
  if (!land) {
    throw new Error(`Unbekanntes Bundesland: ${bundesland}`);
  }
  return land.satz;
}

/**
 * Kirchensteuer als Zuschlag auf die Lohn- oder Einkommensteuer (§ 51a EStG).
 *
 * Erwartet die tatsächlich festgesetzte Jahres-Lohnsteuer, nicht das Brutto:
 * Die Kirchensteuer bemisst sich nach der Steuer, nicht nach dem Einkommen.
 *
 * Eine Kappung wird bewusst nicht angewendet. Sie bemisst sich nach dem zu
 * versteuernden Einkommen, das hier nicht bekannt ist, ihr Satz hängt von der
 * jeweiligen Landeskirche oder Diözese ab, und in mehreren Ländern wird sie nur
 * auf Antrag gewährt. `kappungMoeglich` weist lediglich darauf hin.
 *
 * @param {object} eingabe
 * @param {number} eingabe.lohnsteuerJahr festgesetzte Lohnsteuer im Jahr, in Euro
 * @param {string} eingabe.bundesland Kürzel aus KIRCHENSTEUER_LAENDER
 * @param {'rk'|'ev'|'keine'} eingabe.konfession
 */
export function berechneKirchensteuer({ lohnsteuerJahr, bundesland = 'NW', konfession = 'rk' }) {
  const land = KIRCHENSTEUER_LAENDER[bundesland];
  if (!land) {
    throw new Error(`Unbekanntes Bundesland: ${bundesland}`);
  }

  const lohnsteuer = Number.isFinite(lohnsteuerJahr) ? Math.max(0, lohnsteuerJahr) : 0;
  const pflichtig = konfession !== 'keine';

  const kirchensteuerJahr = pflichtig ? runde(lohnsteuer * land.satz) : 0;

  return {
    kirchensteuerJahr,
    kirchensteuerMonat: runde(kirchensteuerJahr / 12),
    lohnsteuerJahr: lohnsteuer,
    satz: land.satz,
    bundesland,
    bundeslandName: land.name,
    kappungMoeglich: pflichtig && land.kappungMoeglich,
    konfession,
  };
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}
