// Gerichts- und Anwaltskosten einer Scheidung im Verbund
//
// Quellen (abgerufen am 14.09.2026):
// - FamGKG §§ 28, 43, 44, 50 und Kostenverzeichnis Nr. 1110:
//   https://www.gesetze-im-internet.de/famgkg/
// - RVG § 13 Abs. 1 und Vergütungsverzeichnis Nr. 3100, 3104, 7002, 7008:
//   https://www.gesetze-im-internet.de/rvg/
//
// Die Gebühren hängen nicht vom Vermögen ab, sondern vom Verfahrenswert. Dessen
// rechenbarer Kern ist das in drei Monaten erzielte Nettoeinkommen beider
// Ehegatten (§ 43 Abs. 2 FamGKG). Alles Weitere – Abschläge für Kinder,
// Zuschläge für Vermögen – liegt im Ermessen des Gerichts nach § 43 Abs. 1 und
// wird hier nicht unterstellt.

import {
  gebuehrFamGKG,
  gebuehrRVG,
  anwaltsverguetungAusSaetzen,
  AUSLAGENPAUSCHALE_ANTEIL,
  AUSLAGENPAUSCHALE_HOECHSTBETRAG,
  UMSATZSTEUERSATZ,
} from './gebuehrentabellen.js';

export const RECHTSSTAND = '2025-06-01';

/** § 43 Abs. 1 Satz 2 FamGKG */
export const EHESACHE_MINDESTWERT = 3000;
export const EHESACHE_HOECHSTWERT = 1000000;

/** § 43 Abs. 2 FamGKG: Nettoeinkommen aus drei Monaten */
export const MONATE_NETTOEINKOMMEN = 3;

/** § 50 Abs. 1 FamGKG: je Anrecht 10 Prozent, insgesamt mindestens 1.000 Euro */
export const VERSORGUNGSAUSGLEICH_JE_ANRECHT = 0.1;
export const VERSORGUNGSAUSGLEICH_MINDESTWERT = 1000;

/** § 44 Abs. 2 FamGKG: je Kindschaftssache 20 Prozent, höchstens 5.000 Euro */
export const KINDSCHAFTSSACHE_ANTEIL = 0.2;
export const KINDSCHAFTSSACHE_HOECHSTBETRAG = 5000;

/** KV Nr. 1110 FamGKG: Verfahren im Allgemeinen */
export const GERICHT_GEBUEHRENSATZ = 2.0;

/** VV Nr. 3100 (Verfahrensgebühr) und Nr. 3104 (Terminsgebühr) RVG */
export const VERFAHRENSGEBUEHR_SATZ = 1.3;
export const TERMINSGEBUEHR_SATZ = 1.2;

/** VV Nr. 7002 und 7008 RVG: siehe gebuehrentabellen.js */
export { AUSLAGENPAUSCHALE_ANTEIL, AUSLAGENPAUSCHALE_HOECHSTBETRAG, UMSATZSTEUERSATZ, gebuehrFamGKG, gebuehrRVG };

const rundeAufCent = (betrag) => Math.round(betrag * 100) / 100;
const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);

/**
 * Verfahrenswert des Scheidungsverbunds (§ 44 Abs. 1 FamGKG: ein Verfahren).
 *
 * @param {object} p
 * @param {number} p.nettoMonat Nettoeinkommen beider Ehegatten zusammen, je Monat
 * @param {number} [p.anrechte] Zahl der Anrechte im Versorgungsausgleich (beide Ehegatten)
 * @param {number} [p.kindschaftssachen] Sorge- oder Umgangsverfahren im Verbund
 */
export function verfahrenswert({ nettoMonat, anrechte = 0, kindschaftssachen = 0 }) {
  const dreiMonate = zahl(nettoMonat) * MONATE_NETTOEINKOMMEN;
  const ehesache = Math.min(EHESACHE_HOECHSTWERT, Math.max(EHESACHE_MINDESTWERT, dreiMonate));

  const n = Math.floor(zahl(anrechte));
  const versorgungsausgleich = n > 0
    ? Math.max(VERSORGUNGSAUSGLEICH_MINDESTWERT, n * VERSORGUNGSAUSGLEICH_JE_ANRECHT * dreiMonate)
    : 0;

  const k = Math.floor(zahl(kindschaftssachen));
  const kindschaft = k * Math.min(KINDSCHAFTSSACHE_ANTEIL * ehesache, KINDSCHAFTSSACHE_HOECHSTBETRAG);

  return {
    ehesache: rundeAufCent(ehesache),
    versorgungsausgleich: rundeAufCent(versorgungsausgleich),
    kindschaft: rundeAufCent(kindschaft),
    gesamt: rundeAufCent(ehesache + versorgungsausgleich + kindschaft),
  };
}

/** Vergütung eines Anwalts im ersten Rechtszug mit Termin, einschließlich Umsatzsteuer. */
export function anwaltsverguetung(wert) {
  const v = anwaltsverguetungAusSaetzen(wert, [VERFAHRENSGEBUEHR_SATZ, TERMINSGEBUEHR_SATZ]);
  const voll = gebuehrRVG(wert);
  return {
    verfahrensgebuehr: rundeAufCent(voll * VERFAHRENSGEBUEHR_SATZ),
    terminsgebuehr: rundeAufCent(voll * TERMINSGEBUEHR_SATZ),
    pauschale: v.pauschale,
    netto: v.netto,
    umsatzsteuer: v.umsatzsteuer,
    brutto: v.brutto,
  };
}

/**
 * Gesamtkosten der Scheidung im Verbund.
 *
 * @param {object} p
 * @param {number} p.nettoMonat Nettoeinkommen beider Ehegatten zusammen, je Monat
 * @param {number} [p.anrechte]
 * @param {number} [p.kindschaftssachen]
 * @param {1|2} [p.anwaelte] ein Anwalt (nur der Antragsteller) oder zwei
 */
export function berechneScheidungskosten({ nettoMonat, anrechte = 0, kindschaftssachen = 0, anwaelte = 1 }) {
  const wert = verfahrenswert({ nettoMonat, anrechte, kindschaftssachen });
  const gericht = rundeAufCent(gebuehrFamGKG(wert.gesamt) * GERICHT_GEBUEHRENSATZ);
  const anwalt = anwaltsverguetung(wert.gesamt);
  const zahlAnwaelte = anwaelte === 2 ? 2 : 1;
  const anwaltGesamt = rundeAufCent(anwalt.brutto * zahlAnwaelte);

  return {
    verfahrenswert: wert,
    gericht,
    anwalt,
    anwaelte: zahlAnwaelte,
    anwaltGesamt,
    gesamt: rundeAufCent(gericht + anwaltGesamt),
  };
}
