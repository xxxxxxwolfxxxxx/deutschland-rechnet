// Abfindung nach § 1a KSchG
//
// Quelle: https://www.gesetze-im-internet.de/kschg/__1a.html (abgerufen am 14.09.2026)
//
// § 1a Abs. 2: "Die Höhe der Abfindung beträgt 0,5 Monatsverdienste für jedes
// Jahr des Bestehens des Arbeitsverhältnisses. [...] Bei der Ermittlung der
// Dauer des Arbeitsverhältnisses ist ein Zeitraum von mehr als sechs Monaten
// auf ein volles Jahr aufzurunden."
//
// Der Anspruch besteht nur unter den Voraussetzungen des Absatzes 1:
// betriebsbedingte Kündigung, Hinweis des Arbeitgebers in der Kündigung,
// keine Klage innerhalb der Frist des § 4 Satz 1. In allen anderen Fällen ist
// die Höhe Verhandlungssache; § 1a liefert dann nur einen Vergleichswert.

import { einkommensteuer } from './einkommensteuer.js';

/** § 1a Abs. 2 Satz 1 KSchG */
export const MONATSVERDIENSTE_JE_JAHR = 0.5;

/** § 1a Abs. 2 Satz 3 KSchG: mehr als sechs Monate werden aufgerundet */
export const AUFRUNDEN_AB_MEHR_ALS_MONATEN = 6;

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);

/**
 * Anzusetzende Jahre des Arbeitsverhältnisses.
 * @param {{ jahre?: number, monate?: number }} dauer
 */
export function anrechenbareJahre({ jahre = 0, monate = 0 }) {
  const gesamtMonate = Math.floor(zahl(jahre)) * 12 + Math.floor(zahl(monate));
  const volle = Math.floor(gesamtMonate / 12);
  const rest = gesamtMonate % 12;
  return rest > AUFRUNDEN_AB_MEHR_ALS_MONATEN ? volle + 1 : volle;
}

/**
 * @param {object} p
 * @param {number} p.bruttoMonat Monatsverdienst nach § 10 Abs. 3 KSchG
 * @param {number} [p.jahre] volle Jahre des Arbeitsverhältnisses
 * @param {number} [p.monate] zusätzliche Monate
 * @param {number} [p.dienstjahre] ältere Schnittstelle: volle Jahre ohne Monate
 */
export function berechneAbfindung({ bruttoMonat, jahre, monate = 0, dienstjahre }) {
  const j = anrechenbareJahre({ jahre: jahre ?? dienstjahre ?? 0, monate });
  const monatsgehaelter = j * MONATSVERDIENSTE_JE_JAHR;
  return {
    jahre: j,
    monatsgehaelter,
    abfindung: Math.round(zahl(bruttoMonat) * monatsgehaelter * 100) / 100,
  };
}

/** Tarifliche Einkommensteuer, bei Zusammenveranlagung im Splittingverfahren. */
function tarif(zvE, zusammen) {
  return zusammen ? 2 * einkommensteuer(zvE / 2) : einkommensteuer(zvE);
}

/**
 * Einkommensteuer auf eine Abfindung mit und ohne Fünftelregelung.
 *
 * § 34 Abs. 1 EStG: Die Steuer auf außerordentliche Einkünfte – dazu gehören
 * Entschädigungen im Sinne des § 24 Nr. 1 (Abs. 2 Nr. 2) – beträgt das Fünffache
 * des Unterschieds zwischen der Steuer auf das übrige Einkommen und der Steuer
 * auf das übrige Einkommen zuzüglich eines Fünftels der außerordentlichen Einkünfte.
 * Nicht abgebildet ist der Sonderfall, dass das übrige Einkommen negativ ist.
 *
 * @param {object} p
 * @param {number} p.zvEOhne zu versteuerndes Einkommen ohne die Abfindung
 * @param {number} p.abfindung
 * @param {boolean} [p.zusammen]
 */
export function steuerAufAbfindung({ zvEOhne, abfindung, zusammen = false }) {
  const basis = zahl(zvEOhne);
  const a = zahl(abfindung);
  const ohneRegel = tarif(basis + a, zusammen) - tarif(basis, zusammen);
  const mitRegel = 5 * (tarif(basis + a / 5, zusammen) - tarif(basis, zusammen));
  return { ohneFuenftelregelung: ohneRegel, mitFuenftelregelung: mitRegel, ersparnis: ohneRegel - mitRegel };
}
