// Gesamtkosten eines Autos über die Haltedauer (Total Cost of Ownership)
//
// Die Rechnung selbst ist einfach; schwierig sind die Eingaben. Restwert,
// Versicherung und Werkstatt hängen am konkreten Modell und am Fahrer – ein
// fester Prozentsatz für „den“ Restwert eines Elektroautos wäre erfunden.
// Das Modul rechnet deshalb nur mit den Werten, die der Nutzer einträgt.
// Die Seite belegt sie mit den ADAC-Daten eines Modellpaars vor
// (./adac-autokosten.js), damit die Vorbelegung eine Quelle hat.
//
//   Wertverlust  = Kaufpreis − Restwert am Ende der Haltedauer
//   Energie/Jahr = km/Jahr ÷ 100 × Verbrauch × Preis
//   Gesamt       = Wertverlust + Jahre × (Energie + Fixkosten + Werkstatt)
//
// Nicht enthalten: Finanzierungskosten, Preissteigerungen und Förderungen.

const aufCent = (betrag) => Math.round(betrag * 100) / 100;

function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * @param {object} e
 * @param {number} e.jahre Haltedauer in Jahren
 * @param {number} e.kmProJahr Fahrleistung im Jahr
 * @param {number} e.kaufpreis
 * @param {number} e.restwert erwarteter Verkaufserlös am Ende
 * @param {number} e.verbrauchJe100km Liter oder kWh je 100 km
 * @param {number} e.energiepreis Euro je Liter oder je kWh
 * @param {number} e.fixkostenJahr Versicherung, Kfz-Steuer, HU
 * @param {number} e.werkstattJahr Wartung, Reparaturen, Reifen
 */
export function berechneTco({ jahre, kmProJahr, kaufpreis, restwert, verbrauchJe100km, energiepreis, fixkostenJahr, werkstattJahr }) {
  const j = zahl(jahre);
  const km = zahl(kmProJahr);
  const wertverlust = zahl(kaufpreis) - zahl(restwert);
  const energieJahr = (km / 100) * zahl(verbrauchJe100km) * zahl(energiepreis);
  const laufendJahr = energieJahr + zahl(fixkostenJahr) + zahl(werkstattJahr);
  const gesamt = wertverlust + j * laufendJahr;
  const gesamtKm = j * km;
  return {
    wertverlust: aufCent(wertverlust),
    energieJahr: aufCent(energieJahr),
    laufendJahr: aufCent(laufendJahr),
    gesamt: aufCent(gesamt),
    jeMonat: j > 0 ? aufCent(gesamt / (j * 12)) : 0,
    jeKm: gesamtKm > 0 ? Math.round((gesamt / gesamtKm) * 1000) / 1000 : 0,
  };
}

/**
 * Zwei Fahrzeuge über dieselbe Haltedauer und Fahrleistung.
 * `differenz` ist positiv, wenn das zweite Fahrzeug (b) günstiger ist.
 */
export function vergleicheTco({ jahre, kmProJahr, a, b }) {
  const ra = berechneTco({ jahre, kmProJahr, ...a });
  const rb = berechneTco({ jahre, kmProJahr, ...b });
  const laufendeErsparnisJahr = ra.laufendJahr - rb.laufendJahr;
  const mehrWertverlust = rb.wertverlust - ra.wertverlust;
  return {
    a: ra,
    b: rb,
    differenz: aufCent(ra.gesamt - rb.gesamt),
    // Nach wie vielen Jahren gleicht der geringere laufende Aufwand von b den
    // höheren Wertverlust aus – bei gleichem Restwert je Jahr gerechnet nur
    // als Orientierung, denn der Restwert selbst hängt an der Haltedauer.
    ausgleichNachJahren:
      laufendeErsparnisJahr > 0 && mehrWertverlust > 0
        ? Math.round((mehrWertverlust / laufendeErsparnisJahr) * 10) / 10
        : null,
  };
}
