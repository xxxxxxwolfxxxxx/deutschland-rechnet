// Rumpfgeschwindigkeit eines Verdrängers
//
// Ein Verdränger schiebt sein eigenes Wellensystem vor sich her. Wird das Boot
// schneller, wird diese Welle länger — bis sie genau so lang ist wie der Rumpf.
// Dann liegt das Boot zwischen Bug- und Heckwelle und käme nur noch voran, wenn
// es den eigenen Wellenberg hochfährt. Das kostet unverhältnismäßig viel
// Leistung, weshalb diese Geschwindigkeit die praktische Grenze bildet.
//
// Klassisch:  v [kn] = 1,34 × √(LWL [ft])
// Metrisch:   v [kn] = 2,43 × √(LWL [m])     (1 m = 3,2808 ft)
//
// Maßgeblich ist die Wasserlinienlänge, nicht die Rumpflänge über alles.
// Überhänge an Bug und Heck zählen nicht mit.

/** Metrische Konstante, hergeleitet aus 1,34 × √3,2808. */
const KONSTANTE_METRISCH = 2.43;

/**
 * Berechnet die Rumpfgeschwindigkeit aus der Wasserlinienlänge.
 *
 * @param {object} eingabe
 * @param {number} eingabe.wasserlinieM  Wasserlinienlänge in Metern
 * @returns {{
 *   rumpfgeschwindigkeitKn: number,
 *   rumpfgeschwindigkeitKmh: number,
 *   gemuetlichKn: number,
 *   gleitgrenzeKn: number,
 *   verhaeltnis: number
 * }}
 */
export function berechneRumpfgeschwindigkeit({ wasserlinieM }) {
  const lwl = Math.max(0, Number(wasserlinieM) || 0);

  const knoten = KONSTANTE_METRISCH * Math.sqrt(lwl);

  // Bei etwa 80 % der Rumpfgeschwindigkeit liegt das Verhältnis von Verbrauch
  // zu Fahrt am günstigsten — das ist die übliche Marschfahrt.
  const gemuetlichKn = knoten * 0.8;

  // Ins Gleiten kommt ein Rumpf erst deutlich oberhalb, grob ab dem 1,5-fachen.
  const gleitgrenzeKn = knoten * 1.5;

  return {
    rumpfgeschwindigkeitKn: Math.round(knoten * 100) / 100,
    // 1 kn = 1,852 km/h
    rumpfgeschwindigkeitKmh: Math.round(knoten * 1.852 * 100) / 100,
    gemuetlichKn: Math.round(gemuetlichKn * 100) / 100,
    gleitgrenzeKn: Math.round(gleitgrenzeKn * 100) / 100,
    verhaeltnis: KONSTANTE_METRISCH,
  };
}
