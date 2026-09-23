// Trainingspuls: Maximalpuls-Schätzung und Herzfrequenzzonen.
//
// Warum es dieses Modul gibt: Die Rechnerseite hatte ihre Logik inline und
// fragte den Ruhepuls ab, ohne ihn zu verwenden – sie berechnete zwar
// `hrr = maxpuls - ruhepuls`, benutzte die Variable dann aber nirgends. Alle
// fünf Zonen waren reine Prozentsätze des Maximalpuls. Das Eingabefeld war
// damit wirkungslos, während die FAQ darunter erklärte, warum der Ruhepuls
// wichtig sei.
//
// Hier stehen deshalb BEIDE Rechenwege nebeneinander:
//
//   Prozent des Maximalpuls:  Zielpuls = HFmax × Intensität
//   Karvonen (Herzfrequenzreserve):
//                             Zielpuls = Ruhepuls + (HFmax − Ruhepuls) × Intensität
//
// Sie liefern bei derselben Prozentangabe verschiedene Zahlen; nur bei einem
// Ruhepuls von 0 fallen sie zusammen. Welcher Weg gemeint ist, muss deshalb
// zu jeder Zonenangabe dazugesagt werden.
//
// Für den Maximalpuls gibt es zwei verbreitete Schätzungen:
//   Fox u. a. 1971:    HFmax = 220 − Alter
//   Tanaka u. a. 2001: HFmax = 208 − 0,7 × Alter
//     (J Am Coll Cardiol 37(1), S. 153–156)
// Beide sind Populationsmittel mit erheblicher Streuung um den Einzelwert.

/** Grenzen der fünf üblichen Zonen als Anteil der jeweiligen Bezugsgröße. */
export const ZONEN = [
  { name: 'Regeneration', von: 0.5, bis: 0.6 },
  { name: 'Grundlage', von: 0.6, bis: 0.7 },
  { name: 'Aerob', von: 0.7, bis: 0.8 },
  { name: 'Schwelle', von: 0.8, bis: 0.9 },
  { name: 'Maximal', von: 0.9, bis: 1.0 },
];

/** Fox u. a. 1971: der Klassiker, den die meisten Rechner verwenden. */
export function maximalpulsFox(alter) {
  return 220 - alter;
}

/** Tanaka u. a. 2001, aus einer Metaanalyse von 351 Studien. */
export function maximalpulsTanaka(alter) {
  return 208 - 0.7 * alter;
}

/**
 * Die Formeln schneiden sich genau dort, wo 220 − a = 208 − 0,7a gilt.
 * Unterhalb schätzt Tanaka niedriger, oberhalb höher als Fox.
 */
export const SCHNITTPUNKT_ALTER = 40;

/** Zielpuls als reiner Anteil des Maximalpuls – der Ruhepuls spielt keine Rolle. */
export function zoneNachMaximalpuls(maximalpuls, intensitaet) {
  return maximalpuls * intensitaet;
}

/**
 * Zielpuls nach Karvonen: Der Anteil bezieht sich auf die Herzfrequenzreserve
 * (HFmax − Ruhepuls) und wird auf den Ruhepuls aufgeschlagen.
 */
export function zoneNachKarvonen(maximalpuls, ruhepuls, intensitaet) {
  return ruhepuls + (maximalpuls - ruhepuls) * intensitaet;
}

const rund = (n) => Math.round(n);

/**
 * Beide Rechenwege für alle fünf Zonen.
 *
 * @param {object} e
 * @param {number} e.alter     Alter in Jahren
 * @param {number} e.ruhepuls  Ruhepuls in Schlägen je Minute
 * @param {'fox'|'tanaka'} [e.formel='fox']  Grundlage für den Maximalpuls
 */
export function trainingszonen({ alter, ruhepuls, formel = 'fox' }) {
  if (!Number.isFinite(alter) || alter < 10 || alter > 100) {
    throw new Error('Alter muss zwischen 10 und 100 Jahren liegen.');
  }
  if (!Number.isFinite(ruhepuls) || ruhepuls < 30 || ruhepuls > 120) {
    throw new Error('Ruhepuls muss zwischen 30 und 120 Schlägen je Minute liegen.');
  }

  const maxFox = maximalpulsFox(alter);
  const maxTanaka = maximalpulsTanaka(alter);
  const maximalpuls = formel === 'tanaka' ? maxTanaka : maxFox;

  if (ruhepuls >= maximalpuls) {
    throw new Error('Der Ruhepuls liegt nicht unter dem geschätzten Maximalpuls.');
  }

  const zonen = ZONEN.map((z) => {
    const prozentVon = rund(zoneNachMaximalpuls(maximalpuls, z.von));
    const prozentBis = rund(zoneNachMaximalpuls(maximalpuls, z.bis));
    const karvonenVon = rund(zoneNachKarvonen(maximalpuls, ruhepuls, z.von));
    const karvonenBis = rund(zoneNachKarvonen(maximalpuls, ruhepuls, z.bis));
    return {
      ...z,
      prozentVon,
      prozentBis,
      karvonenVon,
      karvonenBis,
      // Wie weit die beiden Rechenwege bei derselben Prozentangabe auseinander
      // liegen – aus den angezeigten, gerundeten Werten gebildet.
      abstandVon: karvonenVon - prozentVon,
      abstandBis: karvonenBis - prozentBis,
    };
  });

  return {
    alter,
    ruhepuls,
    formel,
    maximalpuls,
    maxFox,
    maxTanaka,
    /** HFmax − Ruhepuls, die Spanne, auf die sich Karvonen bezieht. */
    herzfrequenzreserve: maximalpuls - ruhepuls,
    zonen,
  };
}
