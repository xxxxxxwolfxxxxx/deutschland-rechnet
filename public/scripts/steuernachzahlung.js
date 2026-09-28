// Steuernachzahlung oder Erstattung
//
// Rechtsstand: 2026-01-01, Wortlaut der Normen abgerufen am 16.09.2026
// Rechtsgrundlagen:
// - § 39b Abs. 2 EStG     einbehaltene Lohnsteuer (lohnsteuer.js)
// - § 38b Abs. 1 EStG     zulässige Steuerklassen und Kombinationen
// - § 32a Abs. 1 und 5    Grund- und Splittingtarif der Veranlagung
// - § 31, § 32 Abs. 6     Günstigerprüfung Kindergeld / Freibeträge
//                         (einkommensteuer-rechner.js)
// - § 9a, § 10c EStG      Pauschbeträge
// - § 24b Abs. 2 EStG     Entlastungsbetrag für Alleinerziehende, in der
//                         Veranlagung mit 240 € je weiterem Kind (Satz 2);
//                         im Lohnsteuerabzug nur Satz 1
//                         (§ 39b Abs. 2 Satz 5 Nr. 4 EStG)
// - §§ 3, 4 SolzG 1995    Solidaritätszuschlag, in der Veranlagung nach der
//                         Steuer mit Kinderfreibeträgen (§ 3 Abs. 2)
//
// Eine Nachzahlung entsteht dort, wo die einbehaltene Lohnsteuer von der
// tatsächlich geschuldeten Jahressteuer abweicht. Das Modul rechnet deshalb
// beides und bildet die Differenz.
//
// Was hier bis zum 11.08.2026 stand, war etwas anderes: Es gab die komplette
// Jahressteuer als "Nachzahlung" aus (`nachzahlung = gesamteSteuer`), rechnete
// mit dem Grundfreibetrag von 2024 und einem Tarif, dessen Formel den
// Grundfreibetrag gar nicht abzog. Bis zum 16.09.2026 rechnete es außerdem
// jede Steuerklassen-Kombination (I mit Partner V ergab eine „Erstattung“),
// ließ Kinder in der Veranlagung weg und setzte den Entlastungsbetrag nur für
// ein Kind an.
//
// Grenzen des Modells:
// - Die Vorsorgeaufwendungen werden mit der Vorsorgepauschale des § 39b Abs. 2
//   Satz 5 Nr. 3 EStG angesetzt, wie es § 39f Satz 3 EStG für die
//   Faktorermittlung vorsieht. Die Veranlagung setzt sie nach § 10 Abs. 1
//   Nr. 2, 3 und 3a EStG mit den dortigen Höchstbeträgen an.
// - Der einbehaltene Soli mindert die Bemessungsgrundlage um die
//   Kinderfreibeträge (§ 3 Abs. 2a SolzG) mit einem angenommenen Zähler
//   (siehe ZAEHLER_JE_KIND).
// - Für den Entlastungsbetrag zählt der Rechner die Kinder mit Kindergeld als
//   Kinder im Haushalt.
// - Verwitwete in Steuerklasse III, Kirchensteuer und Progressionsvorbehalt
//   sind nicht abgebildet.

import { berechneEinkommensteuer } from './einkommensteuer-rechner.js';
import {
  jahreslohnsteuer,
  bemessungsgrundlageZuschlagsteuern,
  vorsorgepauschale,
  solidaritaetszuschlagJahr,
  ARBEITNEHMER_PAUSCHBETRAG,
  SONDERAUSGABEN_PAUSCHBETRAG,
  ENTLASTUNGSBETRAG_ALLEINERZIEHENDE,
} from './lohnsteuer.js';

/** § 24b Abs. 2 Satz 2 EStG: Erhöhung des Entlastungsbetrags je weiterem Kind. */
export const ENTLASTUNGSBETRAG_JE_WEITEREM_KIND = 240;

const ROEMISCH = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

// § 38b Abs. 1 Satz 2 EStG: IV gehört zu IV (Nr. 4), V zu einem Ehegatten in
// III (Nr. 5) und umgekehrt.
const PARTNERKLASSE = { 3: 5, 4: 4, 5: 3 };

