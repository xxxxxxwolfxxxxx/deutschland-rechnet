// Zahnersatz: Eigenanteil nach dem Festzuschuss und Wirkung einer Zusatzversicherung
//
// Quelle: § 55 Abs. 1 SGB V, https://www.gesetze-im-internet.de/sgb_5/__55.html
// (abgerufen am 14.09.2026)
//
// Die gesetzliche Krankenkasse zahlt beim Zahnersatz keinen Prozentsatz der
// Rechnung, sondern befundbezogene Festzuschüsse: 60 Prozent der für die
// Regelversorgung festgesetzten Beträge, 70 Prozent mit fünf Jahren lückenlosem
// Bonusheft, 75 Prozent mit zehn Jahren. Beide Beträge – Gesamtkosten und
// Festzuschuss – stehen im Heil- und Kostenplan.
//
// Früher schätzte die Seite Beiträge nach Alter und eine "durchschnittliche
// Zahnkostensumme von 1.200 €" ohne Quelle. Das Modul rechnet jetzt nur mit
// Zahlen aus dem eigenen Heil- und Kostenplan und dem eigenen Tarif.

/** § 55 Abs. 1 Sätze 2, 3 und 5 SGB V: Anteil an der Regelversorgung */
export const FESTZUSCHUSS_ANTEIL = Object.freeze({ ohneBonus: 0.6, bonus5Jahre: 0.7, bonus10Jahre: 0.75 });

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);
const runde = (n) => Math.round(n * 100) / 100;

/**
 * Rechnet einen Festzuschuss auf eine andere Bonusstufe um.
 * Alle Stufen sind Anteile desselben Regelversorgungsbetrags.
 *
 * @param {number} betrag Festzuschuss laut Heil- und Kostenplan
 * @param {'ohneBonus'|'bonus5Jahre'|'bonus10Jahre'} von Stufe, mit der der Betrag berechnet ist
 * @param {'ohneBonus'|'bonus5Jahre'|'bonus10Jahre'} nach Zielstufe
 */
export function festzuschussUmrechnen(betrag, von, nach) {
  const a = FESTZUSCHUSS_ANTEIL[von];
  const b = FESTZUSCHUSS_ANTEIL[nach];
  if (!a || !b) return runde(zahl(betrag));
  return runde((zahl(betrag) / a) * b);
}

/**
 * Eigenanteil und Erstattung einer Zahnzusatzversicherung.
 *
 * @param {object} p
 * @param {number} p.gesamtkosten Gesamtkosten laut Heil- und Kostenplan
 * @param {number} p.festzuschuss Festzuschuss der Krankenkasse laut Heil- und Kostenplan
 * @param {number} [p.erstattungProzent] Leistung des Tarifs in Prozent
 * @param {'gesamt'|'eigenanteil'} [p.bezug] ob sich der Prozentsatz auf die Gesamtkosten
 *   einschließlich Festzuschuss bezieht ("bis zu 90 % inklusive Kassenleistung")
 *   oder auf den Eigenanteil
 * @param {number} [p.hoechstbetrag] Leistungsgrenze des Tarifs im Behandlungsjahr (0 = keine)
 * @param {number} [p.beitragMonat] Monatsbeitrag des Tarifs
 * @param {number} [p.monateBeitrag] Monate, die bis zur Behandlung gezahlt werden
 */
export function berechneZahnersatz({
  gesamtkosten,
  festzuschuss,
  erstattungProzent = 0,
  bezug = 'gesamt',
  hoechstbetrag = 0,
  beitragMonat = 0,
  monateBeitrag = 0,
}) {
  const kosten = zahl(gesamtkosten);
  const zuschuss = Math.min(kosten, zahl(festzuschuss));
  const eigenanteil = kosten - zuschuss;
  const quote = Math.min(100, zahl(erstattungProzent)) / 100;

  const tarifleistung = bezug === 'eigenanteil'
    ? eigenanteil * quote
    : Math.max(0, kosten * quote - zuschuss);
  const gedeckelt = zahl(hoechstbetrag) > 0 ? Math.min(tarifleistung, zahl(hoechstbetrag)) : tarifleistung;
  const erstattung = Math.min(eigenanteil, gedeckelt);

  const beitraege = zahl(beitragMonat) * Math.floor(zahl(monateBeitrag));
  const eigenanteilMitTarif = eigenanteil - erstattung;

  return {
    gesamtkosten: runde(kosten),
    festzuschuss: runde(zuschuss),
    eigenanteil: runde(eigenanteil),
    erstattung: runde(erstattung),
    begrenzt: zahl(hoechstbetrag) > 0 && tarifleistung > zahl(hoechstbetrag),
    eigenanteilMitTarif: runde(eigenanteilMitTarif),
    beitraege: runde(beitraege),
    /** Positiv: Die Erstattung übersteigt die bis dahin gezahlten Beiträge. */
    saldo: runde(erstattung - beitraege),
  };
}
