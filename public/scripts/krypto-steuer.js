// Private Veräußerungsgeschäfte mit Kryptowerten nach § 23 EStG
//
// Quelle: https://www.gesetze-im-internet.de/estg/__23.html (abgerufen am 14.09.2026)
//
// Steuerpflichtig ist ein Verkauf oder Tausch, wenn zwischen Anschaffung und
// Veräußerung "nicht mehr als ein Jahr" liegt (§ 23 Abs. 1 Satz 1 Nr. 2).
//
// Die 1.000 Euro des § 23 Abs. 3 Satz 5 sind eine FREIGRENZE, kein Freibetrag:
// Gewinne "bleiben steuerfrei, wenn der aus den privaten Veräußerungsgeschäften
// erzielte Gesamtgewinn im Kalenderjahr weniger als 1 000 Euro betragen hat".
// Wer 1.000 Euro oder mehr erzielt, versteuert den ganzen Betrag – nicht nur
// den Teil über 1.000 Euro.
//
// Bei Zusammenveranlagung werden nach § 26b EStG die Einkünfte zusammengerechnet,
// "die die Ehegatten erzielt haben". Die Einkünfte ermittelt jeder Ehegatte
// zuerst selbst, die Freigrenze gehört zu dieser Ermittlung – sie gilt also je
// Ehegatte für dessen eigenen Gesamtgewinn und verdoppelt sich nicht zu einer
// gemeinsamen Grenze von 2.000 Euro.

import { einkommensteuer } from './einkommensteuer.js';

export const RECHTSSTAND = '2026-01-01';

/** § 23 Abs. 3 Satz 5 EStG: steuerfrei bei einem Gesamtgewinn von weniger als diesem Betrag. */
export const FREIGRENZE = 1000;

/** § 23 Abs. 1 Satz 1 Nr. 2 EStG: steuerpflichtig bei nicht mehr als einem Jahr Haltedauer. */
export const HALTEFRIST_JAHRE = 1;

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Number(wert) : 0);

/**
 * Anzusetzender Gewinn eines Steuerpflichtigen nach der Freigrenze.
 *
 * Ein Verlust (Gesamtgewinn ≤ 0) ergibt 0: Er darf nach § 23 Abs. 3 Satz 7 nur
 * mit Gewinnen aus privaten Veräußerungsgeschäften verrechnet werden und mindert
 * das übrige Einkommen nicht.
 *
 * @param {number} gesamtgewinn Saldo aller steuerpflichtigen Veräußerungen im Kalenderjahr
 * @returns {number} steuerpflichtiger Betrag in Euro
 */
export function steuerpflichtigerGewinn(gesamtgewinn) {
  const g = zahl(gesamtgewinn);
  if (g < FREIGRENZE) return 0;
  return g;
}

/** Tarifliche Einkommensteuer, bei Zusammenveranlagung im Splittingverfahren (§ 32a Abs. 5 EStG). */
function tarif(zvE, zusammen) {
  if (!zusammen) return einkommensteuer(zvE);
  return 2 * einkommensteuer(zvE / 2);
}

/**
 * Einkommensteuer, die der Krypto-Gewinn zusätzlich auslöst.
 *
 * Gerechnet wird die Differenz der tariflichen Einkommensteuer mit und ohne
 * den Gewinn – so wirkt die Progression, und kein fester Steuersatz wird
 * unterstellt. Solidaritätszuschlag und Kirchensteuer sind nicht enthalten.
 *
 * @param {object} p
 * @param {number} p.zvEOhne zu versteuerndes Einkommen ohne die Veräußerungsgewinne
 * @param {number} p.gewinn Gesamtgewinn des (ersten) Steuerpflichtigen, Haltedauer ≤ 1 Jahr
 * @param {number} [p.gewinnPartner] Gesamtgewinn des Ehegatten, nur bei Zusammenveranlagung
 * @param {boolean} [p.zusammen] Zusammenveranlagung
 */
export function berechneKryptoSteuer({ zvEOhne, gewinn, gewinnPartner = 0, zusammen = false }) {
  const basis = Math.max(0, zahl(zvEOhne));
  const pflichtig = steuerpflichtigerGewinn(gewinn);
  const pflichtigPartner = zusammen ? steuerpflichtigerGewinn(gewinnPartner) : 0;
  const zusatz = pflichtig + pflichtigPartner;

  const steuerOhne = tarif(basis, zusammen);
  const steuerMit = tarif(basis + zusatz, zusammen);
  const mehrsteuer = steuerMit - steuerOhne;

  return {
    steuerpflichtig: pflichtig,
    steuerpflichtigPartner: pflichtigPartner,
    steuerpflichtigGesamt: zusatz,
    freiNachFreigrenze: pflichtig === 0 && zahl(gewinn) > 0,
    freiNachFreigrenzePartner: zusammen && pflichtigPartner === 0 && zahl(gewinnPartner) > 0,
    steuerOhne,
    steuerMit,
    mehrsteuer,
    /** Anteil der Mehrsteuer am steuerpflichtigen Gewinn, in Prozent (eine Nachkommastelle). */
    belastungProzent: zusatz > 0 ? Math.round((mehrsteuer / zusatz) * 1000) / 10 : 0,
  };
}
