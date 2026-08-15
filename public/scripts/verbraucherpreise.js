// Verbraucherpreisindex nach Abteilungen
//
// Quelle: Statistisches Bundesamt, "Verbraucherpreisindex: Gesamtindex und
// 12 Abteilungen", abgerufen am 15.08.2026 unter
// https://www.destatis.de/DE/Themen/Wirtschaft/Preise/Verbraucherpreisindex/Tabellen/Verbraucherpreise-12Kategorien.html
//
// Basis ist der Jahresdurchschnitt 2020 = 100. Ein Indexstand von 125,6
// bedeutet also: Der Warenkorb kostet 25,6 Prozent mehr als im Mittel des
// Jahres 2020.
//
// Die zwölf Abteilungen folgen der europäischen Klassifikation COICOP. Der
// Gesamtindex ist ihr nach Ausgabenanteilen gewichteter Durchschnitt – deshalb
// liegt er zwischen den Extremen und beschreibt keinen realen Haushalt.
//
// Anders als inflation.js, das eine frei gewählte Rate fortschreibt, enthält
// dieses Modul gemessene Werte.

export const VPI_BASISJAHR = 2020;
export const VPI_STAND = '2026-07';
export const VPI_VORJAHR = '2025-07';

/**
 * Indexstände der zwölf Abteilungen und des Gesamtindex.
 *
 * `kurz` ist ein für den Fließtext taugliches Kürzel; die amtlichen Namen
 * sind dafür zu lang.
 *
 * `aktuell` ist der Stand aus VPI_STAND, `vorjahr` derselbe Monat ein Jahr
 * zuvor – nur so ist die Veränderungsrate frei von Saisoneffekten.
 */
export const VPI_ABTEILUNGEN = [
  { nr: 0, name: 'Gesamtindex', kurz: 'Gesamtindex', aktuell: 125.6, vorjahr: 122.2 },
  { nr: 1, name: 'Nahrungsmittel und alkoholfreie Getränke', kurz: 'Nahrungsmittel', aktuell: 136.8, vorjahr: 136.2 },
  { nr: 2, name: 'Alkoholische Getränke und Tabakwaren', kurz: 'Alkohol und Tabak', aktuell: 132.3, vorjahr: 126.9 },
  { nr: 3, name: 'Bekleidung und Schuhe', kurz: 'Bekleidung', aktuell: 105.7, vorjahr: 106.8 },
  { nr: 4, name: 'Wohnung, Wasser, Strom, Gas und andere Brennstoffe', kurz: 'Wohnen und Energie', aktuell: 119.3, vorjahr: 117.6 },
  { nr: 5, name: 'Möbel, Leuchten, Geräte und anderes Haushaltszubehör', kurz: 'Einrichtung', aktuell: 118.1, vorjahr: 118.3 },
  { nr: 6, name: 'Gesundheit', kurz: 'Gesundheit', aktuell: 116.5, vorjahr: 111.0 },
  { nr: 7, name: 'Verkehr', kurz: 'Verkehr', aktuell: 137.7, vorjahr: 127.6 },
  { nr: 8, name: 'Post und Telekommunikation', kurz: 'Post und Telekommunikation', aktuell: 99.2, vorjahr: 98.4 },
  { nr: 9, name: 'Freizeit, Unterhaltung und Kultur', kurz: 'Freizeit und Kultur', aktuell: 122.2, vorjahr: 119.7 },
  { nr: 10, name: 'Bildungswesen', kurz: 'Bildung', aktuell: 124.6, vorjahr: 119.3 },
  { nr: 11, name: 'Gaststätten- und Beherbergungsdienstleistungen', kurz: 'Gaststätten und Hotels', aktuell: 136.4, vorjahr: 132.6 },
  { nr: 12, name: 'Andere Waren und Dienstleistungen', kurz: 'Andere Waren und Dienstleistungen', aktuell: 132.7, vorjahr: 127.5 },
];

/** Der Gesamtindex, also der gewichtete Durchschnitt aller Abteilungen. */
export const GESAMTINDEX = VPI_ABTEILUNGEN[0];

/** Nur die zwölf Abteilungen ohne den Gesamtindex. */
export const ABTEILUNGEN = VPI_ABTEILUNGEN.filter((a) => a.nr > 0);

/**
 * Preisanstieg gegenüber dem Basisjahr, als Dezimalzahl.
 *
 * @param {{aktuell: number}} abteilung
 * @returns {number} 0,256 bedeutet 25,6 Prozent teurer als 2020
 */
export function anstiegSeitBasis(abteilung) {
  return abteilung.aktuell / 100 - 1;
}

/**
 * Veränderung gegenüber demselben Monat des Vorjahres, als Dezimalzahl.
 *
 * @param {{aktuell: number, vorjahr: number}} abteilung
 */
export function jahresrate(abteilung) {
  return abteilung.aktuell / abteilung.vorjahr - 1;
}

/**
 * Was ein Betrag aus dem Basisjahr heute noch wert ist.
 *
 * Nicht der Betrag minus Inflation, sondern der durch den Index geteilte Betrag
 * – der verbreitete Fehler ist, 100 € minus 25,6 Prozent zu rechnen und bei
 * 74,40 € statt bei 79,62 € zu landen.
 *
 * @param {number} betrag Betrag in Euro zu Preisen des Basisjahres
 * @param {{aktuell: number}} abteilung
 * @returns {number} heutige Kaufkraft in Euro
 */
export function kaufkraft(betrag, abteilung) {
  return (betrag / abteilung.aktuell) * 100;
}

/**
 * Was ein Warenkorb des Basisjahres heute kostet.
 *
 * @param {number} betrag Betrag in Euro zu Preisen des Basisjahres
 * @param {{aktuell: number}} abteilung
 */
export function heutigerPreis(betrag, abteilung) {
  return (betrag * abteilung.aktuell) / 100;
}
