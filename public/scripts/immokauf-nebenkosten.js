// Immobilienkauf-Nebenkosten
//
// Die Grunderwerbsteuersätze standen hier als eigene Kopie und waren dadurch
// zwei Änderungen hinterher (Bremen 5,0 statt 5,5 %, Thüringen 6,5 statt
// 5,0 %). Sie kommen jetzt aus grunderwerbsteuer.js – dem einzigen Ort, an dem
// sie gepflegt werden.
import { STEUERSAETZE } from './grunderwerbsteuer.js';
// Notar- und Grundbuchkosten nach dem Kostenverzeichnis (Anlage 1 GNotKG)
// stehen in gnotkg.js: KV 21100 Beurkundung (2,0, mindestens 120 €), KV 22110
// Vollzug (0,5), KV 22200 Betreuung (0,5), dazu die Umsatzsteuer nach KV 32014
// sowie grundbuchseitig KV 14150 Vormerkung (0,5) und KV 14110 Eigentums-
// umschreibung (1,0). Gerichtsgebühren sind nicht umsatzsteuerpflichtig.
import { berechneNotarUndGrundbuch } from './gnotkg.js';

// Marktüblicher Bruttosatz je Partei: 3,00 % netto zzgl. 19 % USt. Die
// Beschriftung der Seite liest diesen Wert, damit sie nicht wieder gegen die
// Rechnung auseinanderläuft.
export const MAKLER_PROVISION_PROZENT_JE_SEITE = 3.57;

const aufCent = (betrag) => Math.round(betrag * 100) / 100;

/**
 * Nebenkosten eines Immobilienkaufs.
 *
 * @param {object} eingaben
 * @param {number} eingaben.kaufpreis Kaufpreis in Euro
 * @param {string} eingaben.bundesland Kürzel wie in grunderwerbsteuer.js
 * @param {boolean} [eingaben.mitMakler]
 * @param {number} [eingaben.maklerProvisionProzentJeSeite] Provision, die EINE
 *   Partei schuldet, als Bruttosatz inklusive 19 % Umsatzsteuer. Marktüblich
 *   sind 3,57 % je Seite (3,00 % netto), also 7,14 % Gesamtprovision.
 * @returns {{grunderwerbsteuer: number, notar: number, grundbuch: number,
 *   maklerKaeufer: number, gesamt: number, gesamtProzent: number, gewSatz: number}}
 */
export function berechneImmokaufNebenkosten({
  kaufpreis,
  bundesland,
  mitMakler = true,
  maklerProvisionProzentJeSeite = MAKLER_PROVISION_PROZENT_JE_SEITE,
}) {
  // Die Kürzel stehen in grunderwerbsteuer.js klein, manche Seiten liefern sie
  // groß – ohne Normalisierung fiele der Lookup still auf 5,0 % zurück.
  const gewSatz = STEUERSAETZE[String(bundesland ?? '').toLowerCase()] ?? 5.0;
  const grunderwerbsteuer = aufCent(kaufpreis * gewSatz / 100);

  // Wertgebühren nach Tabelle B (§ 34 GNotKG), Geschäftswert ist der Kaufpreis.
  const { notar, grundbuch } = berechneNotarUndGrundbuch(kaufpreis);

  // Maklerprovision: Der Satz ist bereits brutto, er wird nicht noch einmal mit
  // 1,19 multipliziert. Er gilt außerdem je Partei und wird nicht halbiert:
  // § 656c Abs. 1 Satz 1 BGB verlangt bei Doppeltätigkeit, dass sich Käufer und
  // Verkäufer in gleicher Höhe verpflichten – der Käufer zahlt also den vollen
  // Satz, nicht dessen Hälfte. Übernimmt nur eine Seite den Maklervertrag,
  // begrenzt § 656d Abs. 1 BGB die Erstattung ebenfalls auf diese Höhe.
  const maklerKaeufer = mitMakler ? aufCent(kaufpreis * maklerProvisionProzentJeSeite / 100) : 0;

  const gesamt = aufCent(grunderwerbsteuer + notar + grundbuch + maklerKaeufer);
  const gesamtProzent = Math.round(gesamt / kaufpreis * 1000) / 10;
  return { grunderwerbsteuer, notar, grundbuch, maklerKaeufer, gesamt, gesamtProzent, gewSatz };
}
