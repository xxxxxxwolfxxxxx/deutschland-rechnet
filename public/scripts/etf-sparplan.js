// ETF-Sparplan: Endkapital und Steuer beim Verkauf
//
// Quellen (abgerufen am 14.09.2026):
// - § 20 Abs. 1 InvStG: Bei Aktienfonds sind für Privatanleger 30 Prozent der
//   Erträge steuerfrei (Aktienteilfreistellung).
//   https://www.gesetze-im-internet.de/invstg_2018/__20.html
// - § 18 InvStG: Solange der Fonds thesauriert, wird jährlich eine
//   Vorabpauschale besteuert (Rücknahmepreis zu Jahresbeginn × 70 % des
//   Basiszinses, begrenzt auf den Wertzuwachs).
// - § 19 Abs. 1 InvStG: Beim Verkauf wird der Gewinn um die während der
//   Besitzzeit angesetzten Vorabpauschalen gemindert.
//
// Der Rechner setzt die gesamte Steuer beim Verkauf an. Die Vorabpauschalen
// verschieben einen Teil davon nach vorn, ändern die Summe aber nur über die
// jährlich wiederkehrenden Sparer-Pauschbeträge – deren Wirkung über die
// Laufzeit bildet der Rechner nicht ab, weil der künftige Basiszins unbekannt ist.
// Steuer und Solidaritätszuschlag rechnet abgeltungsteuer.js.

import { berechneAbgeltungsteuer, SPARERPAUSCHBETRAG_EINZEL } from './abgeltungsteuer.js';

/** § 20 Abs. 1 Satz 1 InvStG */
export const TEILFREISTELLUNG_AKTIENFONDS = 0.3;

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Number(wert) : 0);
const runde = (n) => Math.round(n * 100) / 100;

/**
 * Wachstum eines Sparplans mit monatlicher Einzahlung am Monatsende.
 * Die Jahresrendite wird als nominaler Satz gleichmäßig auf zwölf Monate verteilt.
 */
export function sparplanVerlauf({ startkapital = 0, sparrate = 0, renditeProzent = 0, jahre = 0 }) {
  const monate = Math.max(0, Math.round(zahl(jahre) * 12));
  const r = zahl(renditeProzent) / 100 / 12;
  const rate = Math.max(0, zahl(sparrate));
  let kapital = Math.max(0, zahl(startkapital));
  let eingezahlt = kapital;
  for (let m = 0; m < monate; m += 1) {
    kapital = kapital * (1 + r) + rate;
    eingezahlt += rate;
  }
  return { endkapital: runde(kapital), eingezahlt: runde(eingezahlt), gewinn: runde(kapital - eingezahlt) };
}

/**
 * Steuer auf den Veräußerungsgewinn beim vollständigen Verkauf.
 *
 * @param {object} p
 * @param {number} p.gewinn Veräußerungsgewinn (Erlös minus Anschaffungskosten)
 * @param {boolean} [p.aktienfonds] Teilfreistellung von 30 Prozent anwenden
 * @param {number} [p.pauschbetrag] im Verkaufsjahr noch freier Sparer-Pauschbetrag
 * @param {boolean} [p.kirchensteuerpflichtig]
 * @param {string} [p.bundesland]
 */
export function steuerBeimVerkauf({
  gewinn,
  aktienfonds = true,
  pauschbetrag = SPARERPAUSCHBETRAG_EINZEL,
  kirchensteuerpflichtig = false,
  bundesland = 'NW',
}) {
  const g = Math.max(0, zahl(gewinn));
  const teilfreistellung = aktienfonds ? runde(g * TEILFREISTELLUNG_AKTIENFONDS) : 0;
  const ertrag = runde(g - teilfreistellung);
  const steuer = berechneAbgeltungsteuer({ ertrag, pauschbetrag, kirchensteuerpflichtig, bundesland });
  return {
    gewinn: runde(g),
    teilfreistellung,
    ertrag,
    pauschbetrag: steuer.freigestellt,
    zuVersteuern: steuer.zuVersteuern,
    steuer: steuer.gesamt,
    nettoGewinn: runde(g - steuer.gesamt),
  };
}
