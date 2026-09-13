// Mietrendite einer vermieteten Immobilie.
//
// Bis September 2026 stand diese Rechnung inline auf der Seite und bezog beide
// Renditen auf den KAUFPREIS. Das ist der haeufigste Fehler dieser Rechnung:
// Investiert ist nicht der Kaufpreis, sondern der Kaufpreis plus
// Grunderwerbsteuer, Notar, Grundbuch und gegebenenfalls Maklerprovision.
// Diese Nebenkosten liegen je nach Bundesland bei rund 9 bis 15 Prozent und
// sind nicht wiederverkaeuflich – wer sie weglaesst, rechnet sich die Rendite
// um denselben Prozentsatz schoen.
//
// Die Nebenkosten kommen aus immokauf-nebenkosten.js und damit die
// Grunderwerbsteuer aus grunderwerbsteuer.js und die Notar- und
// Grundbuchgebuehren aus gnotkg.js. Keine Zahl wird hier zweitgepflegt.

import { berechneImmokaufNebenkosten } from './immokauf-nebenkosten.js';

/**
 * Erfahrungswert fuer die Instandhaltungsruecklage, § 28 Abs. 1 WoEigG kennt
 * keinen Satz. Die Zweite Berechnungsverordnung nennt in § 28 Abs. 2 Betraege
 * je Quadratmeter; dieser Rechner arbeitet mit einer Jahressumme, die der
 * Nutzer selbst setzt. Der Wert dient nur als Voreinstellung.
 */
export const INSTANDHALTUNG_VOREINSTELLUNG = 1000;

const aufCent = (b) => Math.round(b * 100) / 100;
const proz = (b) => Math.round(b * 1000) / 1000;

/**
 * Brutto- und Nettomietrendite.
 *
 * @param {object} e
 * @param {number} e.kaufpreis          Kaufpreis in Euro
 * @param {number} e.kaltmieteJahr      Jahresnettokaltmiete in Euro
 * @param {number} [e.nebenkosten]      nicht umlagefaehige Bewirtschaftungskosten im Jahr
 * @param {number} [e.instandhaltung]   Instandhaltungsruecklage im Jahr
 * @param {string} [e.bundesland]       Kuerzel fuer die Grunderwerbsteuer
 * @param {boolean} [e.mitMakler]
 * @param {boolean} [e.kaufnebenkostenBeruecksichtigen] false rechnet wie frueher
 *   allein auf den Kaufpreis – nur fuer den Vergleich im Text.
 */
export function berechneMietrendite({
  kaufpreis,
  kaltmieteJahr,
  nebenkosten = 0,
  instandhaltung = 0,
  bundesland = 'NW',
  mitMakler = true,
  kaufnebenkostenBeruecksichtigen = true,
}) {
  const preis = Math.max(0, Number(kaufpreis) || 0);
  const miete = Math.max(0, Number(kaltmieteJahr) || 0);

  const nk = preis > 0
    ? berechneImmokaufNebenkosten({ kaufpreis: preis, bundesland, mitMakler })
    : { gesamt: 0, gesamtProzent: 0, grunderwerbsteuer: 0, notar: 0, grundbuch: 0, maklerKaeufer: 0 };
  const kaufnebenkosten = kaufnebenkostenBeruecksichtigen ? nk.gesamt : 0;
  const gesamtinvestition = aufCent(preis + kaufnebenkosten);

  const bewirtschaftung = aufCent(Math.max(0, nebenkosten) + Math.max(0, instandhaltung));
  const nettoMiete = aufCent(miete - bewirtschaftung);

  const auf = (betrag, basis) => (basis > 0 ? proz((betrag / basis) * 100) : 0);

  return {
    gesamtinvestition,
    kaufnebenkosten: aufCent(kaufnebenkosten),
    kaufnebenkostenProzent: nk.gesamtProzent,
    nebenkostenAufschluesselung: {
      grunderwerbsteuer: nk.grunderwerbsteuer,
      notar: nk.notar,
      grundbuch: nk.grundbuch,
      makler: nk.maklerKaeufer,
    },
    bewirtschaftung,
    bewirtschaftungsquote: auf(bewirtschaftung, miete),
    nettoMiete,
    /** Die Zahl, die ueblicherweise als "Bruttorendite" genannt wird: auf den Kaufpreis. */
    bruttorenditeAufKaufpreis: auf(miete, preis),
    /** Dieselbe Miete auf das tatsaechlich gebundene Kapital. */
    bruttorendite: auf(miete, gesamtinvestition),
    nettorendite: auf(nettoMiete, gesamtinvestition),
    /** Zum Vergleich: die Nettorendite, wenn man die Kaufnebenkosten ignoriert. */
    nettorenditeAufKaufpreis: auf(nettoMiete, preis),
    /**
     * Kaufpreisfaktor oder Vervielfaeltiger: wie viele Jahresnettokaltmieten
     * der Kaufpreis betraegt. Der Kehrwert der Bruttorendite auf den Kaufpreis.
     */
    kaufpreisfaktor: miete > 0 ? proz(preis / miete) : 0,
    faktorAufGesamtinvestition: miete > 0 ? proz(gesamtinvestition / miete) : 0,
  };
}