/**
 * Prüft, ob die Steuerklassen nach § 38b Abs. 1 Satz 2 EStG zusammenpassen.
 *
 * @param {object} e
 * @param {number} e.steuerklasse 1 bis 6
 * @param {number} [e.partnerSteuerklasse] 0 = keine Zusammenveranlagung, sonst 3 bis 5
 * @param {number} [e.kinderKindergeld] Kinder mit Kindergeld oder Freibetrag
 * @returns {string|null} Hinweis für den Nutzer oder null, wenn alles passt
 */
export function pruefeKombination({ steuerklasse, partnerSteuerklasse = 0, kinderKindergeld = 0 }) {
  if (!ROEMISCH[steuerklasse]) {
    return `Unbekannte Steuerklasse: ${steuerklasse}`;
  }
  if (partnerSteuerklasse && !PARTNERKLASSE[partnerSteuerklasse]) {
    return `Unbekannte Steuerklasse des Partners: ${partnerSteuerklasse}`;
  }
  if (partnerSteuerklasse) {
    if (PARTNERKLASSE[steuerklasse] !== partnerSteuerklasse) {
      return `Steuerklasse ${ROEMISCH[steuerklasse]} passt nicht zu ${ROEMISCH[partnerSteuerklasse]}: Ehegatten haben die Kombination III/V oder IV/IV (§ 38b Abs. 1 Satz 2 Nr. 4 und 5 EStG).`;
    }
    return null;
  }
  if (PARTNERKLASSE[steuerklasse]) {
    return 'Die Steuerklassen III, IV und V setzen einen Ehegatten voraus (§ 38b Abs. 1 Satz 2 Nr. 3 bis 5 EStG) – bitte dessen Steuerklasse angeben. Verwitwete in Steuerklasse III bildet der Rechner nicht ab.';
  }
  if (steuerklasse === 2 && !(kinderKindergeld >= 1)) {
    return 'Steuerklasse II setzt ein Kind im Haushalt voraus, für das Kindergeld oder ein Kinderfreibetrag zusteht (§ 24b Abs. 1 EStG).';
  }
  return null;
}

/**
 * Nachzahlung oder Erstattung nach der Einkommensteuererklärung.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttoJahr Jahresarbeitslohn, in Euro
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @param {number} [eingabe.partnerBruttoJahr] Jahresarbeitslohn des Partners
 * @param {number} [eingabe.partnerSteuerklasse] Steuerklasse des Partners; 0 = keine Zusammenveranlagung
 * @param {number} [eingabe.werbungskosten] nachgewiesene Werbungskosten, in Euro
 * @param {number} [eingabe.sonderausgaben] nachgewiesene Sonderausgaben ohne Vorsorgeaufwendungen, in Euro
 * @param {number} [eingabe.kinder] Kinder unter 25 Jahren, für die Pflegeversicherung
 * @param {number} [eingabe.kinderKindergeld] Kinder mit Kindergeld im ganzen Jahr, für Günstigerprüfung und Entlastungsbetrag
 * @param {number} [eingabe.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse
 * @throws {Error} bei unzulässiger Steuerklassen-Kombination oder Kinderzahl
 */
