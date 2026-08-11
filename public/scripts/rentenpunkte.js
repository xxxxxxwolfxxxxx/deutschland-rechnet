// Rentenpunkte (Entgeltpunkte) nach § 70 Abs. 1 SGB VI
//
// Rechtsstand: 2026-07-01
//
// Rechengrößen, Kappung an der Beitragsbemessungsgrenze und Rentenwert stehen
// in rentenwerte.js. Vorher rechnete dieses Modul mit dem Durchschnittsentgelt
// und dem Rentenwert von 2024 und kannte die Beitragsbemessungsgrenze nicht –
// ein Bruttoentgelt von 200.000 € ergab dort 4,41 Entgeltpunkte, obwohl aus
// dem Teil oberhalb der Grenze keine Beiträge und damit keine Punkte entstehen.

import {
  AKTUELLER_RENTENWERT,
  BBG_RENTE_JAHR,
  DURCHSCHNITTSENTGELT_VORLAEUFIG,
  MAX_ENTGELTPUNKTE_JAHR,
  entgeltpunkteAusJahresentgelt,
} from './rentenwerte.js';

export { AKTUELLER_RENTENWERT, BBG_RENTE_JAHR, DURCHSCHNITTSENTGELT_VORLAEUFIG, MAX_ENTGELTPUNKTE_JAHR };

/**
 * Entgeltpunkte eines Beitragsjahres und die Rente, die sie heute ergeben.
 *
 * Die ausgewiesene Monatsrente unterstellt einen Zugangsfaktor von 1,0 – also
 * Rentenbeginn genau mit der Regelaltersgrenze – und den Rentenartfaktor 1,0
 * der Altersrenten (§ 67 Nr. 1 SGB VI). Sie ist in heutigen Werten gerechnet:
 * Sowohl das Durchschnittsentgelt als auch der Rentenwert steigen, das Ergebnis
 * ist deshalb als heutige Kaufkraft zu lesen, nicht als späterer Zahlbetrag.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttoJahr Bruttoarbeitsentgelt im Jahr, in Euro
 * @param {number} [eingabe.jahre] Zahl der Jahre mit diesem Entgelt
 */
export function berechneRentenpunkte({ bruttoJahr, jahre = 1 }) {
  const brutto = Number.isFinite(bruttoJahr) ? Math.max(0, bruttoJahr) : 0;
  const anzahlJahre = Number.isFinite(jahre) ? Math.max(0, jahre) : 0;

  const beitragspflichtigesEntgelt = Math.min(brutto, BBG_RENTE_JAHR);
  const entgeltpunkte = entgeltpunkteAusJahresentgelt(brutto);
  const entgeltpunkteGesamt = runde4(entgeltpunkte * anzahlJahre);
  const monatsrente = runde2(entgeltpunkteGesamt * AKTUELLER_RENTENWERT);

  return {
    entgeltpunkte,
    entgeltpunkteGesamt,
    monatsrente,
    beitragspflichtigesEntgelt,
    ueberBeitragsbemessungsgrenze: brutto > BBG_RENTE_JAHR,
    beitragsbemessungsgrenze: BBG_RENTE_JAHR,
    maxEntgeltpunkte: MAX_ENTGELTPUNKTE_JAHR,
    rentenwert: AKTUELLER_RENTENWERT,
    durchschnittsentgelt: DURCHSCHNITTSENTGELT_VORLAEUFIG,
  };
}

function runde4(wert) {
  return Math.round(wert * 1e4) / 1e4;
}

function runde2(betrag) {
  return Math.round(betrag * 100) / 100;
}
