// Wertgebühren der Gerichte und Anwälte
//
// Quellen (abgerufen am 14.09.2026, Fassung BGBl. 2025 I Nr. 109):
// - § 34 Abs. 1 GKG: https://www.gesetze-im-internet.de/gkg_2004/__34.html
// - § 28 Abs. 1 FamGKG: https://www.gesetze-im-internet.de/famgkg/__28.html
// - § 13 Abs. 1 RVG: https://www.gesetze-im-internet.de/rvg/__13.html
//
// GKG und FamGKG verwenden dieselbe Staffel; beide Paragraphen nennen
// wortgleich 40 Euro bis 500 Euro Wert und dieselben Erhöhungsbeträge.

const rundeAufCent = (betrag) => Math.round(betrag * 100) / 100;
const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);

/** Grundbetrag bis 500 € Wert, dann je angefangenem Schritt ein fester Betrag. */
function staffelgebuehr(wert, grundbetrag, stufen) {
  const w = zahl(wert);
  let gebuehr = grundbetrag;
  let untergrenze = 500;
  for (const stufe of stufen) {
    if (w <= untergrenze) break;
    const obergrenze = Math.min(w, stufe.bis);
    gebuehr += Math.ceil((obergrenze - untergrenze) / stufe.schritt) * stufe.betrag;
    untergrenze = stufe.bis;
  }
  return rundeAufCent(gebuehr);
}

// § 34 Abs. 1 GKG = § 28 Abs. 1 FamGKG
const STUFEN_GERICHT = [
  { bis: 2000, schritt: 500, betrag: 21 },
  { bis: 10000, schritt: 1000, betrag: 22.5 },
  { bis: 25000, schritt: 3000, betrag: 30.5 },
  { bis: 50000, schritt: 5000, betrag: 40.5 },
  { bis: 200000, schritt: 15000, betrag: 140 },
  { bis: 500000, schritt: 30000, betrag: 210 },
  { bis: Infinity, schritt: 50000, betrag: 210 },
];

// § 13 Abs. 1 RVG
const STUFEN_RVG = [
  { bis: 2000, schritt: 500, betrag: 41.5 },
  { bis: 10000, schritt: 1000, betrag: 59.5 },
  { bis: 25000, schritt: 3000, betrag: 55 },
  { bis: 50000, schritt: 5000, betrag: 86 },
  { bis: 200000, schritt: 15000, betrag: 99.5 },
  { bis: 500000, schritt: 30000, betrag: 140 },
  { bis: Infinity, schritt: 50000, betrag: 175 },
];

/** Volle Gerichtsgebühr (1,0) nach § 34 Abs. 1 GKG. */
export function gebuehrGKG(wert) {
  return staffelgebuehr(wert, 40, STUFEN_GERICHT);
}

/** Volle Gerichtsgebühr (1,0) nach § 28 Abs. 1 FamGKG. */
export function gebuehrFamGKG(wert) {
  return staffelgebuehr(wert, 40, STUFEN_GERICHT);
}

/** Volle Anwaltsgebühr (1,0) nach § 13 Abs. 1 RVG. */
export function gebuehrRVG(wert) {
  return staffelgebuehr(wert, 51.5, STUFEN_RVG);
}

/** VV Nr. 7002 RVG: 20 Prozent der Gebühren, höchstens 20 Euro */
export const AUSLAGENPAUSCHALE_ANTEIL = 0.2;
export const AUSLAGENPAUSCHALE_HOECHSTBETRAG = 20;

/** VV Nr. 7008 RVG i. V. m. § 12 Abs. 1 UStG */
export const UMSATZSTEUERSATZ = 0.19;

/**
 * Anwaltsvergütung aus Gebührensätzen: Gebühren, Auslagenpauschale, Umsatzsteuer.
 *
 * @param {number} wert Gegenstandswert
 * @param {number[]} saetze Gebührensätze, z. B. [1.3, 1.2]
 */
export function anwaltsverguetungAusSaetzen(wert, saetze) {
  const voll = gebuehrRVG(wert);
  const gebuehren = rundeAufCent(saetze.reduce((summe, satz) => summe + rundeAufCent(voll * satz), 0));
  const pauschale = Math.min(AUSLAGENPAUSCHALE_HOECHSTBETRAG, rundeAufCent(gebuehren * AUSLAGENPAUSCHALE_ANTEIL));
  const netto = rundeAufCent(gebuehren + pauschale);
  const umsatzsteuer = rundeAufCent(netto * UMSATZSTEUERSATZ);
  return { gebuehren, pauschale, netto, umsatzsteuer, brutto: rundeAufCent(netto + umsatzsteuer) };
}
