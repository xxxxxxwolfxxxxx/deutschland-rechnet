// Kostenrisiko eines Zivilprozesses in erster Instanz
//
// Quellen (abgerufen am 14.09.2026):
// - GKG Kostenverzeichnis Nr. 1210 (3,0) und 1211 (1,0 bei Vergleich u. a.),
//   Gebühr nach § 34 GKG: https://www.gesetze-im-internet.de/gkg_2004/
// - RVG VV Nr. 3100 (1,3), 3104 (1,2), 1003 (1,0), 7002, 7008:
//   https://www.gesetze-im-internet.de/rvg/
// - § 91 Abs. 1 Satz 1 ZPO: Die unterliegende Partei trägt die Kosten des
//   Rechtsstreits einschließlich der notwendigen Kosten des Gegners.
// - § 98 ZPO: Die Kosten eines Vergleichs gelten als gegeneinander aufgehoben,
//   wenn nichts anderes vereinbart ist; § 92 Abs. 1 Satz 2 ZPO: Dann trägt jede
//   Partei die Gerichtskosten zur Hälfte (und ihren eigenen Anwalt).
//
// Früher schätzte die Rechtsschutz-Seite einen Monatsbeitrag aus Alter, Beruf
// und Familienstand mit frei gesetzten Zuschlägen. Beiträge kalkuliert jeder
// Versicherer selbst. Rechenbar ist das Risiko, gegen das die Versicherung
// schützt – und damit, wie viele Jahresbeiträge ein Prozess kostet.
//
// Nicht enthalten: Zeugen- und Sachverständigenkosten, weitere Instanzen,
// Arbeitsgerichtsverfahren (dort gilt § 12a ArbGG und ein eigenes Kostenverzeichnis).

import { gebuehrGKG, anwaltsverguetungAusSaetzen } from './gebuehrentabellen.js';

/** GKG KV Nr. 1210 und 1211 */
export const GERICHT_SATZ_URTEIL = 3.0;
export const GERICHT_SATZ_VERGLEICH = 1.0;

/** RVG VV Nr. 3100, 3104, 1003 */
export const VERFAHRENSGEBUEHR_SATZ = 1.3;
export const TERMINSGEBUEHR_SATZ = 1.2;
export const EINIGUNGSGEBUEHR_SATZ = 1.0;

const runde = (n) => Math.round(n * 100) / 100;
const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);

function szenario(gericht, eigenerAnwalt, gegnerAnwalt) {
  return { gericht: runde(gericht), eigenerAnwalt: runde(eigenerAnwalt), gegnerAnwalt: runde(gegnerAnwalt), gesamt: runde(gericht + eigenerAnwalt + gegnerAnwalt) };
}

/**
 * Kosten für eine Partei nach Ausgang des Verfahrens.
 * Unterstellt: Beide Parteien haben einen Anwalt, es gibt einen Verhandlungstermin.
 *
 * @param {number} streitwert
 */
export function berechneProzesskosten(streitwert) {
  const w = zahl(streitwert);
  const volleGerichtsgebuehr = gebuehrGKG(w);
  const anwaltUrteil = anwaltsverguetungAusSaetzen(w, [VERFAHRENSGEBUEHR_SATZ, TERMINSGEBUEHR_SATZ]).brutto;
  const anwaltVergleich = anwaltsverguetungAusSaetzen(w, [VERFAHRENSGEBUEHR_SATZ, TERMINSGEBUEHR_SATZ, EINIGUNGSGEBUEHR_SATZ]).brutto;

  return {
    streitwert: w,
    verloren: szenario(volleGerichtsgebuehr * GERICHT_SATZ_URTEIL, anwaltUrteil, anwaltUrteil),
    vergleich: szenario((volleGerichtsgebuehr * GERICHT_SATZ_VERGLEICH) / 2, anwaltVergleich, 0),
    gewonnen: szenario(0, 0, 0),
  };
}

/**
 * Stellt ein Kostenrisiko den Beiträgen einer Rechtsschutzversicherung gegenüber.
 *
 * @param {object} p
 * @param {number} p.kosten Kosten des Prozesses ohne Versicherung
 * @param {number} p.beitragJahr Jahresbeitrag laut Angebot oder Police
 * @param {number} [p.selbstbeteiligung] je Rechtsschutzfall
 * @param {number} [p.jahre] Vertragsjahre bis zum Rechtsstreit
 */
export function vergleicheMitBeitrag({ kosten, beitragJahr, selbstbeteiligung = 0, jahre = 1 }) {
  const k = zahl(kosten);
  const beitrag = zahl(beitragJahr);
  const erstattung = Math.max(0, k - zahl(selbstbeteiligung));
  const beitraege = beitrag * zahl(jahre);
  return {
    erstattung: runde(erstattung),
    beitraege: runde(beitraege),
    saldo: runde(erstattung - beitraege),
    jahresbeitraegeJeFall: beitrag > 0 ? Math.round((erstattung / beitrag) * 10) / 10 : null,
  };
}
