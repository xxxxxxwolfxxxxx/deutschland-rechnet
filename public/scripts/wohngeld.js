// Wohngeld nach dem Wohngeldgesetz (WoGG)
//
// Rechtsstand: 2025-01-01 (Dynamisierung nach § 43 WoGG, BGBl. 2024 I Nr. 314).
// Die Höchstbeträge und Koeffizienten werden alle zwei Jahre angepasst; die
// nächste Anpassung greift zum 01.01.2027.
//
// Primärquellen:
// - § 11 WoGG   https://www.gesetze-im-internet.de/wogg/__11.html
// - § 12 WoGG   https://www.gesetze-im-internet.de/wogg/__12.html
// - §§ 13-17    https://www.gesetze-im-internet.de/wogg/__13.html
// - § 19 WoGG   https://www.gesetze-im-internet.de/wogg/__19.html
// - Anlagen 1 bis 3 zum WoGG, Fundstelle BGBl. 2024 I Nr. 314
//
// Bis zum 11.08.2026 war an diesem Modul fast nichts richtig:
// - Der Faktor 1,15 aus § 19 Abs. 1 Satz 1 fehlte, das Wohngeld war dadurch
//   um 13 Prozent zu niedrig.
// - Die Koeffizienten a, b und c lagen um Größenordnungen daneben: a war
//   0,000006 statt 0,04, b 0,0000699 statt 0,0004797.
// - Die Höchstbeträge (571, 693, 834 …) stammten aus keiner erkennbaren
//   Quelle; Anlage 1 nennt für die Mietenstufe III 456, 551, 657 …
// - Es gab sechs Mietenstufen mit frei erfundenen Korrekturfaktoren
//   (0,82 / 0,91 / 1,00 …). § 12 Abs. 5 kennt sieben Stufen, und Anlage 1
//   nennt für jede einen eigenen Betrag statt eines Faktors auf Stufe III.
// - Heizkostenentlastung und Klimakomponente (§ 12 Abs. 6 und 7) fehlten
//   ganz. Für einen Einpersonenhaushalt sind das zusammen 129,60 Euro.
// - Die Mindestwerte für M und Y (Anlage 3 Nr. 1) und die Rundung auf volle
//   Euro (Anlage 3 Nr. 3) fehlten ebenfalls.
// - Haushalte waren auf fünf Mitglieder begrenzt; die Formel gilt bis zwölf,
//   darüber greift der Mehrbetrag des § 19 Abs. 3.
//
// Nicht abgebildet, weil ein Rechner die Angaben nicht kennen kann: die
// Abzüge nach § 11 Abs. 2 und 3 (gewerblich genutzte Fläche, Untermieter,
// andere öffentliche Leistungen), die Belastung bei Wohneigentum nach § 10
// und die Freibeträge des § 17 Nr. 1, 2 und 4.

import { ARBEITNEHMER_PAUSCHBETRAG } from './lohnsteuer.js';

export const WOHNGELD_STAND = '2025-01-01';

/** § 19 Abs. 1 Satz 1 WoGG – Faktor vor der Klammer. */
export const WOHNGELD_FAKTOR = 1.15;

/** § 19 Abs. 3 WoGG – Zuschlag je Haushaltsmitglied ab dem 13. */
export const MEHRBETRAG_AB_13 = 65;

/** § 12 Abs. 5 WoGG. */
export const MIETENSTUFEN = [1, 2, 3, 4, 5, 6, 7];

/** Größter Haushalt, für den Anlage 2 Koeffizienten nennt. */
export const MAX_HAUSHALTSGROESSE_FORMEL = 12;

/** Anzahl der Haushaltsmitglieder, bis zu der die Tabellen Einzelwerte nennen. */
const TABELLENGRENZE = 5;

/**
 * Höchstbeträge für Miete und Belastung (§ 12 Abs. 1 WoGG, Anlage 1).
 *
 * Je Mietenstufe die Beträge für einen bis fünf Haushaltsmitglieder und der
 * Mehrbetrag für jedes weitere.
 */
export const HOECHSTBETRAEGE = {
  1: { betraege: [361, 437, 521, 608, 694], mehrbetrag: 82 },
  2: { betraege: [408, 493, 587, 686, 782], mehrbetrag: 94 },
  3: { betraege: [456, 551, 657, 766, 875], mehrbetrag: 106 },
  4: { betraege: [511, 619, 737, 858, 982], mehrbetrag: 119 },
  5: { betraege: [562, 680, 809, 946, 1080], mehrbetrag: 129 },
  6: { betraege: [615, 745, 887, 1035, 1183], mehrbetrag: 149 },
  7: { betraege: [677, 820, 975, 1139, 1302], mehrbetrag: 163 },
};

