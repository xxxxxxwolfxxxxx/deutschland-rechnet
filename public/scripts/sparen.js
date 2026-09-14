// Sparplan mit jährlicher Besteuerung der Zinsen
//
// Zinsen auf Tages- und Festgeld fließen jährlich zu und werden im Jahr des
// Zuflusses besteuert: Abgeltungsteuer und Solidaritätszuschlag nach
// abgeltungsteuer.js, abzüglich des Sparer-Pauschbetrags, der jedes Jahr neu gilt.
//
// Die frühere Seite multiplizierte die Steuer zusätzlich mit 0,7 – eine
// Teilfreistellung, die es nur für Aktienfonds gibt (§ 20 InvStG), nicht für
// Sparzinsen – und zog sie einmal am Ende ab.

import { berechneAbgeltungsteuer, SPARERPAUSCHBETRAG_EINZEL } from './abgeltungsteuer.js';

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Number(wert) : 0);
const runde = (n) => Math.round(n * 100) / 100;

/**
 * Monatliche Einzahlung am Monatsende, monatliche Verzinsung, Steuer am Jahresende.
 *
 * @param {object} p
 * @param {number} p.startkapital
 * @param {number} p.sparrate monatlich
 * @param {number} p.zinsProzent nominaler Jahreszins
 * @param {number} p.jahre
 * @param {number} [p.pauschbetrag] je Jahr noch freier Sparer-Pauschbetrag
 * @param {boolean} [p.kirchensteuerpflichtig]
 * @param {string} [p.bundesland]
 */
export function sparverlaufMitSteuer({
  startkapital,
  sparrate,
  zinsProzent,
  jahre,
  pauschbetrag = SPARERPAUSCHBETRAG_EINZEL,
  kirchensteuerpflichtig = false,
  bundesland = 'NW',
}) {
  const r = zahl(zinsProzent) / 100 / 12;
  const rate = Math.max(0, zahl(sparrate));
  let kapital = Math.max(0, zahl(startkapital));
  let eingezahlt = kapital;
  let zinsenBrutto = 0;
  let steuern = 0;

  for (let jahr = 0; jahr < Math.floor(zahl(jahre)); jahr += 1) {
    let zinsenJahr = 0;
    for (let m = 0; m < 12; m += 1) {
      const zins = kapital * r;
      zinsenJahr += zins;
      kapital += zins + rate;
      eingezahlt += rate;
    }
    const steuer = berechneAbgeltungsteuer({ ertrag: zinsenJahr, pauschbetrag, kirchensteuerpflichtig, bundesland }).gesamt;
    kapital -= steuer;
    zinsenBrutto += zinsenJahr;
    steuern += steuer;
  }

  return {
    endkapital: runde(kapital),
    eingezahlt: runde(eingezahlt),
    zinsenBrutto: runde(zinsenBrutto),
    steuern: runde(steuern),
    zinsenNetto: runde(zinsenBrutto - steuern),
  };
}
