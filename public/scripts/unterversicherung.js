// Elementarschaden: Was die Versicherung bei Unterversicherung zahlt
//
// Quelle: § 75 VVG, https://www.gesetze-im-internet.de/vvg_2008/__75.html
// (abgerufen am 14.09.2026)
//
// "Ist die Versicherungssumme erheblich niedriger als der Versicherungswert
// zur Zeit des Eintrittes des Versicherungsfalles, ist der Versicherer nur
// verpflichtet, die Leistung nach dem Verhältnis der Versicherungssumme zu
// diesem Wert zu erbringen."
//
// Früher schätzte die Seite eine Jahresprämie aus erfundenen Promillesätzen je
// "Risikozone". Prämien für Elementarschäden kalkuliert jeder Versicherer
// selbst; öffentlich belegbar sind sie nicht. Rechenbar ist dagegen, was im
// Schadenfall ankommt – mit Zahlen aus dem eigenen Vertrag.
//
// Wann eine Unterversicherung "erheblich" ist, sagt das Gesetz nicht. Das
// Modul rechnet die Quote deshalb immer aus und kennzeichnet nur, ob die
// Versicherungssumme den Wert unterschreitet. In welcher Reihenfolge
// Selbstbehalt und Kürzung angewendet werden, regeln die Bedingungen des
// Vertrags; hier wird zuerst gekürzt und dann der Selbstbehalt abgezogen.

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);
const runde = (n) => Math.round(n * 100) / 100;

/**
 * @param {object} p
 * @param {number} p.schaden Höhe des Schadens in Euro
 * @param {number} p.versicherungssumme laut Police
 * @param {number} p.versicherungswert tatsächlicher Wert zum Schadenzeitpunkt
 * @param {number} [p.selbstbehalt] fester Selbstbehalt in Euro
 * @param {boolean} [p.unterversicherungsverzicht] Vertrag verzichtet auf die Kürzung
 */
export function berechneEntschaedigung({
  schaden,
  versicherungssumme,
  versicherungswert,
  selbstbehalt = 0,
  unterversicherungsverzicht = false,
}) {
  const s = zahl(schaden);
  const summe = zahl(versicherungssumme);
  const wert = zahl(versicherungswert);

  const unterversichert = wert > 0 && summe < wert;
  const quote = unterversicherungsverzicht || !unterversichert ? 1 : summe / wert;

  const nachKuerzung = s * quote;
  // Mehr als die Versicherungssumme zahlt der Versicherer nicht.
  const gedeckelt = summe > 0 ? Math.min(nachKuerzung, summe) : nachKuerzung;
  const leistung = Math.max(0, gedeckelt - zahl(selbstbehalt));

  return {
    unterversichert,
    quoteProzent: runde(quote * 100),
    kuerzung: runde(s - nachKuerzung),
    leistung: runde(leistung),
    eigenanteil: runde(s - leistung),
    /** Versicherungssumme, bei der keine Kürzung einträte */
    noetigeSumme: runde(wert),
  };
}