/** Werte für a, b und c (§ 19 Abs. 1 Satz 3 WoGG, Anlage 2). */
export const KOEFFIZIENTEN = {
  1: { a: 0.04, b: 4.797e-4, c: 4.08e-5 },
  2: { a: 0.03, b: 3.571e-4, c: 3.04e-5 },
  3: { a: 0.02, b: 2.917e-4, c: 2.45e-5 },
  4: { a: 0.01, b: 2.163e-4, c: 1.76e-5 },
  5: { a: 0, b: 1.907e-4, c: 1.72e-5 },
  6: { a: -0.01, b: 1.722e-4, c: 1.66e-5 },
  7: { a: -0.02, b: 1.592e-4, c: 1.65e-5 },
  8: { a: -0.03, b: 1.583e-4, c: 1.65e-5 },
  9: { a: -0.04, b: 1.376e-4, c: 1.66e-5 },
  10: { a: -0.06, b: 1.249e-4, c: 1.66e-5 },
  11: { a: -0.09, b: 1.141e-4, c: 1.96e-5 },
  12: { a: -0.12, b: 1.107e-4, c: 2.21e-5 },
};

/**
 * Mindestwerte für M und Y (Anlage 3 Nr. 1 zum WoGG).
 *
 * Liegen die tatsächlichen Werte darunter, sind sie durch diese zu ersetzen.
 * Ohne diese Ersetzung ergäbe ein sehr kleines Einkommen ein zu hohes
 * Wohngeld – die Formel ist dort nicht mehr sinnvoll definiert.
 */
export const MINDESTWERTE = {
  1: { M: 54, Y: 396 },
  2: { M: 67, Y: 679 },
  3: { M: 79, Y: 906 },
  4: { M: 92, Y: 1132 },
  5: { M: 103, Y: 1358 },
  6: { M: 103, Y: 1585 },
  7: { M: 115, Y: 1811 },
  8: { M: 128, Y: 2037 },
  9: { M: 140, Y: 2264 },
  10: { M: 152, Y: 2490 },
  11: { M: 187, Y: 2717 },
  12: { M: 298, Y: 2943 },
};

/** Gesamtbetrag zur Entlastung bei den Heizkosten (§ 12 Abs. 6 WoGG). */
export const HEIZKOSTENENTLASTUNG = {
  betraege: [110.4, 142.6, 170.2, 197.8, 225.4],
  mehrbetrag: 27.6,
};

/** Klimakomponente als Zuschlag zu den Höchstbeträgen (§ 12 Abs. 7 WoGG). */
export const KLIMAKOMPONENTE = {
  betraege: [19.2, 24.8, 29.6, 34.4, 39.2],
  mehrbetrag: 4.8,
};

/** § 16 Satz 1 WoGG – je 10 Prozent für Steuern, Kranken- und Rentenversicherung. */
export const ABZUGSPAUSCHALE = 0.1;

/** § 17 Nr. 3 WoGG – Freibetrag für Alleinerziehende mit minderjährigem Kind, im Jahr. */
export const FREIBETRAG_ALLEINERZIEHEND = 1320;

/**
 * Höchstbetrag für Miete und Belastung (§ 12 Abs. 1 WoGG, Anlage 1).
 *
 * @param {object} eingabe
 * @param {number} eingabe.haushaltsgroesse Zahl der zu berücksichtigenden Haushaltsmitglieder
 * @param {number} eingabe.mietenstufe 1 bis 7
 * @returns {number} Höchstbetrag im Monat, in Euro
 */
export function hoechstbetrag({ haushaltsgroesse, mietenstufe }) {
  pruefeMietenstufe(mietenstufe);
  const n = pruefeHaushaltsgroesse(haushaltsgroesse);
  return ausTabelle(HOECHSTBETRAEGE[mietenstufe], n);
}

/**
 * Gesamtbetrag zur Entlastung bei den Heizkosten (§ 12 Abs. 6 WoGG).
 *
 * @param {number} haushaltsgroesse Zahl der zu berücksichtigenden Haushaltsmitglieder
 * @returns {number} Betrag im Monat, in Euro
 */
export function heizkostenentlastung(haushaltsgroesse) {
  return ausTabelle(HEIZKOSTENENTLASTUNG, pruefeHaushaltsgroesse(haushaltsgroesse));
}

/**
 * Klimakomponente (§ 12 Abs. 7 WoGG).
 *
 * @param {number} haushaltsgroesse Zahl der zu berücksichtigenden Haushaltsmitglieder
 * @returns {number} Betrag im Monat, in Euro
 */
