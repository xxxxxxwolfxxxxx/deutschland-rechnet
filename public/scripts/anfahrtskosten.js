// Anfahrtskosten für Umzug, Dienstfahrt oder Abholung
//
// Rechtsstand: 2026-01-01
// Primärquelle: § 9 Abs. 1 Satz 3 Nr. 4a Satz 2 EStG i. V. m. § 5 Abs. 2 BRKG
//   https://www.gesetze-im-internet.de/estg/__9.html
//   https://www.gesetze-im-internet.de/brkg_2005/__5.html (abgerufen am 14.09.2026)
//
// Ausgewiesen werden zwei verschiedene Beträge:
//
//   1. die tatsächlichen Spritkosten – das ist das, was die Fahrt kostet,
//   2. die Kilometerpauschale von 0,30 Euro je gefahrenem Kilometer, die bei
//      einer beruflichen Auswärtstätigkeit als Werbungskosten angesetzt werden
//      kann: § 9 Abs. 1 Satz 3 Nr. 4a Satz 2 EStG verweist auf die höchste
//      Wegstreckenentschädigung nach dem BRKG, das sind 30 Cent je Kilometer
//      nach § 5 Abs. 2 BRKG.
//
// Beide werden nicht addiert: die Pauschale ist kein zusätzlicher Aufwand,
// sondern der steuerlich abziehbare Betrag für dieselbe Fahrt.
//
// Früher setzte das Modul den Verbrauch je Fahrzeugklasse fest (6, 7, 9 und
// 12 l/100 km) – ohne Quelle. Der Verbrauch ist jetzt eine Eingabe.
//
// Nicht zu verwechseln mit der Entfernungspauschale für den Weg zur ersten
// Tätigkeitsstätte (§ 9 Abs. 1 Satz 3 Nr. 4 EStG) – dafür gibt es fahrtkosten.js.

/** § 9 Abs. 1 Satz 3 Nr. 4a Satz 2 EStG i. V. m. § 5 Abs. 2 BRKG */
const PAUSCHALE_PRO_KM = 0.30;

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);
const runde = (n) => Math.round(n * 100) / 100;

/**
 * Anfahrtskosten für eine oder mehrere Hin- und Rückfahrten.
 *
 * @param {object} eingabe
 * @param {number} eingabe.km einfache Entfernung in Kilometern
 * @param {number} eingabe.verbrauch Liter je 100 km laut Bordcomputer oder Tankbuch
 * @param {number} eingabe.spritpreis Preis je Liter in Euro
 * @param {number} eingabe.fahrten Anzahl der Hin- und Rückfahrten
 */
function berechneAnfahrtskosten({ km, verbrauch, spritpreis, fahrten }) {
  // Jede Fahrt umfasst Hin- und Rückweg.
  const gesamtKm = zahl(km) * 2 * Math.floor(zahl(fahrten));
  const liter = (gesamtKm / 100) * zahl(verbrauch);
  const spritkosten = liter * zahl(spritpreis);

  return {
    // Die Fahrt kostet den Sprit; die Pauschale steht daneben, nicht darin.
    gesamtkosten: runde(spritkosten),
    gesamtKm,
    liter: runde(liter),
    spritkosten: runde(spritkosten),
    pauschale: runde(gesamtKm * PAUSCHALE_PRO_KM),
  };
}

export { berechneAnfahrtskosten, PAUSCHALE_PRO_KM };
