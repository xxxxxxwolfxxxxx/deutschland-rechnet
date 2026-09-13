// Annuitaetendarlehen: Rate, Tilgungsplan und Effektivzins.
//
// Bis September 2026 stand diese Rechnung zweimal inline auf je einer Seite –
// im Tilgungs-Kreditrechner und im Kreditvergleich. Beide rechneten dieselbe
// Formel und keiner von beiden konnte einen Tilgungsplan ausgeben, obwohl der
// eine so heisst.
//
// Der Kreditvergleich verglich ausserdem zwei Angebote ueber die Summe
// rate × laufzeit. Das traegt nur, solange beide Angebote dieselbe Laufzeit
// haben – sonst gewinnt zuverlaessig das kuerzere, und zwar unabhaengig vom
// Zins. Deshalb steht hier auch der Effektivzins.

const aufCent = (b) => Math.round(b * 100) / 100;

/**
 * Monatliche Rate eines Annuitaetendarlehens.
 *
 * @param {object} e
 * @param {number} e.betrag    Nettodarlehensbetrag in Euro
 * @param {number} e.sollzins  nomineller Jahreszins in Prozent
 * @param {number} e.monate    Laufzeit in Monaten
 */
export function annuitaetenrate({ betrag, sollzins, monate }) {
  const n = Math.max(1, Math.round(monate));
  const i = sollzins / 100 / 12;
  if (i === 0) return aufCent(betrag / n);
  const q = Math.pow(1 + i, n);
  return aufCent((betrag * i * q) / (q - 1));
}

/**
 * Tilgungsplan Monat fuer Monat. Die letzte Rate weicht ab, weil die
 * gerundete Annuitaet die Restschuld nicht exakt auf null bringt – genau das
 * macht die Schlussrate im Vertrag aus.
 *
 * @returns {{monat:number, zins:number, tilgung:number, rate:number, restschuld:number}[]}
 */
export function tilgungsplan({ betrag, sollzins, monate, rate }) {
  const n = Math.max(1, Math.round(monate));
  const i = sollzins / 100 / 12;
  const annuitaet = rate ?? annuitaetenrate({ betrag, sollzins, monate: n });
  const plan = [];
  let rest = betrag;
  for (let m = 1; m <= n; m += 1) {
    const zins = aufCent(rest * i);
    let tilgung = aufCent(annuitaet - zins);
    let zahlung = annuitaet;
    // Letzte Rate: exakt auf null, nicht auf ein paar Cent Restschuld.
    if (m === n || tilgung >= rest) {
      tilgung = aufCent(rest);
      zahlung = aufCent(tilgung + zins);
    }
    rest = aufCent(rest - tilgung);
    plan.push({ monat: m, zins, tilgung, rate: zahlung, restschuld: rest });
    if (rest <= 0) break;
  }
  return plan;
}

/** Summen aus einem Tilgungsplan. */
export function darlehenskosten({ betrag, sollzins, monate }) {
  const rate = annuitaetenrate({ betrag, sollzins, monate });
  const plan = tilgungsplan({ betrag, sollzins, monate, rate });
  const gezahlt = aufCent(plan.reduce((s, z) => s + z.rate, 0));
  return {
    rate,
    monate: plan.length,
    gezahlt,
    zinsen: aufCent(gezahlt - betrag),
    schlussrate: plan.length ? plan[plan.length - 1].rate : 0,
    /** Anteil der ersten Rate, der nur Zins ist – bei langen Laufzeiten der grosse. */
    zinsanteilErsteRate: plan.length ? plan[0].zins : 0,
    plan,
  };
}

/**
 * Effektiver Jahreszins nach der Barwertmethode der Anlage zu § 16 PAngV:
 * der Zinssatz, bei dem der Barwert aller Raten dem ausgezahlten Betrag
 * entspricht. Ohne weitere Kosten faellt er mit dem aus dem Sollzins
 * aufgezinsten Jahreswert zusammen – mit Bearbeitungsgebuehr oder
 * Restschuldversicherung nicht mehr, und genau dafuer gibt es ihn.
 *
 * @param {object} e
 * @param {number} e.auszahlung  tatsaechlich ausgezahlter Betrag
 * @param {number} e.rate        monatliche Rate
 * @param {number} e.monate      Anzahl der Raten
 * @returns {number} Prozent pro Jahr
 */
export function effektivzins({ auszahlung, rate, monate }) {
  const n = Math.max(1, Math.round(monate));
  if (!(auszahlung > 0) || !(rate > 0)) return 0;
  // Eine Rate, die den Betrag nie zurueckzahlt, hat keinen positiven
  // Effektivzins. Ohne diese Pruefung lieferte die Bisektion klaglos einen
  // negativen Wert – 100 € auf 20.000 € ueber 36 Monate ergaben "-60,10 %".
  if (rate * n <= auszahlung) return 0;
  const barwert = (jahreszins) => {
    let s = 0;
    for (let m = 1; m <= n; m += 1) s += rate / Math.pow(1 + jahreszins / 100, m / 12);
    return s - auszahlung;
  };
  let lo = -99;
  let hi = 1000;
  for (let k = 0; k < 200; k += 1) {
    const mitte = (lo + hi) / 2;
    if (barwert(mitte) > 0) lo = mitte;
    else hi = mitte;
  }
  return Math.round(((lo + hi) / 2) * 1000) / 1000;
}

/** Der Sollzins, der zu einer gegebenen Rate gehoert – die Umkehrung oben. */
export function sollzinsAusRate({ betrag, rate, monate }) {
  const n = Math.max(1, Math.round(monate));
  if (!(betrag > 0) || !(rate > 0)) return 0;
  if (rate * n <= betrag) return 0;
  let lo = 0;
  let hi = 1000;
  for (let k = 0; k < 200; k += 1) {
    const mitte = (lo + hi) / 2;
    if (annuitaetenrate({ betrag, sollzins: mitte, monate: n }) < rate) lo = mitte;
    else hi = mitte;
  }
  return Math.round(((lo + hi) / 2) * 1000) / 1000;
}
