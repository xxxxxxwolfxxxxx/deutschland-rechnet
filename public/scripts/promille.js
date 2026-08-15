// Blutalkoholkonzentration nach der Widmark-Formel
//
// BAK = Alkoholmenge in Gramm / (Körpergewicht in kg × Verteilungsfaktor r),
// abzüglich des stündlichen Abbaus.
//
// Die Kennzahlen sind forensische Konventionswerte, keine Rechtsnormen: Der
// Verteilungsfaktor r bildet den Anteil des Körperwassers ab, der Abbau von
// 0,15 Promille je Stunde ist ein Mittelwert. Beide streuen individuell
// erheblich.
//
// Was die Formel NICHT abbildet und was sie deshalb als Entscheidungsgrundlage
// vor einer Fahrt untauglich macht:
// - das Resorptionsdefizit: Ein Teil des Alkohols erreicht das Blut nie,
//   abhängig von Mageninhalt und Trinkgeschwindigkeit
// - die Resorptionsphase: Der Höchstwert wird erst nach einer Weile erreicht,
//   die Rechnung setzt ihn sofort an
// - der Abbau wird ab Trinkbeginn abgezogen, nicht ab dem letzten Glas
//
// Rechtliche Grenzwerte stehen bewusst nicht hier, sondern in busgeld.js
// (§ 24a StVG, § 316 StGB).

/** Verteilungsfaktoren nach Widmark: Anteil des Körperwassers am Gewicht. */
export const VERTEILUNGSFAKTOR = { m: 0.7, w: 0.6 };

/** Dichte von Ethanol in g/ml – aus Volumenprozent wird damit eine Masse. */
export const DICHTE_ETHANOL = 0.8;

/** Stündlicher Abbau in Promille. Mittelwert; die Spanne reicht etwa von 0,1 bis 0,2. */
export const ABBAU_PRO_STUNDE = 0.15;

/**
 * Reiner Alkohol eines Getränks in Gramm.
 *
 * @param {{mengeML: number, volProzent: number}} getraenk
 * @returns {number} Gramm Ethanol
 */
export function alkoholGramm({ mengeML, volProzent }) {
  return (mengeML * volProzent) / 100 * DICHTE_ETHANOL;
}

export function berechnePromille({ getraenke, gewichtKg, geschlecht, stundenNachBeginn }) {
  const r = VERTEILUNGSFAKTOR[geschlecht === 'w' ? 'w' : 'm'];
  const gramm = getraenke.reduce((summe, g) => summe + alkoholGramm(g), 0);
  const rohWert = gramm / (gewichtKg * r);
  const abbau = Math.max(0, stundenNachBeginn * ABBAU_PRO_STUNDE);
  const bak = Math.max(0, Math.round((rohWert - abbau) * 100) / 100);
  return {
    bak,
    alkoholGramm: Math.round(gramm * 10) / 10,
    abbau: Math.round(abbau * 100) / 100,
    rohWert: Math.round(rohWert * 100) / 100,
  };
}

/**
 * Stunden, bis eine Blutalkoholkonzentration auf einen Zielwert gesunken ist.
 *
 * @param {number} bak Ausgangswert in Promille
 * @param {number} [ziel] Zielwert in Promille, ohne Angabe 0
 * @returns {number} Stunden, nicht gerundet
 */
export function abbaudauerStunden(bak, ziel = 0) {
  return Math.max(0, (bak - ziel) / ABBAU_PRO_STUNDE);
}

export const GETRAENKE_VORLAGEN = [
  { label: 'Bier (0,5 L)',       mengeML: 500, volProzent: 5   },
  { label: 'Wein (0,2 L)',       mengeML: 200, volProzent: 12  },
  { label: 'Sekt (0,1 L)',       mengeML: 100, volProzent: 11  },
  { label: 'Schnaps (4 cl)',     mengeML:  40, volProzent: 40  },
  { label: 'Cocktail (0,2 L)',   mengeML: 200, volProzent: 8   },
];
