// Immobilienkauf-Nebenkosten
//
// Die Grunderwerbsteuersätze standen hier als eigene Kopie und waren dadurch
// zwei Änderungen hinterher (Bremen 5,0 statt 5,5 %, Thüringen 6,5 statt
// 5,0 %). Sie kommen jetzt aus grunderwerbsteuer.js – dem einzigen Ort, an dem
// sie gepflegt werden.
import { STEUERSAETZE } from './grunderwerbsteuer.js';

export function berechneImmokaufNebenkosten({ kaufpreis, bundesland, mitMakler = true, maklerProvisionProzent = 3.57 }) {
  const gewSatz = STEUERSAETZE[bundesland] ?? 5.0;
  const grunderwerbsteuer = Math.round(kaufpreis * gewSatz / 100 * 100) / 100;
  const notar = Math.round(kaufpreis * 0.015 * 100) / 100; // ca. 1,5 % (Notar + Grundbuch)
  const makler = mitMakler ? Math.round(kaufpreis * maklerProvisionProzent / 100 * 119 / 100 * 100) / 100 : 0;
  // Makler: Provision inkl. 19% USt, Käufer zahlt halbe Provision (§ 656c BGB)
  const maklerKaeufer = mitMakler ? Math.round(kaufpreis * (maklerProvisionProzent / 100) * 1.19 / 2 * 100) / 100 : 0;
  const gesamt = Math.round((grunderwerbsteuer + notar + maklerKaeufer) * 100) / 100;
  const gesamtProzent = Math.round(gesamt / kaufpreis * 1000) / 10;
  return { grunderwerbsteuer, notar, maklerKaeufer, gesamt, gesamtProzent, gewSatz };
}