export function klimakomponente(haushaltsgroesse) {
  return ausTabelle(KLIMAKOMPONENTE, pruefeHaushaltsgroesse(haushaltsgroesse));
}

/**
 * Zu berücksichtigende Miete (§ 11 Abs. 1 WoGG).
 *
 * Die Miete wird auf die Summe aus Höchstbetrag und Klimakomponente gedeckelt.
 * Erst danach kommt die Heizkostenentlastung hinzu – sie unterliegt dem Deckel
 * also nicht.
 *
 * @param {object} eingabe
 * @param {number} eingabe.kaltmiete Miete nach § 9 WoGG im Monat, in Euro
 * @param {number} eingabe.haushaltsgroesse Zahl der zu berücksichtigenden Haushaltsmitglieder
 * @param {number} eingabe.mietenstufe 1 bis 7
 * @returns {number} zu berücksichtigende Miete im Monat, in Euro
 */
export function zuBeruecksichtigendeMiete({ kaltmiete, haushaltsgroesse, mietenstufe }) {
  const n = pruefeHaushaltsgroesse(haushaltsgroesse);
  const miete = Number.isFinite(kaltmiete) ? Math.max(0, kaltmiete) : 0;
  const deckel = hoechstbetrag({ haushaltsgroesse: n, mietenstufe }) + klimakomponente(n);
  return Math.min(miete, deckel) + heizkostenentlastung(n);
}

/**
 * Monatliches Gesamteinkommen (§§ 13 bis 17 WoGG).
 *
 * § 14 WoGG stellt auf die Einkünfte im Sinne des § 2 EStG ab, bei
 * Arbeitnehmern also auf den Bruttolohn nach Abzug der Werbungskosten;
 * angesetzt wird der Arbeitnehmer-Pauschbetrag. Davon werden die Pauschalen
 * des § 16 abgezogen: je 10 Prozent, wenn Steuern vom Einkommen, Pflicht-
 * beiträge zur Kranken- und Pflegeversicherung oder zur Rentenversicherung
 * zu leisten sind.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttoMonat Bruttoeinkommen des Haushalts im Monat, in Euro
 * @param {boolean} [eingabe.zahltSteuern]
 * @param {boolean} [eingabe.zahltKrankenversicherung]
 * @param {boolean} [eingabe.zahltRentenversicherung]
 * @param {boolean} [eingabe.alleinerziehendMitKind] Freibetrag nach § 17 Nr. 3 WoGG
 * @returns {number} monatliches Gesamteinkommen in Euro
 */
export function monatlichesGesamteinkommen({
  bruttoMonat,
  zahltSteuern = true,
  zahltKrankenversicherung = true,
  zahltRentenversicherung = true,
  alleinerziehendMitKind = false,
}) {
  const brutto = Number.isFinite(bruttoMonat) ? Math.max(0, bruttoMonat) : 0;
  if (brutto === 0) return 0;

  // § 14 WoGG i. V. m. § 2 Abs. 2 Satz 1 Nr. 2 EStG.
  const jahreseinkommen = Math.max(0, brutto * 12 - ARBEITNEHMER_PAUSCHBETRAG);

  // § 16 Satz 1 WoGG.
  const abzuege = (zahltSteuern ? ABZUGSPAUSCHALE : 0)
    + (zahltKrankenversicherung ? ABZUGSPAUSCHALE : 0)
    + (zahltRentenversicherung ? ABZUGSPAUSCHALE : 0);
  const nachAbzuegen = jahreseinkommen * (1 - abzuege);

  // § 13 Abs. 1 i. V. m. § 17 WoGG.
  const freibetraege = alleinerziehendMitKind ? FREIBETRAG_ALLEINERZIEHEND : 0;
  const gesamteinkommen = Math.max(0, nachAbzuegen - freibetraege);

  // § 13 Abs. 2 WoGG.
  return gesamteinkommen / 12;
}

/**
 * Wohngeld für einen Monat (§ 19 WoGG, Rechenschritte nach Anlage 3).
 *
 * @param {object} eingabe
 * @param {number} eingabe.haushaltsgroesse Zahl der zu berücksichtigenden Haushaltsmitglieder
 * @param {number} eingabe.mietenstufe 1 bis 7 nach § 12 Abs. 5 WoGG
 * @param {number} eingabe.kaltmiete Miete nach § 9 WoGG im Monat, in Euro
 * @param {number} eingabe.bruttoMonat Bruttoeinkommen des Haushalts im Monat, in Euro
 * @param {boolean} [eingabe.zahltSteuern] siehe monatlichesGesamteinkommen
 * @param {boolean} [eingabe.zahltKrankenversicherung]
 * @param {boolean} [eingabe.zahltRentenversicherung]
 * @param {boolean} [eingabe.alleinerziehendMitKind]
 */
