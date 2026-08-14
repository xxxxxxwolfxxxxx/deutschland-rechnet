// Anfahrtskosten für Umzug, Dienstfahrt oder Abholung
//
// Rechtsstand: 2026-01-01
// Primärquelle: § 9 Abs. 1 Satz 3 Nr. 4a EStG i. V. m. § 5 Abs. 2 BRKG
//   https://www.gesetze-im-internet.de/estg/__9.html
//
// Ausgewiesen werden zwei verschiedene Beträge:
//
//   1. die tatsächlichen Spritkosten – das ist das, was die Fahrt kostet,
//   2. die Kilometerpauschale von 0,30 Euro je gefahrenem Kilometer, die bei
//      einer Auswärtstätigkeit als Werbungskosten angesetzt werden kann.
//
// Beide werden nicht addiert: die Pauschale ist kein zusätzlicher Aufwand,
// sondern der steuerlich abziehbare Betrag für dieselbe Fahrt.
//
// Nicht zu verwechseln mit der Entfernungspauschale für den Weg zur ersten
// Tätigkeitsstätte (§ 9 Abs. 1 Satz 3 Nr. 4 EStG, seit 2026 einheitlich
// 0,38 Euro je einfachem Entfernungskilometer) – dafür gibt es fahrtkosten.js.

/** Durchschnittsverbrauch in Litern je 100 km nach Fahrzeugklasse. */
const VERBRAUCH = { small: 6, compact: 7, large: 9, van: 12 };

/** Verbrauch, wenn keine Fahrzeugklasse zugeordnet werden kann. */
const VERBRAUCH_STANDARD = 7;

/**
 * Kilometerpauschale bei Auswärtstätigkeit je tatsächlich gefahrenem
 * Kilometer (§ 9 Abs. 1 Satz 3 Nr. 4a Satz 2 EStG i. V. m. § 5 Abs. 2 BRKG).
 */
const PAUSCHALE_PRO_KM = 0.30;

/**
 * Anfahrtskosten für eine oder mehrere Hin- und Rückfahrten.
 *
 * @param {object} eingabe
 * @param {number} eingabe.km einfache Entfernung in Kilometern
 * @param {string} eingabe.fahrzeug Fahrzeugklasse: small, compact, large, van
 * @param {number} eingabe.spritpreis Preis je Liter in Euro
 * @param {number} eingabe.fahrten Anzahl der Hin- und Rückfahrten
 */
function berechneAnfahrtskosten({ km, fahrzeug, spritpreis, fahrten }) {
  const verbrauch = VERBRAUCH[fahrzeug] || VERBRAUCH_STANDARD;
  const einfacheStrecke = Math.max(0, km) || 0;
  const anzahl = Math.max(0, fahrten) || 0;

  // Jede Fahrt umfasst Hin- und Rückweg.
  const gesamtKm = einfacheStrecke * 2 * anzahl;
  const spritkosten = (gesamtKm / 100) * verbrauch * spritpreis;
  const pauschale = gesamtKm * PAUSCHALE_PRO_KM;

  return {
    // Die Fahrt kostet den Sprit; die Pauschale steht daneben, nicht darin.
    gesamtkosten: Math.round(spritkosten * 100) / 100,
    gesamtKm,
    spritkosten: Math.round(spritkosten * 100) / 100,
    pauschale: Math.round(pauschale * 100) / 100,
    verbrauch,
  };
}

export { berechneAnfahrtskosten, VERBRAUCH, VERBRAUCH_STANDARD, PAUSCHALE_PRO_KM };
