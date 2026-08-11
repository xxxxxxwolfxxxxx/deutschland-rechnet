// Steuernachzahlung oder Erstattung
//
// Rechtsstand: 2026-01-01
// Rechtsgrundlagen:
// - § 39b Abs. 2 EStG   einbehaltene Lohnsteuer
// - § 32a Abs. 1 und 5   Grund- und Splittingtarif der Veranlagung
// - § 9a, § 10c, § 24b EStG   Pauschbeträge
// - §§ 3, 4 SolzG 1995   Solidaritätszuschlag
//
// Eine Nachzahlung entsteht dort, wo die einbehaltene Lohnsteuer von der
// tatsächlich geschuldeten Jahressteuer abweicht. Das Modul rechnet deshalb
// beides und bildet die Differenz.
//
// Was hier bis zum 11.08.2026 stand, war etwas anderes: Es gab die komplette
// Jahressteuer als "Nachzahlung" aus (`nachzahlung = gesamteSteuer`), rechnete
// mit dem Grundfreibetrag von 2024 und einem Tarif, dessen Formel den
// Grundfreibetrag gar nicht abzog – bei 30.000 € zu versteuerndem Einkommen
// kamen 12.506 € statt 4.217 € heraus. Die Steuerklassen-Faktoren, die es
// berechnete, wurden nie verwendet.
//
// Grenze des Modells: Die Vorsorgeaufwendungen werden mit der Vorsorgepauschale
// des § 39b Abs. 2 Satz 5 Nr. 3 EStG angesetzt, wie es § 39f Satz 3 EStG für
// die Faktorermittlung vorsieht. Die Veranlagung setzt sie nach § 10 Abs. 1
// Nr. 2, 3 und 3a EStG mit den dortigen Höchstbeträgen an; davon kann das
// Ergebnis abweichen. Kinderfreibeträge und die Günstigerprüfung nach § 31 EStG
// sind nicht abgebildet.

import { einkommensteuer } from './einkommensteuer.js';
import {
  jahreslohnsteuer,
  vorsorgepauschale,
  solidaritaetszuschlag,
  solidaritaetszuschlagJahr,
  ARBEITNEHMER_PAUSCHBETRAG,
  SONDERAUSGABEN_PAUSCHBETRAG,
  ENTLASTUNGSBETRAG_ALLEINERZIEHENDE,
  SOLI_FREIGRENZE,
  SOLI_FREIGRENZE_SPLITTING,
} from './lohnsteuer.js';

/**
 * Nachzahlung oder Erstattung nach der Einkommensteuererklärung.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttoJahr Jahresarbeitslohn, in Euro
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @param {number} [eingabe.partnerBruttoJahr] Jahresarbeitslohn des Partners; 0 = keine Zusammenveranlagung
 * @param {number} [eingabe.partnerSteuerklasse] Steuerklasse des Partners; 0 = kein Partner
 * @param {number} [eingabe.werbungskosten] nachgewiesene Werbungskosten, in Euro
 * @param {number} [eingabe.sonderausgaben] nachgewiesene Sonderausgaben ohne Vorsorgeaufwendungen, in Euro
 * @param {number} [eingabe.kinder] Kinder unter 25 Jahren, für die Pflegeversicherung
 * @param {number} [eingabe.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse
 */
export function berechneSteuernachzahlung({
  bruttoJahr,
  steuerklasse,
  partnerBruttoJahr = 0,
  partnerSteuerklasse = 0,
  werbungskosten = 0,
  sonderausgaben = 0,
  kinder = 0,
  zusatzbeitrag,
}) {
  const lohn = betrag(bruttoJahr);
  const partnerLohn = partnerSteuerklasse ? betrag(partnerBruttoJahr) : 0;
  const zusammen = Boolean(partnerSteuerklasse);

  // Einbehalten: Lohnsteuer und Solidaritätszuschlag beider Partner.
  const eigen = einbehalt(lohn, steuerklasse, kinder, zusatzbeitrag);
  const partner = zusammen ? einbehalt(partnerLohn, partnerSteuerklasse, kinder, zusatzbeitrag) : leer();
  const einbehalten = runde(eigen.gesamt + partner.gesamt);

  // Geschuldet: Einkommensteuer auf das zu versteuernde Einkommen.
  // Werbungskosten und Sonderausgaben wirken nur, soweit sie den jeweiligen
  // Pauschbetrag übersteigen – darunter gilt ohnehin die Pauschale.
  const eigenZvE = zuVersteuerndesEinkommen(lohn, steuerklasse, kinder, werbungskosten, sonderausgaben, zusatzbeitrag);
  const partnerZvE = zusammen
    ? zuVersteuerndesEinkommen(partnerLohn, partnerSteuerklasse, kinder, 0, 0, zusatzbeitrag)
    : 0;
  const zvE = eigenZvE + partnerZvE;

  const steuer = zusammen ? 2 * einkommensteuer(zvE / 2) : einkommensteuer(zvE);
  const soli = solidaritaetszuschlag(steuer, zusammen ? SOLI_FREIGRENZE_SPLITTING : SOLI_FREIGRENZE);
  const jahressteuer = runde(steuer + soli);

  // Positiv bedeutet: Es wurde mehr einbehalten als geschuldet.
  const differenz = runde(einbehalten - jahressteuer);

  return {
    differenz,
    erstattung: Math.max(0, differenz),
    nachzahlung: Math.max(0, -differenz),
    einbehalten,
    einbehaltenLohnsteuer: runde(eigen.lohnsteuer + partner.lohnsteuer),
    einbehaltenSoli: runde(eigen.soli + partner.soli),
    jahressteuer,
    einkommensteuer: steuer,
    soli,
    zuVersteuerndesEinkommen: runde(zvE),
    zusammenveranlagung: zusammen,
  };
}

function einbehalt(lohn, steuerklasse, kinder, zusatzbeitrag) {
  const lohnsteuer = jahreslohnsteuer({ jahresarbeitslohn: lohn, steuerklasse, kinder, zusatzbeitrag });
  const soli = solidaritaetszuschlagJahr(lohnsteuer, steuerklasse);
  return { lohnsteuer, soli, gesamt: runde(lohnsteuer + soli) };
}

function leer() {
  return { lohnsteuer: 0, soli: 0, gesamt: 0 };
}

function zuVersteuerndesEinkommen(lohn, steuerklasse, kinder, werbungskosten, sonderausgaben, zusatzbeitrag) {
  if (lohn <= 0) return 0;

  const werbung = Math.max(betrag(werbungskosten), ARBEITNEHMER_PAUSCHBETRAG);
  const sonder = Math.max(betrag(sonderausgaben), SONDERAUSGABEN_PAUSCHBETRAG);
  const vorsorge = vorsorgepauschale({ jahresarbeitslohn: lohn, steuerklasse, kinder, zusatzbeitrag });
  const entlastung = steuerklasse === 2 ? ENTLASTUNGSBETRAG_ALLEINERZIEHENDE : 0;

  return Math.max(0, lohn - werbung - sonder - vorsorge - entlastung);
}

function betrag(wert) {
  return Number.isFinite(wert) ? Math.max(0, wert) : 0;
}

function runde(wert) {
  return Math.round(wert * 100) / 100;
}
