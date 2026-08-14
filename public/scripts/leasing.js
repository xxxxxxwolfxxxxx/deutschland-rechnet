// Leasingrate und Effektivkosten
//
// Gerechnet wird die übliche Näherung des Kilometerleasings: Der
// Leasingnehmer trägt den Wertverlust vom Fahrzeugpreis auf den Restwert,
// vermindert um die Anzahlung, und verzinst das gebundene Kapital.
//
//   Wertverlust  = Fahrzeugpreis − Restwert − Anzahlung
//   Zinskosten   = (finanziertes Kapital + Restwert) / 2 × Zins × Jahre
//   Rate         = (Wertverlust + Zinskosten) / Laufzeit in Monaten
//   Gesamtkosten = Anzahlung + Rate × Laufzeit
//
// Bis zum 14.08.2026 rechnete das Modul die Zinsen auf (Fahrzeugpreis +
// Restwert) / 2 – als hätte es die Anzahlung nie gegeben, obwohl gerade sie
// das gebundene Kapital senkt. Die Effektivkosten je Kilometer ließen die
// Anzahlung ebenfalls außen vor und fielen dadurch zu niedrig aus. Die
// Rückgabe hieß gesamtKosten, die Seite las gesamtkosten – der Detailblock
// brach deshalb mit einem Fehler ab.
//
// Nicht abgebildet: Überführungs- und Zulassungskosten, Mehr- und
// Minderkilometer, Sonderzahlungen sowie Wartungs- und Versicherungspakete.

const aufCent = (betrag) => Math.round(betrag * 100) / 100;

/**
 * Leasingrate und Kosten je Kilometer.
 *
 * @param {object} eingaben
 * @param {number} eingaben.neupreis Fahrzeugpreis in Euro
 * @param {number} eingaben.anzahlung Leasingsonderzahlung in Euro
 * @param {number} eingaben.laufzeit Laufzeit in Monaten
 * @param {number} eingaben.restwert kalkulierter Restwert in Euro
 * @param {number} eingaben.zins Sollzins in Prozent p. a.
 * @param {number} eingaben.km Fahrleistung im Jahr, in Kilometern
 */
function berechneLeasing({ neupreis, anzahlung, laufzeit, restwert, zins, km }) {
  const monate = Math.max(0, laufzeit);
  const sonderzahlung = Math.max(0, Math.min(anzahlung, neupreis));

  // Wertverlust, den die Raten decken müssen.
  const leasingbetrag = Math.max(0, neupreis - restwert - sonderzahlung);

  // Verzinst wird das durchschnittlich gebundene Kapital: zu Beginn der um die
  // Anzahlung verminderte Fahrzeugpreis, am Ende der Restwert.
  const finanziertesKapital = Math.max(0, neupreis - sonderzahlung);
  const zinskosten = ((finanziertesKapital + restwert) / 2) * (zins / 100) * (monate / 12);

  const gesamtLeasing = leasingbetrag + zinskosten;
  const rate = monate > 0 ? gesamtLeasing / monate : 0;
  const gesamtkosten = sonderzahlung + rate * monate;

  const kilometer = km * (monate / 12);
  const kostenProKm = kilometer > 0 ? gesamtkosten / kilometer : 0;

  return {
    rate: aufCent(rate),
    gesamtLeasing: aufCent(gesamtLeasing),
    gesamtkosten: aufCent(gesamtkosten),
    zinskosten: aufCent(zinskosten),
    kilometer,
    kostenProKm: Math.round(kostenProKm * 1000) / 1000,
  };
}

export { berechneLeasing };
