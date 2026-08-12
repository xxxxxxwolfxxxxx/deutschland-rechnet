// Wertgebühren nach dem Gerichts- und Notarkostengesetz (GNotKG)
//
// Grundbuch- und Notargebühren sind keine Prozentsätze vom Kaufpreis, sondern
// gestaffelte Wertgebühren: Aus dem Geschäftswert ergibt sich über Tabelle B
// eine volle Gebühr (1,0), die das Kostenverzeichnis (Anlage 1 GNotKG) je
// Vorgang mit einem Gebührensatz multipliziert.
//
// Quelle: https://www.gesetze-im-internet.de/gnotkg/ (Stand 06.05.2026)

// § 34 Abs. 2 GNotKG. Bis 500 € Geschäftswert beträgt die Gebühr 15 €; darüber
// erhöht sie sich stufenweise "für jeden angefangenen Betrag von weiteren
// ... Euro". Anlage 2 bildet daraus die Tabelle bis 3 Mio. € ab – die Staffel
// gilt aber unbegrenzt weiter.
const GEBUEHR_BIS_500 = 15;

const STUFEN_TABELLE_B = [
  { bis: 2000, schritt: 500, betrag: 4 },
  { bis: 10000, schritt: 1000, betrag: 6 },
  { bis: 25000, schritt: 3000, betrag: 8 },
  { bis: 50000, schritt: 5000, betrag: 10 },
  { bis: 200000, schritt: 15000, betrag: 27 },
  { bis: 500000, schritt: 30000, betrag: 50 },
  { bis: 5000000, schritt: 50000, betrag: 80 },
  { bis: 10000000, schritt: 200000, betrag: 130 },
  { bis: 20000000, schritt: 250000, betrag: 150 },
  { bis: 30000000, schritt: 500000, betrag: 280 },
  { bis: Infinity, schritt: 1000000, betrag: 120 },
];

// § 34 Abs. 5 GNotKG
export const MINDESTGEBUEHR = 15;

// § 34 Abs. 4 GNotKG: auf den nächstliegenden Cent, 0,5 Cent werden aufgerundet.
function rundeAufCent(betrag) {
  return Math.round(betrag * 100) / 100;
}

/**
 * Volle Gebühr (1,0) nach Tabelle B, Anlage 2 zu § 34 Abs. 3 GNotKG.
 *
 * @param {number} geschaeftswert Geschäftswert in Euro
 * @returns {number} Gebühr in Euro
 */
export function gebuehrTabelleB(geschaeftswert) {
  const wert = Number(geschaeftswert);
  if (!Number.isFinite(wert) || wert <= 500) return GEBUEHR_BIS_500;

  let gebuehr = GEBUEHR_BIS_500;
  let untergrenze = 500;

  for (const stufe of STUFEN_TABELLE_B) {
    const obergrenze = Math.min(wert, stufe.bis);
    gebuehr += Math.ceil((obergrenze - untergrenze) / stufe.schritt) * stufe.betrag;
    untergrenze = obergrenze;
    if (wert <= stufe.bis) break;
  }

  return rundeAufCent(gebuehr);
}

/**
 * Gebühr nach Tabelle B mit dem Gebührensatz einer KV-Position.
 *
 * @param {number} geschaeftswert Geschäftswert in Euro
 * @param {number} satz Gebührensatz aus dem Kostenverzeichnis, z. B. 1,3
 * @param {number} [mindestbetrag] Mindestbetrag der KV-Position; ohne Angabe
 *   gilt der gesetzliche Mindestbetrag von 15 € (§ 34 Abs. 5 GNotKG)
 * @param {number} [hoechstbetrag] Höchstbetrag der KV-Position, sofern eine
 *   Deckelung vorgesehen ist (z. B. 70 € bei KV 25100)
 * @returns {number} Gebühr in Euro
 */
export function gebuehrB(geschaeftswert, satz, mindestbetrag = MINDESTGEBUEHR, hoechstbetrag = Infinity) {
  const wertgebuehr = rundeAufCent(gebuehrTabelleB(geschaeftswert) * satz);
  return Math.min(Math.max(wertgebuehr, mindestbetrag), hoechstbetrag);
}
