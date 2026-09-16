// Homeoffice-Pauschale (Tagespauschale)
//
// Rechtsgrundlagen, Wortlaut abgerufen am 16.09.2026 auf gesetze-im-internet.de:
// - § 4 Abs. 5 Satz 1 Nr. 6c EStG: „… ein Betrag von 6 Euro (Tagespauschale),
//   höchstens 1 260 Euro im Wirtschafts- oder Kalenderjahr …“ – für jeden
//   Kalendertag, an dem die Tätigkeit überwiegend in der häuslichen Wohnung
//   ausgeübt und keine erste Tätigkeitsstätte außerhalb aufgesucht wird.
// - § 9 Abs. 5 Satz 1 EStG: § 4 Abs. 5 Satz 1 Nr. 6b bis 8a gilt sinngemäß für
//   Werbungskosten – die Pauschale steht also auch Arbeitnehmern zu.
// - § 9a Satz 1 Nr. 1 EStG: Arbeitnehmer erhalten ohnehin den
//   Arbeitnehmer-Pauschbetrag (lohnsteuer.js). Die Tagespauschale wirkt nur,
//   soweit alle Werbungskosten zusammen diesen Betrag übersteigen.

import { tariflicheEinkommensteuer } from './einkommensteuer.js';
import { ARBEITNEHMER_PAUSCHBETRAG } from './lohnsteuer.js';

export const TAGESPAUSCHALE = 6;
export const TAGESPAUSCHALE_HOECHSTBETRAG = 1260;

const betrag = (wert) => (Number.isFinite(wert) ? Math.max(0, wert) : 0);

/**
 * Abziehbare Tagespauschale für eine Zahl von Homeoffice-Tagen.
 * @param {number} tage Kalendertage im Homeoffice
 * @returns {number} Betrag in Euro
 */
export function tagespauschale(tage) {
  const t = Number.isFinite(tage) ? Math.max(0, Math.floor(tage)) : 0;
  return Math.min(t * TAGESPAUSCHALE, TAGESPAUSCHALE_HOECHSTBETRAG);
}

/**
 * Einkommensteuer, die die Tagespauschale spart.
 *
 * @param {object} e
 * @param {number} e.tage Homeoffice-Tage
 * @param {number} e.zvE zu versteuerndes Einkommen ohne die Tagespauschale
 * @param {number} [e.sonstigeWerbungskosten] übrige Werbungskosten, nur bei Arbeitnehmern
 * @param {boolean} [e.arbeitnehmer] false = Betriebsausgabe ohne Pauschbetrag
 * @param {boolean} [e.splitting] Splittingtarif (§ 32a Abs. 5 EStG)
 * @returns {{pauschale: number, zusaetzlicherAbzug: number, ersparnis: number, tageBisPauschbetrag: number}}
 *   Ersparnis ohne Solidaritätszuschlag und Kirchensteuer
 */
export function steuervorteil({ tage, zvE, sonstigeWerbungskosten = 0, arbeitnehmer = true, splitting = false }) {
  const pauschale = tagespauschale(tage);
  const sonstige = arbeitnehmer ? betrag(sonstigeWerbungskosten) : 0;

  const zusaetzlicherAbzug = arbeitnehmer
    ? Math.max(sonstige + pauschale, ARBEITNEHMER_PAUSCHBETRAG) - Math.max(sonstige, ARBEITNEHMER_PAUSCHBETRAG)
    : pauschale;
  const tageBisPauschbetrag = arbeitnehmer
    ? Math.ceil(Math.max(0, ARBEITNEHMER_PAUSCHBETRAG - sonstige) / TAGESPAUSCHALE)
    : 0;

  const einkommen = betrag(zvE);
  const ersparnis = tariflicheEinkommensteuer(einkommen, splitting)
    - tariflicheEinkommensteuer(Math.max(0, einkommen - zusaetzlicherAbzug), splitting);

  return { pauschale, zusaetzlicherAbzug, ersparnis, tageBisPauschbetrag };
}
