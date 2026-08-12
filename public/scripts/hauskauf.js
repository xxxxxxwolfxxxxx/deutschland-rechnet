// Hauskauf: Nebenkosten und Finanzierung – Stand 12.08.2026
//
// Dieses Modul führte drei eigene Datenkopien:
//   * Notar und Grundbuch pauschal 2 % des Kaufpreises. Es sind Wertgebühren
//     nach § 34 GNotKG und degressiv – bei 400.000 € rund 3.980 € statt 8.000 €.
//   * eine eigene Grunderwerbsteuertabelle, in der Bremen mit 5,0 statt 5,5 %
//     und das Saarland mit 6,65 statt 6,5 % stand.
//   * die Maklerprovision als nackte Zahl.
// Alle drei kommen jetzt aus den Modulen, in denen sie gepflegt werden.
import { STEUERSAETZE } from './grunderwerbsteuer.js';
import { berechneNotarUndGrundbuch } from './gnotkg.js';
import { MAKLER_PROVISION_PROZENT_JE_SEITE } from './immokauf-nebenkosten.js';

// Bundessatz nach § 11 Abs. 1 GrEStG, falls das Länderkürzel unbekannt ist.
const GEW_BUNDESSATZ = 3.5;

function aufCent(betrag) {
  return Math.round(betrag * 100) / 100;
}

/**
 * Restschuld eines Annuitätendarlehens nach `monate` Monaten.
 */
function restschuldNach(darlehen, monatszins, rate, monate) {
  if (monatszins === 0) return Math.max(0, darlehen - rate * monate);
  const faktor = Math.pow(1 + monatszins, monate);
  return Math.max(0, darlehen * faktor - rate * (faktor - 1) / monatszins);
}

/**
 * Monate bis zur vollständigen Tilgung eines Annuitätendarlehens.
 * Gibt Infinity zurück, wenn die Rate die Zinsen nicht übersteigt.
 */
function tilgungsdauerMonate(darlehen, monatszins, rate) {
  if (darlehen <= 0) return 0;
  if (rate <= 0) return Infinity;
  if (monatszins === 0) return darlehen / rate;
  if (rate <= darlehen * monatszins) return Infinity;
  return -Math.log(1 - (darlehen * monatszins) / rate) / Math.log(1 + monatszins);
}

export function berechneHauskauf({ kaufpreis, bundesland, eigenkapital, zins, tilgung, laufzeit, makler }) {
  const kuerzel = String(bundesland ?? '').toLowerCase();
  const gewSatz = STEUERSAETZE[kuerzel] ?? GEW_BUNDESSATZ;
  const grunderwerbsteuer = aufCent(kaufpreis * gewSatz / 100);

  const notarUndGrundbuch = berechneNotarUndGrundbuch(kaufpreis).gesamt;
  const maklerKosten = makler
    ? aufCent(kaufpreis * MAKLER_PROVISION_PROZENT_JE_SEITE / 100)
    : 0;
  const nebenkosten = aufCent(grunderwerbsteuer + notarUndGrundbuch + maklerKosten);
  const gesamtkosten = aufCent(kaufpreis + nebenkosten);

  const darlehen = Math.max(0, kaufpreis - eigenkapital);
  const monatszins = zins / 100 / 12;
  const monatlicheRate = aufCent(darlehen * (zins + tilgung) / 100 / 12);

  // Nur bis zur Volltilgung rechnen: eine längere Zinsbindung als
  // Tilgungsdauer kostet keine weiteren Zinsen.
  const dauer = tilgungsdauerMonate(darlehen, monatszins, monatlicheRate);
  const monate = Math.min(laufzeit * 12, dauer);
  const restschuld = aufCent(restschuldNach(darlehen, monatszins, monatlicheRate, monate));
  // Gezahlte Raten abzüglich der in dieser Zeit geleisteten Tilgung.
  const zinsaufwand = aufCent(monatlicheRate * monate - (darlehen - restschuld));
  const tilgungszeit = Number.isFinite(dauer) ? Math.round(dauer / 12 * 10) / 10 : Infinity;

  return {
    kaufpreis: aufCent(kaufpreis),
    gewSatz,
    grunderwerbsteuer,
    notarUndGrundbuch,
    maklerKosten,
    nebenkosten,
    gesamtkosten,
    darlehen: aufCent(darlehen),
    monatlicheRate,
    zinsaufwand,
    restschuld,
    tilgungszeit,
  };
}

export { berechneHauskauf as default };
