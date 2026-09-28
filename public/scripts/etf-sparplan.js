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
 *
 * `renditeProzent` ist die Rendite im Jahr: 7 heißt, das Depot wächst in einem
 * Jahr um genau 7 Prozent. Jeder Monat bekommt deshalb den Faktor
 * (1 + R)^(1/12), nicht R/12 – das wären über ein Jahr 7,23 Prozent.
 *
 * `jahreswerte[j]` ist der Stand am Ende von Jahr j (Index 0 = Start).
 */
export function sparplanVerlauf({ startkapital = 0, sparrate = 0, renditeProzent = 0, jahre = 0 }) {
  const monate = Math.max(0, Math.round(zahl(jahre) * 12));
  const monatsfaktor = Math.pow(1 + zahl(renditeProzent) / 100, 1 / 12);
  const rate = Math.max(0, zahl(sparrate));
  let kapital = Math.max(0, zahl(startkapital));
  let eingezahlt = kapital;
  const jahreswerte = [runde(kapital)];
  for (let m = 1; m <= monate; m += 1) {
    kapital = kapital * monatsfaktor + rate;
    eingezahlt += rate;
    if (m % 12 === 0) jahreswerte.push(runde(kapital));
  }
  return {
    endkapital: runde(kapital),
    eingezahlt: runde(eingezahlt),
    gewinn: runde(kapital - eingezahlt),
    jahreswerte,
  };
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
