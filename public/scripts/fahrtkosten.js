// Entfernungspauschale (Pendlerpauschale) nach § 9 Abs. 1 Satz 3 Nr. 4 EStG
//
// Rechtsstand: 2026-01-01
// Primärquelle: https://www.gesetze-im-internet.de/estg/__9.html
//
// Seit 2026 gilt ein einheitlicher Satz von 0,38 Euro je vollem
// Entfernungskilometer. Die frühere Staffelung – 0,30 Euro für die ersten
// 20 Kilometer und 0,38 Euro ab dem 21. – steht nicht mehr im Gesetz.
//
// Maßgeblich ist die einfache Entfernung, nicht Hin- und Rückweg, und nur
// volle Kilometer der kürzesten Straßenverbindung.

export const ENTFERNUNGSPAUSCHALE_STAND = '2026-01-01';

/** Satz je vollem Entfernungskilometer (§ 9 Abs. 1 Satz 3 Nr. 4 Satz 2 EStG). */
export const ENTFERNUNGSPAUSCHALE_JE_KM = 0.38;

/**
 * Höchstbetrag im Kalenderjahr. Er gilt nicht, soweit ein eigener oder zur
 * Nutzung überlassener Kraftwagen benutzt wird (§ 9 Abs. 1 Satz 3 Nr. 4 Satz 2
 * Halbsatz 2 EStG).
 */
export const ENTFERNUNGSPAUSCHALE_HOECHSTBETRAG = 4500;

/**
 * Entfernungspauschale für ein Jahr.
 *
 * @param {object} eingabe
 * @param {number} eingabe.entfernungKm einfache Entfernung Wohnung – erste Tätigkeitsstätte
 * @param {number} [eingabe.arbeitstageProJahr] Tage, an denen die Tätigkeitsstätte aufgesucht wird
 * @param {boolean} [eingabe.eigenerPkw] true, wenn ein eigener Kraftwagen benutzt wird –
 *   dann greift der Höchstbetrag von 4.500 Euro nicht
 */
export function berechnefahrtkosten({ entfernungKm, arbeitstageProJahr = 220, eigenerPkw = true }) {
  const km = Math.max(0, Math.floor(zahl(entfernungKm)));
  const tage = Math.max(0, zahl(arbeitstageProJahr));

  const pauschaleTaeglich = runde(km * ENTFERNUNGSPAUSCHALE_JE_KM);
  const ungedeckelt = runde(pauschaleTaeglich * tage);
  const jahresabzug = eigenerPkw
    ? ungedeckelt
    : Math.min(ungedeckelt, ENTFERNUNGSPAUSCHALE_HOECHSTBETRAG);

  return {
    pauschaleTaeglich,
    jahresabzug,
    jahresabzugVorDeckelung: ungedeckelt,
    gedeckelt: jahresabzug < ungedeckelt,
    arbeitstageProJahr: tage,
    entfernungKm: km,
  };
}

function zahl(wert) {
  return Number.isFinite(wert) ? wert : 0;
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}
