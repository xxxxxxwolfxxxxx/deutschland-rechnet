/**
 * Schätzt Wartungs- und Verschleißkosten eines Autos.
 *
 * Bewusst ein Schätzmodell, kein Tarifwerk: Werkstattpreise und Reparaturbedarf
 * streuen stark. Die Größenordnungen orientieren sich an den Werkstatt- und
 * Reifenanteilen der ADAC-Autokostenrechnung. Drei Blöcke, weil sie sich
 * unterschiedlich verhalten:
 *
 *   Wartung   – Inspektion, Öl, HU/AU. Überwiegend fix, wächst nur leicht mit
 *               der Fahrleistung (mehr km = früher fällige Intervalle).
 *   Verschleiß – Bremsen, Auspuff, Stoßdämpfer, Reparaturen. Wächst mit den
 *               gefahrenen Kilometern und deutlich mit dem Fahrzeugalter.
 *   Reifen    – rein laufleistungsabhängig, ein Satz hält eine feste Strecke.
 */

const FAHRZEUGKLASSEN = {
  kleinwagen:   { label: 'Kleinwagen',   wartungBasis: 280, verschleissCentProKm: 2.5, reifensatzEuro: 380, reifenLaufleistungKm: 35000 },
  kompakt:      { label: 'Kompaktklasse', wartungBasis: 350, verschleissCentProKm: 3.5, reifensatzEuro: 480, reifenLaufleistungKm: 35000 },
  mittelklasse: { label: 'Mittelklasse', wartungBasis: 450, verschleissCentProKm: 4.5, reifensatzEuro: 620, reifenLaufleistungKm: 35000 },
  suv:          { label: 'SUV/Geländewagen', wartungBasis: 500, verschleissCentProKm: 5.0, reifensatzEuro: 750, reifenLaufleistungKm: 32000 },
  van:          { label: 'Van/Kombi',    wartungBasis: 450, verschleissCentProKm: 4.5, reifensatzEuro: 650, reifenLaufleistungKm: 35000 },
  oberklasse:   { label: 'Oberklasse',   wartungBasis: 650, verschleissCentProKm: 6.5, reifensatzEuro: 950, reifenLaufleistungKm: 30000 },
};

const REFERENZ_KM_PRO_JAHR = 15000;
/** Anteil der Wartung, der unabhängig von der Fahrleistung anfällt (HU, Ölwechsel nach Zeit). */
const WARTUNG_FIXANTEIL = 0.6;
/** Reparaturbedarf im ersten Jahr, meist noch Garantie. */
const ALTER_STARTFAKTOR = 0.5;
/** Zuwachs des Reparaturbedarfs je Lebensjahr. */
const ALTER_STEIGUNG = 0.12;
/** Ab etwa 16 Jahren steigen die Kosten nicht mehr weiter – dann wird eher verschrottet. */
const ALTER_MAXFAKTOR = 2.5;

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}

function berechneWartungskosten({ klasse, alter, kmProJahr }) {
  const k = FAHRZEUGKLASSEN[klasse] ?? FAHRZEUGKLASSEN.kompakt;
  const jahre = Math.max(0, alter || 0);
  const km = Math.max(0, kmProJahr || 0);

  const alterFaktor = Math.min(ALTER_MAXFAKTOR, ALTER_STARTFAKTOR + ALTER_STEIGUNG * jahre);

  const wartungProJahr = k.wartungBasis * (WARTUNG_FIXANTEIL + (1 - WARTUNG_FIXANTEIL) * (km / REFERENZ_KM_PRO_JAHR));
  const verschleissProJahr = km * (k.verschleissCentProKm / 100) * alterFaktor;
  const reifenProJahr = (km / k.reifenLaufleistungKm) * k.reifensatzEuro;

  const gesamtProJahr = wartungProJahr + verschleissProJahr + reifenProJahr;

  return {
    gesamtProJahr: runde(gesamtProJahr),
    gesamtProMonat: runde(gesamtProJahr / 12),
    wartungProJahr: runde(wartungProJahr),
    verschleissProJahr: runde(verschleissProJahr),
    reifenProJahr: runde(reifenProJahr),
    centProKm: km > 0 ? runde((gesamtProJahr / km) * 100) : 0,
    alterFaktor: runde(alterFaktor),
    reifenwechselAlleJahre: km > 0 ? runde(k.reifenLaufleistungKm / km) : null,
    klassenLabel: k.label,
  };
}

export { berechneWartungskosten, FAHRZEUGKLASSEN };
