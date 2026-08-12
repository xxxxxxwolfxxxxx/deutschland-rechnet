// Immobilienkauf-Nebenkosten
//
// Die Grunderwerbsteuersätze standen hier als eigene Kopie und waren dadurch
// zwei Änderungen hinterher (Bremen 5,0 statt 5,5 %, Thüringen 6,5 statt
// 5,0 %). Sie kommen jetzt aus grunderwerbsteuer.js – dem einzigen Ort, an dem
// sie gepflegt werden.
import { STEUERSAETZE } from './grunderwerbsteuer.js';
// Notar und Grundbuch waren pauschal 1,5 % des Kaufpreises. Es sind
// Wertgebühren nach § 34 GNotKG und damit degressiv – siehe gnotkg.js.
import { berechneNotarUndGrundbuch } from './gnotkg.js';

// Maklerprovision je Seite, brutto inklusive 19 % Umsatzsteuer (3,0 % zzgl.
// USt). Beim Kauf einer Wohnung oder eines Einfamilienhauses durch einen
// Verbraucher teilen sich Käufer und Verkäufer die Provision, § 656c BGB –
// 3,57 % sind also bereits der Käuferanteil und werden weder erneut
// versteuert noch ein zweites Mal halbiert.
export const MAKLER_PROVISION_PROZENT_JE_SEITE = 3.57;

export function berechneImmokaufNebenkosten({
  kaufpreis,
  bundesland,
  mitMakler = true,
  maklerProvisionProzent = MAKLER_PROVISION_PROZENT_JE_SEITE,
}) {
  const gewSatz = STEUERSAETZE[bundesland] ?? 5.0;
  const grunderwerbsteuer = Math.round(kaufpreis * gewSatz / 100 * 100) / 100;
  const notar = berechneNotarUndGrundbuch(kaufpreis).gesamt;
  const maklerKaeufer = mitMakler
    ? Math.round(kaufpreis * maklerProvisionProzent / 100 * 100) / 100
    : 0;
  const gesamt = Math.round((grunderwerbsteuer + notar + maklerKaeufer) * 100) / 100;
  const gesamtProzent = Math.round(gesamt / kaufpreis * 1000) / 10;
  return { grunderwerbsteuer, notar, maklerKaeufer, gesamt, gesamtProzent, gewSatz };
}
