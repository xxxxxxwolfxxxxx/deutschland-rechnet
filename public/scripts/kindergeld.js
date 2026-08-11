// Kindergeld und Freibeträge für Kinder
//
// Rechtsstand: 2026-01-01
// Primärquellen:
// - § 66 Abs. 1 EStG   https://www.gesetze-im-internet.de/estg/__66.html
// - § 32 Abs. 6 EStG   https://www.gesetze-im-internet.de/estg/__32.html
//
// Bis zum 11.08.2026 stand hier der Betrag des Jahres 2025 (255 Euro).

export const KINDERGELD_STAND = '2026-01-01';

/** § 66 Abs. 1 EStG: für jedes Kind derselbe Betrag, keine Staffelung. */
export const KINDERGELD_MONAT = 259;

/**
 * § 32 Abs. 6 Satz 1 EStG: Freibetrag für das sächliche Existenzminimum,
 * je Elternteil. Satz 2 verdoppelt ihn bei Zusammenveranlagung.
 */
export const KINDERFREIBETRAG_JE_ELTERNTEIL = 3414;

/** § 32 Abs. 6 Satz 1 EStG: Betreuungs-, Erziehungs- und Ausbildungsbedarf. */
export const BEA_FREIBETRAG_JE_ELTERNTEIL = 1464;

/** Beide Freibeträge zusammen, für ein Kind mit zwei Elternteilen. */
export const FREIBETRAG_JE_KIND =
  (KINDERFREIBETRAG_JE_ELTERNTEIL + BEA_FREIBETRAG_JE_ELTERNTEIL) * 2;

/**
 * Kindergeldanspruch einer Familie.
 *
 * @param {object} eingabe
 * @param {number} eingabe.anzahlKinder Kinder, für die Anspruch besteht
 */
export function berechneKindergeld({ anzahlKinder } = {}) {
  const kinder = ganzeKinder(anzahlKinder);

  return {
    anzahlKinder: kinder,
    monat: kinder * KINDERGELD_MONAT,
    jahr: kinder * KINDERGELD_MONAT * 12,
    betragProKind: KINDERGELD_MONAT,
    freibetragJeKind: FREIBETRAG_JE_KIND,
    freibetragGesamt: kinder * FREIBETRAG_JE_KIND,
  };
}

function ganzeKinder(wert) {
  return Number.isFinite(wert) ? Math.max(0, Math.floor(wert)) : 0;
}
