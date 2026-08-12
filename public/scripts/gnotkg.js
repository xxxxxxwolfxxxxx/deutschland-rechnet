// Notar- und Grundbuchkosten nach dem GNotKG – Stand 12.08.2026
//
// Notar- und Grundbuchkosten sind keine Pauschale, sondern Wertgebühren nach
// § 34 GNotKG. Sie sind degressiv: bei 400.000 € Kaufpreis kosten sie rund
// 3.980 €, also knapp 1,0 % – eine über den Daumen angesetzte 2-%-Pauschale
// verdoppelt den Betrag, und zwar mit dem Kaufpreis wachsend.
//
// Quelle: GNotKG, gezogen von
// https://www.gesetze-im-internet.de/gnotkg/xml.zip (Stand 06.05.2026).
// Die Stufen unten sind § 34 Abs. 2 GNotKG; sie sind gegen alle 92 Stützwerte
// der Anlage 2 (Tabelle B, Geschäftswerte bis 3 Mio. €) geprüft.

// Untere Grenze jeder Wertgebühr, § 34 Abs. 5 GNotKG.
const MINDESTGEBUEHR = 15;

// Gebühr für einen Geschäftswert bis 500 €, § 34 Abs. 2 Satz 1 GNotKG.
const SOCKEL_BIS_500 = 15;

// § 34 Abs. 2 Satz 2 GNotKG: bis zum Geschäftswert `bis` erhöht sich die
// Gebühr für jeden angefangenen Betrag von `schritt` Euro um `betrag` Euro.
const TABELLE_B_STUFEN = [
  { bis: 2000, schritt: 500, betrag: 4.0 },
  { bis: 10000, schritt: 1000, betrag: 6.0 },
  { bis: 25000, schritt: 3000, betrag: 8.0 },
  { bis: 50000, schritt: 5000, betrag: 10.0 },
  { bis: 200000, schritt: 15000, betrag: 27.0 },
  { bis: 500000, schritt: 30000, betrag: 50.0 },
  { bis: 5000000, schritt: 50000, betrag: 80.0 },
  { bis: 10000000, schritt: 200000, betrag: 130.0 },
  { bis: 20000000, schritt: 250000, betrag: 150.0 },
  { bis: 30000000, schritt: 500000, betrag: 280.0 },
  { bis: Infinity, schritt: 1000000, betrag: 120.0 },
];

// § 34 Abs. 4 GNotKG: auf den nächstliegenden Cent, 0,5 Cent aufgerundet.
function aufCent(betrag) {
  return Math.round(betrag * 100) / 100;
}

/**
 * Volle Gebühr (Gebührensatz 1,0) nach Tabelle B des GNotKG.
 *
 * @param {number} geschaeftswert Geschäftswert in Euro
 * @returns {number} Gebühr in Euro
 */
export function gebuehrTabelleB(geschaeftswert) {
  if (!(geschaeftswert > 500)) return SOCKEL_BIS_500;

  let gebuehr = SOCKEL_BIS_500;
  let untergrenze = 500;

  for (const stufe of TABELLE_B_STUFEN) {
    const obergrenze = Math.min(geschaeftswert, stufe.bis);
    if (obergrenze > untergrenze) {
      const schritte = Math.ceil((obergrenze - untergrenze) / stufe.schritt);
      gebuehr += schritte * stufe.betrag;
      untergrenze = obergrenze;
    }
    if (geschaeftswert <= stufe.bis) break;
  }

  return aufCent(gebuehr);
}

/**
 * Gebühr nach Tabelle B mit dem Gebührensatz der jeweiligen KV-Nummer.
 *
 * @param {number} geschaeftswert Geschäftswert in Euro
 * @param {number} satz Gebührensatz, z. B. 2,0 für KV 21100
 * @param {number} [mindestbetrag] Mindestbetrag der KV-Nummer, falls höher
 *   als die gesetzliche Mindestgebühr von 15 € (§ 34 Abs. 5 GNotKG)
 * @returns {number} Gebühr in Euro
 */
export function gebuehrB(geschaeftswert, satz, mindestbetrag = 0) {
  const gebuehr = gebuehrTabelleB(geschaeftswert) * satz;
  return aufCent(Math.max(gebuehr, MINDESTGEBUEHR, mindestbetrag));
}

// Umsatzsteuersatz auf die Notarkosten, KV 32014 GNotKG i. V. m. § 12 Abs. 1
// UStG. Grundbuchgebühren sind Gerichtskosten und damit nicht steuerbar.
const UMSATZSTEUER = 0.19;

/**
 * Notar- und Grundbuchkosten eines Immobilienkaufvertrags.
 *
 * Zusammensetzung beim üblichen Kaufvertrag ohne Grundschuldbestellung:
 *   Notar    2,0 Beurkundung des Kaufvertrags (KV 21100, mind. 120 €)
 *          + 0,5 Vollzug (KV 22110)
 *          + 0,5 Betreuung (KV 22200)
 *          + 19 % Umsatzsteuer (KV 32014)
 *   Grundbuch 0,5 Auflassungsvormerkung (KV 14150)
 *          + 1,0 Eintragung des Eigentümers (KV 14110)
 *
 * Nicht enthalten ist die Grundschuldbestellung (KV 21200, KV 14121), die nur
 * bei fremdfinanziertem Kauf anfällt und sich nach dem Grundschuldbetrag
 * richtet, nicht nach dem Kaufpreis.
 *
 * @param {number} kaufpreis Kaufpreis in Euro (= Geschäftswert)
 * @returns {{notarNetto: number, umsatzsteuer: number, notar: number,
 *   grundbuch: number, gesamt: number}}
 */
export function berechneNotarUndGrundbuch(kaufpreis) {
  const beurkundung = gebuehrB(kaufpreis, 2.0, 120); // KV 21100
  const vollzug = gebuehrB(kaufpreis, 0.5); // KV 22110
  const betreuung = gebuehrB(kaufpreis, 0.5); // KV 22200
  const notarNetto = aufCent(beurkundung + vollzug + betreuung);
  const umsatzsteuer = aufCent(notarNetto * UMSATZSTEUER); // KV 32014
  const notar = aufCent(notarNetto + umsatzsteuer);

  const vormerkung = gebuehrB(kaufpreis, 0.5); // KV 14150
  const eigentumsumschreibung = gebuehrB(kaufpreis, 1.0); // KV 14110
  const grundbuch = aufCent(vormerkung + eigentumsumschreibung);

  return {
    notarNetto,
    umsatzsteuer,
    notar,
    grundbuch,
    gesamt: aufCent(notar + grundbuch),
  };
}
