// Die 16 Bundesländer mit ihren amtlichen Kürzeln.
//
// Einzige Liste im Projekt. Rechner, die je Bundesland unterschiedliche Werte
// führen – Kirchensteuer, Grunderwerbsteuer, Pflegeversicherung –, hängen ihre
// Daten an diese Kürzel an, statt Namen und Liste erneut zu schreiben.

export const BUNDESLAENDER = {
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen',
};

/**
 * Prüft ein Bundesland-Kürzel und gibt es unverändert zurück.
 *
 * Unbekannte Kürzel führen zu einem Fehler statt zu einem stillen Rückfall auf
 * einen Standardwert. Genau so ein Rückfall hat im Brutto-Netto-Rechner einen
 * falschen Kirchensteuersatz monatelang verdeckt: Die Seite lieferte 'nw', die
 * Tabelle erwartete 'nrw', und der Fallback lieferte zufällig das Richtige.
 *
 * @param {string} kuerzel z. B. 'NW'
 * @returns {string} dasselbe Kürzel
 */
export function pruefeBundesland(kuerzel) {
  if (!Object.prototype.hasOwnProperty.call(BUNDESLAENDER, kuerzel)) {
    throw new Error(`Unbekanntes Bundesland: ${kuerzel}`);
  }
  return kuerzel;
}

/**
 * Name eines Bundeslandes zum Kürzel.
 *
 * @param {string} kuerzel z. B. 'NW'
 * @returns {string} z. B. 'Nordrhein-Westfalen'
 */
export function bundeslandName(kuerzel) {
  return BUNDESLAENDER[pruefeBundesland(kuerzel)];
}

/**
 * Alle Bundesländer alphabetisch nach Namen, für Auswahllisten.
 *
 * @returns {Array<{kuerzel: string, name: string}>}
 */
export function bundeslaenderAlphabetisch() {
  return Object.entries(BUNDESLAENDER)
    .map(([kuerzel, name]) => ({ kuerzel, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
