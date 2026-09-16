// Homeoffice-Pauschale (Tagespauschale)
//
// Rechtsgrundlage: § 4 Abs. 5 Satz 1 Nr. 6c EStG, Wortlaut abgerufen am
// 16.09.2026 auf https://www.gesetze-im-internet.de/estg/__4.html:
// „… ein Betrag von 6 Euro (Tagespauschale), höchstens 1 260 Euro im
// Wirtschafts- oder Kalenderjahr …“ – für jeden Kalendertag, an dem die
// Tätigkeit überwiegend in der häuslichen Wohnung ausgeübt und keine erste
// Tätigkeitsstätte außerhalb aufgesucht wird.

export const TAGESPAUSCHALE = 6;
export const TAGESPAUSCHALE_HOECHSTBETRAG = 1260;

/**
 * Abziehbare Tagespauschale für eine Zahl von Homeoffice-Tagen.
 * @param {number} tage Kalendertage im Homeoffice
 * @returns {number} Betrag in Euro
 */
export function tagespauschale(tage) {
  const t = Number.isFinite(tage) ? Math.max(0, Math.floor(tage)) : 0;
  return Math.min(t * TAGESPAUSCHALE, TAGESPAUSCHALE_HOECHSTBETRAG);
}
