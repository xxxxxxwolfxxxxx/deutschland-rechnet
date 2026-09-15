// Wie viel Haus trägt eine Monatsrate?
//
// Die frühere Seite nahm eine Tilgung von festen 2 %, ignorierte die
// eingegebene Zinsbindung, schlug die Kaufnebenkosten als freien Prozentsatz
// auf und empfahl eine Rate von „35 % des Nettoeinkommens“ ohne Quelle.
// Dieses Modul rechnet stattdessen von der Rate aus, die der Nutzer selbst
// tragen kann:
//
//   Darlehen   = Rate × 12 ÷ (Sollzins + anfängliche Tilgung)
//   Kaufpreis  = so hoch, dass Kaufpreis + Nebenkosten(Kaufpreis)
//                = Eigenkapital + Darlehen
//
// Die Nebenkosten kommen aus ./immokauf-nebenkosten.js: Grunderwerbsteuer des
// Bundeslandes (§ 11 GrEStG mit Landessatz), Notar und Grundbuch nach GNotKG,
// wahlweise Maklerprovision. Weil sie selbst vom Kaufpreis abhängen, wird der
// Kaufpreis per Bisektion bestimmt.
//
// Restschuld und Anschlussrate kommen aus dem Tilgungsplan in ./annuitaet.js.
// Nicht enthalten: Grundschuldbestellung, Bereitstellungszinsen und die
// laufenden Kosten des Hauses.

import { tilgungsplan, annuitaetenrate } from './annuitaet.js';
import { berechneImmokaufNebenkosten } from './immokauf-nebenkosten.js';

const aufCent = (betrag) => Math.round(betrag * 100) / 100;
const MAX_MONATE = 1200;

function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Darlehensbetrag, den eine Rate bei Sollzins und anfänglicher Tilgung trägt. */
export function darlehenAusRate({ rate, sollzins, tilgung }) {
  const satz = zahl(sollzins) + zahl(tilgung);
  if (satz === 0) return 0;
  return Math.floor((zahl(rate) * 12 * 100) / satz);
}

/** Höchster Kaufpreis, bei dem Kaufpreis und Nebenkosten zusammen das Budget nicht übersteigen. */
export function kaufpreisAusBudget({ budget, bundesland, mitMakler }) {
  const b = zahl(budget);
  if (b === 0) return { kaufpreis: 0, nebenkosten: null };
  let lo = 0;
  let hi = b;
  for (let k = 0; k < 60; k += 1) {
    const mitte = (lo + hi) / 2;
    const nk = berechneImmokaufNebenkosten({ kaufpreis: mitte, bundesland, mitMakler }).gesamt;
    if (mitte + nk <= b) lo = mitte;
    else hi = mitte;
  }
  const kaufpreis = Math.floor(lo);
  return { kaufpreis, nebenkosten: berechneImmokaufNebenkosten({ kaufpreis, bundesland, mitMakler }) };
}

/**
 * @param {object} e
 * @param {number} e.rate tragbare Monatsrate
 * @param {number} e.eigenkapital
 * @param {number} e.sollzins Prozent p. a.
 * @param {number} e.tilgung anfängliche Tilgung in Prozent p. a.
 * @param {number} e.zinsbindung Jahre
 * @param {number} [e.anschlusszins] Sollzins nach der Zinsbindung, Prozent p. a.
 * @param {string} e.bundesland Kürzel wie in grunderwerbsteuer.js
 * @param {boolean} [e.mitMakler]
 * @param {number} [e.einkommen] Haushaltsnettoeinkommen je Monat
 * @param {number} [e.ausgaben] feste Ausgaben je Monat ohne bisherige Miete
 */
export function berechneWieVielHaus({
  rate, eigenkapital, sollzins, tilgung, zinsbindung, anschlusszins,
  bundesland, mitMakler = false, einkommen = 0, ausgaben = 0,
}) {
  const darlehen = darlehenAusRate({ rate, sollzins, tilgung });
  const budget = darlehen + zahl(eigenkapital);
  const { kaufpreis, nebenkosten } = kaufpreisAusBudget({ budget, bundesland, mitMakler });

  const r = zahl(rate);
  const plan = darlehen > 0 && r > 0
    ? tilgungsplan({ betrag: darlehen, sollzins: zahl(sollzins), monate: MAX_MONATE, rate: r })
    : [];
  const bindungMonate = Math.round(zahl(zinsbindung) * 12);
  const laufzeitMonate = plan.length;
  const bisBindung = plan.slice(0, Math.min(bindungMonate, laufzeitMonate));
  const restschuld = bindungMonate < laufzeitMonate && bisBindung.length
    ? bisBindung[bisBindung.length - 1].restschuld
    : 0;
  const zinsenBindung = aufCent(bisBindung.reduce((s, z) => s + z.zins, 0));

  // Rate, die dieselbe Restschuld zum ursprünglich geplanten Ende tilgt, wenn
  // der Zins nach der Bindung ein anderer ist. Bei unverändertem Zins weicht
  // sie um wenige Euro von der alten Rate ab, weil die Restlaufzeit ganze
  // Monate zählt, die letzte Rate des Plans aber nur eine Teilrate ist.
  const restMonate = laufzeitMonate - bindungMonate;
  const zinsDanach = anschlusszins === undefined || anschlusszins === '' ? zahl(sollzins) : Number(anschlusszins);
  const anschlussrate = restschuld > 0 && restMonate > 0
    ? annuitaetenrate({ betrag: restschuld, sollzins: Math.max(0, zinsDanach), monate: restMonate })
    : 0;

  const frei = zahl(einkommen) - zahl(ausgaben);

  return {
    darlehen,
    budget,
    kaufpreis,
    nebenkosten,
    laufzeitJahre: Math.round((laufzeitMonate / 12) * 10) / 10,
    restschuld,
    zinsenBindung,
    anschlussrate,
    haushalt: zahl(einkommen) > 0
      ? { frei: aufCent(frei), nachRate: aufCent(frei - r), rateAnteilEinkommen: Math.round((r / zahl(einkommen)) * 1000) / 10 }
      : null,
  };
}