export function berechneWohngeld({
  haushaltsgroesse,
  mietenstufe,
  kaltmiete,
  bruttoMonat,
  zahltSteuern,
  zahltKrankenversicherung,
  zahltRentenversicherung,
  alleinerziehendMitKind,
}) {
  const n = pruefeHaushaltsgroesse(haushaltsgroesse);
  pruefeMietenstufe(mietenstufe);

  const miete = zuBeruecksichtigendeMiete({ kaltmiete, haushaltsgroesse: n, mietenstufe });
  const gesamteinkommen = monatlichesGesamteinkommen({
    bruttoMonat,
    zahltSteuern,
    zahltKrankenversicherung,
    zahltRentenversicherung,
    alleinerziehendMitKind,
  });

  // Die Formel ist bis zwölf Haushaltsmitglieder definiert; größere Haushalte
  // rechnen mit den Werten für zwölf und bekommen den Zuschlag des Absatzes 3.
  const nFormel = Math.min(n, MAX_HAUSHALTSGROESSE_FORMEL);

  // Anlage 3 Nr. 1: zu kleine Werte werden durch die Mindestwerte ersetzt.
  const angesetzteMiete = Math.max(miete, MINDESTWERTE[nFormel].M);
  const angesetztesEinkommen = Math.max(gesamteinkommen, MINDESTWERTE[nFormel].Y);

  // Anlage 3 Nr. 2: die vier Rechenschritte in dieser Reihenfolge.
  const { a, b, c } = KOEFFIZIENTEN[nFormel];
  const z1 = a + b * angesetzteMiete + c * angesetztesEinkommen;
  const z2 = z1 * angesetztesEinkommen;
  const z3 = angesetzteMiete - z2;
  const z4 = WOHNGELD_FAKTOR * z3;

  // Anlage 3 Nr. 3: kaufmännische Rundung auf volle Euro.
  const ausFormel = Math.max(0, Math.round(z4));

  // § 19 Abs. 3 WoGG: je 65 Euro ab dem 13. Haushaltsmitglied, höchstens bis
  // zur Höhe der zu berücksichtigenden Miete. Die Vorschrift erhöht "das nach
  // den Absätzen 1 und 2 berechnete monatliche Wohngeld" – ergibt die Formel
  // nichts, ist auch nichts zu erhöhen. Sonst bekäme ein Haushalt ohne
  // Anspruch dem Grunde nach allein wegen seiner Größe Wohngeld.
  const zuschlag = Math.max(0, n - MAX_HAUSHALTSGROESSE_FORMEL) * MEHRBETRAG_AB_13;
  const wohngeld = zuschlag > 0 && ausFormel > 0
    ? Math.min(ausFormel + zuschlag, Math.round(angesetzteMiete))
    : ausFormel;

  return {
    wohngeld,
    wohngeldJahr: wohngeld * 12,
    miete: runde(miete),
    angesetzteMiete: runde(angesetzteMiete),
    gesamteinkommen: runde(gesamteinkommen),
    angesetztesEinkommen: runde(angesetztesEinkommen),
    hoechstbetrag: hoechstbetrag({ haushaltsgroesse: n, mietenstufe }),
    klimakomponente: runde(klimakomponente(n)),
    heizkostenentlastung: runde(heizkostenentlastung(n)),
    haushaltsgroesse: n,
    mietenstufe,
    hatAnspruch: wohngeld > 0,
  };
}

/**
 * Wert aus einer Tabelle mit Einzelwerten bis fünf Haushaltsmitglieder und
 * einem Mehrbetrag für jedes weitere.
 */
function ausTabelle({ betraege, mehrbetrag }, haushaltsgroesse) {
  if (haushaltsgroesse <= TABELLENGRENZE) {
    return betraege[haushaltsgroesse - 1];
  }
  return betraege[TABELLENGRENZE - 1] + (haushaltsgroesse - TABELLENGRENZE) * mehrbetrag;
}

function pruefeMietenstufe(mietenstufe) {
  if (!MIETENSTUFEN.includes(mietenstufe)) {
    throw new Error(`Unbekannte Mietenstufe: ${mietenstufe}. § 12 Abs. 5 WoGG kennt die Stufen I bis VII.`);
  }
  return mietenstufe;
}

function pruefeHaushaltsgroesse(haushaltsgroesse) {
  if (!Number.isInteger(haushaltsgroesse) || haushaltsgroesse < 1) {
    throw new Error(`Ungültige Haushaltsgröße: ${haushaltsgroesse}`);
  }
  return haushaltsgroesse;
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}
