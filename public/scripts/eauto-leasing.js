// Was ein Leasingvertrag für ein Elektroauto tatsächlich kostet
//
// Die Leasingrate lässt sich nicht aus dem Kaufpreis „berechnen“ – sie steht
// im Angebot. Die frühere Fassung dieser Seite nahm einen „Leasingfaktor“ von
// 2 bis 5 % des Kaufpreises pro JAHR an und kam so für ein Auto zu 45.000 €
// auf 131 € im Monat. Gebräuchlich ist eine andere Kennzahl:
//
//   Leasingfaktor       = Monatsrate ÷ Bruttolistenpreis × 100
//   Gesamtkostenfaktor  = (Monatsrate + (Sonderzahlung + Überführung) ÷ Laufzeit)
//                         ÷ Bruttolistenpreis × 100
//
// Beide sind keine gesetzlich definierten Größen, sondern Vergleichsmaße für
// Angebote. Der Gesamtkostenfaktor ist der ehrlichere, weil er eine hohe
// Sonderzahlung nicht hinter einer niedrigen Rate versteckt.
//
// Alle Vertragswerte trägt der Nutzer aus dem Angebot ein. Mehrkilometer
// kosten den Satz aus dem Vertrag; Minderkilometer werden nicht vergütet, weil
// viele Verträge das ausschließen oder deckeln.

const aufCent = (betrag) => Math.round(betrag * 100) / 100;

function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * @param {object} e
 * @param {number} e.listenpreis Bruttolistenpreis in Euro
 * @param {number} e.rate Monatsrate in Euro
 * @param {number} e.laufzeitMonate
 * @param {number} e.sonderzahlung
 * @param {number} e.ueberfuehrung Überführungs- und Zulassungskosten
 * @param {number} e.vertragsKmJahr vereinbarte Fahrleistung je Jahr
 * @param {number} e.erwarteteKmJahr tatsächlich erwartete Fahrleistung je Jahr
 * @param {number} e.mehrKmSatz Euro je Mehrkilometer laut Vertrag
 * @param {number} e.verbrauchJe100km kWh je 100 km
 * @param {number} e.strompreis Euro je kWh
 */
export function berechneLeasingkosten({
  listenpreis, rate, laufzeitMonate, sonderzahlung, ueberfuehrung,
  vertragsKmJahr, erwarteteKmJahr, mehrKmSatz, verbrauchJe100km, strompreis,
}) {
  const lp = zahl(listenpreis);
  const r = zahl(rate);
  const n = Math.floor(zahl(laufzeitMonate));
  const einmalig = zahl(sonderzahlung) + zahl(ueberfuehrung);
  const jahre = n / 12;

  const vertragskosten = r * n + einmalig;
  const mehrKm = Math.max(0, zahl(erwarteteKmJahr) - zahl(vertragsKmJahr)) * jahre;
  const mehrKmKosten = mehrKm * zahl(mehrKmSatz);
  const kmGesamt = zahl(erwarteteKmJahr) * jahre;
  const stromkosten = (kmGesamt / 100) * zahl(verbrauchJe100km) * zahl(strompreis);
  const gesamt = vertragskosten + mehrKmKosten + stromkosten;

  return {
    leasingfaktor: lp > 0 ? Math.round((r / lp) * 10000) / 100 : 0,
    gesamtkostenfaktor: lp > 0 && n > 0 ? Math.round(((r + einmalig / n) / lp) * 10000) / 100 : 0,
    vertragskosten: aufCent(vertragskosten),
    mehrKm: Math.round(mehrKm),
    mehrKmKosten: aufCent(mehrKmKosten),
    stromkosten: aufCent(stromkosten),
    gesamt: aufCent(gesamt),
    jeMonat: n > 0 ? aufCent(gesamt / n) : 0,
    jeKm: kmGesamt > 0 ? Math.round((gesamt / kmGesamt) * 1000) / 1000 : 0,
    kmGesamt: Math.round(kmGesamt),
  };
}
