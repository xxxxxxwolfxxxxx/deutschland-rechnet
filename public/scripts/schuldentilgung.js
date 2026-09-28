// Schuldentilgung: Schneeball- vs. Lawinenmethode
//
// Beide Methoden zahlen auf alle offenen Schulden monatlich Zinsen und
// verteilen eine gemeinsame Monatsrate zuerst auf die Schuld mit höchster
// Priorität; die Priorität unterscheidet die beiden Methoden:
// - Schneeball: kleinster Restbetrag zuerst (schnelle Erfolgserlebnisse)
// - Lawine: höchster Zinssatz zuerst (mathematisch optimal)
//
// Kein Gesetzesbezug – reine Finanzmathematik ohne Rechtsgrundlage, daher
// keine Primärquelle im Kopf dieser Datei.

/** Obergrenze der Simulation, falls die Rate nie zur vollständigen Tilgung reicht. */
export const MAX_MONATE = 600;

/**
 * @param {{rest: number, zins: number, original: number}[]} schulden
 * @param {number} rate monatliche Gesamtrate in Euro
 * @param {(a: {rest:number,zins:number}, b: {rest:number,zins:number}) => number} priorisiere
 * @param {number} [monateLimit] Obergrenze der Simulation, Standard MAX_MONATE
 * @returns {{monate: number, gesamtZinsen: number, schuldenEnde: {original:number,rest:number}[]}}
 */
function simuliere(schulden, rate, priorisiere, monateLimit = MAX_MONATE) {
  let schuldenCopy = schulden.map((s) => ({ ...s }));
  let gesamtZinsen = 0;
  let monate = 0;
  while (schuldenCopy.some((s) => s.rest > 0) && monate < monateLimit) {
    // Zinsen laufen auf JEDE offene Schuld weiter, unabhängig davon, ob die
    // Rate diesen Monat überhaupt bei ihr ankommt – sonst würden niedrig
    // priorisierte Schulden zinsfrei "einfrieren", nur weil die Rate vorher
    // an höher priorisierte Schulden ging.
    for (const s of schuldenCopy) {
      if (s.rest <= 0) continue;
      const zins = s.rest * (s.zins / 100 / 12);
      gesamtZinsen += zins;
      s.rest += zins;
    }
    schuldenCopy.sort(priorisiere);
    let verfuegbar = rate;
    for (const s of schuldenCopy) {
      if (s.rest <= 0 || verfuegbar <= 0) continue;
      const zahlung = Math.min(verfuegbar, s.rest);
      s.rest -= zahlung;
      verfuegbar -= zahlung;
    }
    monate++;
  }
  return {
    monate,
    gesamtZinsen,
    schuldenEnde: schuldenCopy.map(({ original, rest }) => ({ original, rest })),
  };
}

/**
 * Schneeball-Methode: kleinster Restbetrag zuerst. Bei gleichem Restbetrag
 * entscheidet ersatzweise der höhere Zinssatz – sonst hinge das Ergebnis
 * allein von der Eingabereihenfolge der Schulden ab.
 */
export function berechneSchneeball(schulden, rate, monateLimit) {
  return simuliere(schulden, rate, (a, b) => a.rest - b.rest || b.zins - a.zins, monateLimit);
}

/**
 * Lawinen-Methode: höchster Zinssatz zuerst. Bei gleichem Zinssatz
 * entscheidet ersatzweise der kleinere Restbetrag – sonst hinge das
 * Ergebnis allein von der Eingabereihenfolge der Schulden ab.
 */
export function berechneLawine(schulden, rate, monateLimit) {
  return simuliere(schulden, rate, (a, b) => b.zins - a.zins || a.rest - b.rest, monateLimit);
}
