// Rentenlücke aus der eigenen Renteninformation
//
// Quellen (abgerufen am 14.09.2026):
// - § 22 Nr. 1 Satz 3 Buchst. a Doppelbuchst. aa EStG: Besteuerungsanteil
//   nach dem Jahr des Rentenbeginns
// - § 9a Satz 1 Nr. 3 EStG: Werbungskosten-Pauschbetrag 102 Euro
// - § 10 Abs. 1 Nr. 3 und Abs. 4 EStG: Beiträge zur Basis-Kranken- und
//   Pflegeversicherung als Sonderausgaben; ohne Krankengeldanspruch keine
//   Kürzung um 4 Prozent
// - § 10c EStG: Sonderausgaben-Pauschbetrag 36 / 72 Euro
// - Kranken- und Pflegeversicherung der Rentner: rentenwerte.js
//
// Die frühere Seite setzte die gesetzliche Rente pauschal mit 60 Prozent des
// heutigen Nettoeinkommens an. Eine solche Quote gibt es nicht. Die voraussichtliche
// Rente steht in der Renteninformation, die die Deutsche Rentenversicherung ab
// 27 Jahren jährlich verschickt – mit ihr rechnet dieses Modul.

import { einkommensteuer } from './einkommensteuer.js';
import { rentnerBeitraege } from './rentenwerte.js';

/** § 9a Satz 1 Nr. 3 EStG */
export const WERBUNGSKOSTEN_PAUSCHBETRAG_RENTE = 102;

/** § 10c EStG */
export const SONDERAUSGABEN_PAUSCHBETRAG = 36;

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Number(wert) : 0);
const runde = (n) => Math.round(n * 100) / 100;

/**
 * Besteuerungsanteil in Prozent nach dem Jahr des Rentenbeginns.
 *
 * Die Tabelle des § 22 folgt drei Schritten: bis 2005 50 %, bis 2020 je Jahr
 * 2 Punkte mehr (80 %), bis 2022 je 1 Punkt (82 %), ab 2023 je 0,5 Punkte bis
 * 100 % im Jahr 2058.
 */
export function besteuerungsanteil(jahrRentenbeginn) {
  const j = Math.floor(zahl(jahrRentenbeginn));
  if (j <= 2005) return 50;
  if (j <= 2020) return 50 + (j - 2005) * 2;
  if (j <= 2022) return 80 + (j - 2020);
  if (j >= 2058) return 100;
  return 82 + (j - 2022) * 0.5;
}

/**
 * Nettorente im Monat: Bruttorente minus Kranken- und Pflegeversicherung minus
 * anteilige Einkommensteuer. Unterstellt ist, dass die Rente die einzige
 * Einkunft ist; Solidaritätszuschlag und Kirchensteuer sind nicht enthalten.
 *
 * @param {object} p
 * @param {number} p.bruttoMonat Rente laut Renteninformation, in heutigen Werten
 * @param {number} p.jahrRentenbeginn
 * @param {boolean} [p.elternteil] für den Beitragszuschlag Kinderloser zur Pflegeversicherung
 * @param {number} [p.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse (z. B. 0.029)
 */
export function nettorente({ bruttoMonat, jahrRentenbeginn, elternteil = true, zusatzbeitrag }) {
  const brutto = Math.max(0, zahl(bruttoMonat));
  const sv = rentnerBeitraege({ bruttorente: brutto, elternteil, zusatzbeitrag });

  const anteil = besteuerungsanteil(jahrRentenbeginn);
  const jahresrente = brutto * 12;
  const steuerpflichtig = jahresrente * (anteil / 100);
  const einkuenfte = Math.max(0, steuerpflichtig - WERBUNGSKOSTEN_PAUSCHBETRAG_RENTE);
  const vorsorge = sv.gesamt * 12;
  const zvE = Math.max(0, einkuenfte - vorsorge - SONDERAUSGABEN_PAUSCHBETRAG);
  const steuerJahr = einkommensteuer(zvE);
  const steuerMonat = steuerJahr / 12;

  return {
    brutto: runde(brutto),
    krankenversicherung: sv.krankenversicherung,
    pflegeversicherung: sv.pflegeversicherung,
    besteuerungsanteil: anteil,
    zvE: Math.floor(zvE),
    steuerMonat: runde(steuerMonat),
    netto: runde(brutto - sv.gesamt - steuerMonat),
  };
}

/**
 * Kapital, das eine monatliche Lücke über eine Anzahl Jahre deckt
 * (Barwert einer nachschüssigen Monatsrente).
 */
export function kapitalbedarf({ lueckeMonat, jahre, renditeProzent = 0 }) {
  const l = Math.max(0, zahl(lueckeMonat));
  const n = Math.max(0, Math.round(zahl(jahre) * 12));
  const r = zahl(renditeProzent) / 100 / 12;
  if (n === 0 || l === 0) return 0;
  if (r === 0) return runde(l * n);
  return runde(l * (1 - Math.pow(1 + r, -n)) / r);
}

/**
 * Monatliche Sparrate, die in einer Anzahl Jahre ein Zielkapital erreicht
 * (Endwert einer nachschüssigen Monatsrate).
 */
export function sparrateFuer({ zielkapital, jahre, renditeProzent = 0 }) {
  const k = Math.max(0, zahl(zielkapital));
  const n = Math.max(0, Math.round(zahl(jahre) * 12));
  const r = zahl(renditeProzent) / 100 / 12;
  if (k === 0) return 0;
  if (n === 0) return null;
  if (r === 0) return runde(k / n);
  return runde((k * r) / (Math.pow(1 + r, n) - 1));
}

/**
 * Gesamtrechnung.
 *
 * @param {object} p
 * @param {number} p.bruttoMonat
 * @param {number} p.jahrRentenbeginn
 * @param {number} p.wunschNetto gewünschtes monatliches Netto im Ruhestand, in heutigen Werten
 * @param {number} p.jahreBisRente
 * @param {number} p.bezugsjahre angenommene Dauer, über die die Lücke gedeckt werden soll
 * @param {number} [p.renditeProzent] angenommene Rendite, vor und nach Rentenbeginn gleich
 * @param {boolean} [p.elternteil]
 * @param {number} [p.zusatzbeitrag]
 */
export function berechneRentenluecke({
  bruttoMonat,
  jahrRentenbeginn,
  wunschNetto,
  jahreBisRente,
  bezugsjahre,
  renditeProzent = 0,
  elternteil = true,
  zusatzbeitrag,
}) {
  const rente = nettorente({ bruttoMonat, jahrRentenbeginn, elternteil, zusatzbeitrag });
  const luecke = Math.max(0, zahl(wunschNetto) - rente.netto);
  const kapital = kapitalbedarf({ lueckeMonat: luecke, jahre: bezugsjahre, renditeProzent });
  const sparrate = sparrateFuer({ zielkapital: kapital, jahre: jahreBisRente, renditeProzent });
  return { rente, lueckeMonat: runde(luecke), kapitalbedarf: kapital, sparrate };
}
