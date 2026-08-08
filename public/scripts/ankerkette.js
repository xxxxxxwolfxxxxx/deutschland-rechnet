// Benötigte Ankerkettenlänge (Kettenvorlauf)
//
// Ein Anker hält nicht durch sein Gewicht, sondern durch den flachen Zugwinkel.
// Je mehr Kette am Grund liegt, desto flacher zieht sie — deshalb rechnet man
// mit einem Vielfachen der Wassertiefe statt mit einem festen Wert.
//
// Maßgeblich ist nicht die Tiefe unter dem Kiel, sondern der Abstand von der
// Ankerrolle bis zum Grund. Dazu kommt in Tidengewässern der Tidenhub: gerechnet
// wird immer für den höchsten zu erwartenden Wasserstand, nicht für den beim
// Ankern gemessenen.
//
// Kette wirkt durch ihr Eigengewicht (Kettenlinie) und braucht deshalb weniger
// Vorlauf als eine Leine, die im Wasser nahezu gerade steht.

/** Vorlauf-Faktoren nach Material und Wetterlage. */
const FAKTOREN = {
  kette:  { ruhig: 4,  maessig: 5,  sturm: 7  },
  leine:  { ruhig: 6,  maessig: 7,  sturm: 10 },
};

/** Klartext für die Wetterlagen. */
const LAGE_TEXT = {
  ruhig:   'ruhiges Wetter, geschützte Bucht',
  maessig: 'auffrischender Wind bis etwa 5 Bft',
  sturm:   'Starkwind, Sturm oder ablandige Böen',
};

/**
 * Berechnet den nötigen Kettenvorlauf.
 *
 * @param {object} eingabe
 * @param {number} eingabe.wassertiefeM   Wassertiefe unter der Wasseroberfläche
 * @param {number} [eingabe.bughoeheM]    Höhe der Ankerrolle über Wasser
 * @param {number} [eingabe.tidenhubM]    Erwarteter Anstieg bis Hochwasser
 * @param {'kette'|'leine'} [eingabe.material]
 * @param {'ruhig'|'maessig'|'sturm'} [eingabe.lage]
 * @returns {{
 *   rechentiefeM: number,
 *   faktor: number,
 *   benoetigtM: number,
 *   schwojkreisM: number,
 *   lageText: string
 * }}
 */
export function berechneAnkerkette({
  wassertiefeM,
  bughoeheM = 1,
  tidenhubM = 0,
  material = 'kette',
  lage = 'maessig',
}) {
  const tiefe = Math.max(0, Number(wassertiefeM) || 0);
  const bug = Math.max(0, Number(bughoeheM) || 0);
  const tide = Math.max(0, Number(tidenhubM) || 0);

  // Gerechnet wird ab Ankerrolle und für den höchsten Wasserstand.
  const rechentiefeM = Math.round((tiefe + bug + tide) * 10) / 10;

  const materialFaktoren = FAKTOREN[material] ?? FAKTOREN.kette;
  const faktor = materialFaktoren[lage] ?? materialFaktoren.maessig;

  const benoetigtM = Math.round(rechentiefeM * faktor);

  // Das Boot schwojt um den Anker: Radius ist der ausgesteckte Vorlauf plus
  // Bootslänge. Für die Rechnung genügt der Vorlauf als Näherung nach unten.
  const schwojkreisM = benoetigtM;

  return {
    rechentiefeM,
    faktor,
    benoetigtM,
    schwojkreisM,
    lageText: LAGE_TEXT[lage] ?? LAGE_TEXT.maessig,
  };
}
