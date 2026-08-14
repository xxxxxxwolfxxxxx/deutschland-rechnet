// Gehaltserhöhung: was vom Brutto netto übrig bleibt
//
// Rechtsstand: 2026-01-01
//
// Das Modul rechnet nichts selbst: Es stellt dem alten das neue Gehalt
// gegenüber und lässt beide Nettobeträge von brutto-netto.js berechnen, also
// über den Lohnsteuertarif (§ 32a EStG) und die Sozialversicherungsbeiträge
// mit ihren Beitragsbemessungsgrenzen.
//
// Bis zum 14.08.2026 stand hier eine Tabelle fester Netto-Faktoren je
// Steuerklasse (I: 0,68, V: 0,58 und so weiter). Damit war der Nettogewinn
// stets derselbe Prozentsatz der Bruttoerhöhung – die Steuerprogression fiel
// unter den Tisch, ebenso die Beitragsbemessungsgrenzen. Gerade darum geht es
// bei diesem Rechner aber: Der Grenzabzug auf die Erhöhung ist höher als der
// Durchschnittsabzug auf das bisherige Gehalt, oberhalb der
// Bemessungsgrenzen dagegen niedriger.

import { berechneNettoGehalt } from './brutto-netto.js';

/** Die Seite liefert die Steuerklasse in römischen Ziffern. */
const STEUERKLASSEN_ROEMISCH = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };

/**
 * Wirkung einer Gehaltserhöhung auf das monatliche Netto.
 *
 * @param {object} eingabe
 * @param {number} eingabe.brutto bisheriges Bruttogehalt im Monat, in Euro
 * @param {number} eingabe.erhoehung Erhöhung in Euro oder Prozent
 * @param {string} eingabe.typ 'prozent' oder 'euro'
 * @param {string|number} [eingabe.stklasse] Steuerklasse, römisch oder als Zahl
 * @param {string|number} [eingabe.steuerklasse] wie stklasse
 * @param {string} [eingabe.bundesland] Kürzel, z. B. 'NW' – wirkt über
 *   Kirchensteuersatz und den sächsischen Sonderweg in der Pflegeversicherung
 * @param {boolean} [eingabe.kirchensteuer] Mitglied einer steuererhebenden Religionsgemeinschaft
 * @param {number} [eingabe.kinder] Kinder unter 25; 0 bedeutet kinderlos und
 *   damit den Beitragszuschlag nach § 55 Abs. 3 SGB XI
 * @param {number} [eingabe.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse
 */
function berechneGehaltserhoehung({
  brutto,
  erhoehung,
  typ,
  stklasse,
  steuerklasse,
  bundesland,
  kirchensteuer = false,
  kinder = 0,
  zusatzbeitrag,
}) {
  const klasse = steuerklasseAlsZahl(steuerklasse ?? stklasse);
  const bruttoAlt = Number.isFinite(brutto) ? Math.max(0, brutto) : 0;
  const wert = Number.isFinite(erhoehung) ? Math.max(0, erhoehung) : 0;

  const bruttoGewinn = typ === 'prozent' ? bruttoAlt * (wert / 100) : wert;
  const bruttoNeu = bruttoAlt + bruttoGewinn;

  const gemeinsam = { steuerklasse: klasse, bundesland, kirchensteuer, kinder, zusatzbeitrag };
  const alt = berechneNettoGehalt({ bruttoMonat: bruttoAlt, ...gemeinsam });
  const neu = berechneNettoGehalt({ bruttoMonat: bruttoNeu, ...gemeinsam });

  const nettoGewinn = neu.netto - alt.netto;
  const abgaben = bruttoGewinn - nettoGewinn;

  return {
    bruttoGewinn: runde(bruttoGewinn),
    nettoGewinn: runde(nettoGewinn),
    abgaben: runde(abgaben),
    neuesBrutto: runde(bruttoNeu),
    neuesNetto: runde(neu.netto),
    bisherigesNetto: runde(alt.netto),
    // Anteil der Erhöhung, der an Steuer und Beiträge geht.
    grenzbelastung: bruttoGewinn > 0 ? runde((abgaben / bruttoGewinn) * 100) : 0,
  };
}

function steuerklasseAlsZahl(klasse) {
  if (typeof klasse === 'number') return klasse;
  if (typeof klasse === 'string') {
    const roemisch = STEUERKLASSEN_ROEMISCH[klasse.toUpperCase()];
    if (roemisch) return roemisch;
    const zahl = Number(klasse);
    if (Number.isFinite(zahl)) return zahl;
  }
  return 1;
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}

export { berechneGehaltserhoehung, STEUERKLASSEN_ROEMISCH };