export function berechneSteuernachzahlung({
  bruttoJahr,
  steuerklasse,
  partnerBruttoJahr = 0,
  partnerSteuerklasse = 0,
  werbungskosten = 0,
  sonderausgaben = 0,
  kinder = 0,
  kinderKindergeld = 0,
  zusatzbeitrag,
}) {
  const fehler = pruefeKombination({ steuerklasse, partnerSteuerklasse, kinderKindergeld });
  if (fehler) throw new Error(fehler);

  const lohn = betrag(bruttoJahr);
  const zusammen = Boolean(partnerSteuerklasse);
  const partnerLohn = zusammen ? betrag(partnerBruttoJahr) : 0;

  // Einbehalten: Lohnsteuer und Solidaritätszuschlag beider Partner.
  const eigen = einbehalt(lohn, steuerklasse, kinder, kinderKindergeld, zusatzbeitrag);
  const partner = zusammen ? einbehalt(partnerLohn, partnerSteuerklasse, kinder, kinderKindergeld, zusatzbeitrag) : leer();
  const einbehalten = runde(eigen.gesamt + partner.gesamt);

  // Geschuldet: Einkommensteuer und Soli der Veranlagung. Werbungskosten und
  // Sonderausgaben wirken nur, soweit sie den jeweiligen Pauschbetrag
  // übersteigen – darunter gilt ohnehin die Pauschale.
  const einkommen =
    einkommenNachAbzuegen(lohn, steuerklasse, kinder, kinderKindergeld, werbungskosten, sonderausgaben, zusatzbeitrag) +
    (zusammen ? einkommenNachAbzuegen(partnerLohn, partnerSteuerklasse, kinder, 0, 0, 0, zusatzbeitrag) : 0);

  const veranlagung = berechneEinkommensteuer({
    einkommen,
    tarif: zusammen ? 'zusammen' : 'grund',
    kinder: kinderKindergeld,
  });
  const jahressteuer = runde(veranlagung.einkommensteuer + veranlagung.soli);

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
    einkommensteuer: veranlagung.einkommensteuer,
    soli: veranlagung.soli,
    einkommen: runde(einkommen),
    zuVersteuerndesEinkommen: runde(veranlagung.zvE),
    freibetraegeGuenstiger: veranlagung.freibetraegeGuenstiger,
    hinzurechnungKindergeld: veranlagung.hinzurechnungKindergeld,
    zusammenveranlagung: zusammen,
  };
}

// Zahl der Kinderfreibeträge je Kind als Lohnsteuerabzugsmerkmal (§ 38b Abs. 2
// EStG): Annahme 0,5 für Alleinstehende in I und II (einfacher Freibetrag nach
// § 32 Abs. 6 Satz 1), 1 für Ehegatten in III und IV. V und VI mindern nicht.
const ZAEHLER_JE_KIND = { 1: 0.5, 2: 0.5, 3: 1, 4: 1, 5: 0, 6: 0 };

function einbehalt(lohn, steuerklasse, kinder, kinderKindergeld, zusatzbeitrag) {
  const lohnsteuer = jahreslohnsteuer({ jahresarbeitslohn: lohn, steuerklasse, kinder, zusatzbeitrag });
  const bemessung = bemessungsgrundlageZuschlagsteuern({
    jahresarbeitslohn: lohn,
    steuerklasse,
    kinder,
    kinderfreibetraege: kinderKindergeld * ZAEHLER_JE_KIND[steuerklasse],
    zusatzbeitrag,
  });
  const soli = solidaritaetszuschlagJahr(bemessung, steuerklasse);
  return { lohnsteuer, soli, gesamt: runde(lohnsteuer + soli) };
}

function leer() {
  return { lohnsteuer: 0, soli: 0, gesamt: 0 };
}

/** Einkommen im Sinne des § 2 Abs. 4 EStG, also noch vor den Kinderfreibeträgen. */
function einkommenNachAbzuegen(lohn, steuerklasse, kinder, kinderKindergeld, werbungskosten, sonderausgaben, zusatzbeitrag) {
  if (lohn <= 0) return 0;

  const werbung = Math.max(betrag(werbungskosten), ARBEITNEHMER_PAUSCHBETRAG);
  const sonder = Math.max(betrag(sonderausgaben), SONDERAUSGABEN_PAUSCHBETRAG);
  const vorsorge = vorsorgepauschale({ jahresarbeitslohn: lohn, steuerklasse, kinder, zusatzbeitrag });
  const entlastung = steuerklasse === 2
    ? ENTLASTUNGSBETRAG_ALLEINERZIEHENDE + ENTLASTUNGSBETRAG_JE_WEITEREM_KIND * Math.max(0, kinderKindergeld - 1)
    : 0;

  return Math.max(0, lohn - werbung - sonder - vorsorge - entlastung);
}

function betrag(wert) {
  return Number.isFinite(wert) ? Math.max(0, wert) : 0;
}

function runde(wert) {
  return Math.round(wert * 100) / 100;
}
