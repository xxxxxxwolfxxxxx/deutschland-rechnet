// Gesetzliche Rentenversicherung – Rechengrößen und Rechenregeln
//
// Rechtsstand: 2026-07-01
//
// Primärquellen:
// - Aktueller Rentenwert: § 1 RWBestV 2026 (42,52 € ab 1. Juli 2026),
//   https://www.gesetze-im-internet.de/rwbestv_2026/
// - Vorläufiges Durchschnittsentgelt 2026: § 3 Abs. 2 SVBezGrV 2026
//   i. V. m. § 69 Abs. 2 Satz 1 Nr. 2 SGB VI (51.944 €)
// - Beitragsbemessungsgrenze allgemeine Rentenversicherung: § 4 Abs. 1 Nr. 1
//   SVBezGrV 2026 (101.400 € im Jahr) – kommt aus sozialversicherung.js
// - Entgeltpunkte: § 63 Abs. 2, § 70 Abs. 1 SGB VI
// - Beitragsbemessung nur bis zur Beitragsbemessungsgrenze: § 157 SGB VI
// - Rentenformel: § 64 SGB VI, Rentenartfaktor § 67 SGB VI
// - Zugangsfaktor: § 77 Abs. 2 SGB VI
// - Regelaltersgrenze: § 35 Satz 2, § 235 Abs. 2 SGB VI
// - Altersrente für langjährig Versicherte: § 36, § 236 SGB VI
// - Altersrente für besonders langjährig Versicherte: § 38, § 236b SGB VI
// - Rundung auf vier Dezimalstellen: § 121 Abs. 1 und 2 SGB VI
// - Beiträge der Rentner: § 247 Satz 1, § 249a Satz 1 SGB V,
//   § 55 Abs. 1 und 3 SGB XI, § 59 Abs. 1 Satz 1 SGB XI
//
// Diese Datei ist die einzige Stelle mit den Rentenwerten. Vorher standen
// Rentenwert und Durchschnittsentgelt doppelt in rentenpunkte.js und
// rentenrechner.js – beide auf dem Stand von 2024 und untereinander
// verschieden kommentiert.

import { BBG_RV_AV_JAHR, BEITRAGSSAETZE, krankenkasseArbeitnehmerSatz } from './sozialversicherung.js';

export const RENTEN_STAND = '2026-07-01';

/** Aktueller Rentenwert je Entgeltpunkt und Monat (§ 1 RWBestV 2026). */
export const AKTUELLER_RENTENWERT = 42.52;

/**
 * Vorläufiges Durchschnittsentgelt für 2026 (§ 3 Abs. 2 SVBezGrV 2026).
 *
 * § 70 Abs. 1 Satz 2 SGB VI schreibt für das Jahr des Rentenbeginns und das
 * Jahr davor genau diesen vorläufigen Wert vor.
 */
export const DURCHSCHNITTSENTGELT_VORLAEUFIG = 51944;

/** Beitragsbemessungsgrenze der allgemeinen Rentenversicherung im Jahr. */
export const BBG_RENTE_JAHR = BBG_RV_AV_JAHR;

/** Rentenartfaktor der Altersrenten (§ 67 Nr. 1 SGB VI). */
export const RENTENARTFAKTOR_ALTERSRENTE = 1.0;

/** Minderung des Zugangsfaktors je Monat vorzeitiger Inanspruchnahme (§ 77 Abs. 2 Nr. 2a SGB VI). */
export const ABSCHLAG_JE_MONAT = 0.003;

/** Erhöhung des Zugangsfaktors je Monat Aufschub (§ 77 Abs. 2 Nr. 2b SGB VI). */
export const ZUSCHLAG_JE_MONAT = 0.005;

/**
 * Frühestmöglicher Beginn einer Altersrente in Lebensmonaten.
 *
 * § 36 Satz 2 SGB VI: Die Altersrente für langjährig Versicherte kann nach
 * Vollendung des 63. Lebensjahres vorzeitig in Anspruch genommen werden. Das
 * ist zugleich die früheste Altersrente überhaupt. Nicht abgebildet sind die
 * Sonderfälle der Schwerbehinderung (§ 37, § 236a SGB VI) und der Altersteilzeit
 * älterer Jahrgänge (§ 236 Abs. 3 SGB VI), die früher beginnen können.
 */
export const FRUEHESTE_ALTERSRENTE_MONATE = 63 * 12;

/**
 * Höchstzahl der Entgeltpunkte, die in einem Jahr entstehen können.
 *
 * Beiträge werden nach § 157 SGB VI nur bis zur Beitragsbemessungsgrenze
 * erhoben. Ein Entgelt darüber erhöht die Rente nicht.
 */
export const MAX_ENTGELTPUNKTE_JAHR = runde4(BBG_RENTE_JAHR / DURCHSCHNITTSENTGELT_VORLAEUFIG);

/**
 * Entgeltpunkte für ein Beitragsjahr (§ 70 Abs. 1 Satz 1 SGB VI).
 *
 * Geteilt wird nicht das Bruttoentgelt, sondern die Beitragsbemessungs-
 * grundlage – also das Entgelt, soweit daraus Beiträge erhoben werden.
 *
 * @param {number} bruttoJahr Bruttoarbeitsentgelt des Jahres, in Euro
 * @returns {number} Entgeltpunkte auf vier Dezimalstellen
 */
export function entgeltpunkteAusJahresentgelt(bruttoJahr) {
  const brutto = Number.isFinite(bruttoJahr) ? Math.max(0, bruttoJahr) : 0;
  const beitragspflichtig = Math.min(brutto, BBG_RENTE_JAHR);
  return runde4(beitragspflichtig / DURCHSCHNITTSENTGELT_VORLAEUFIG);
}

/**
 * Regelaltersgrenze in Lebensmonaten (§ 35 Satz 2, § 235 Abs. 2 SGB VI).
 *
 * Bis Jahrgang 1946 liegt sie bei 65 Jahren und wird für die Jahrgänge 1947
 * bis 1958 um je einen Monat, ab 1959 um je zwei Monate angehoben, bis sie
 * ab Jahrgang 1964 bei 67 Jahren steht. Die Ausnahmen des § 235 Abs. 2 Satz 2
 * (Altersteilzeit, Anpassungsgeld im Bergbau) sind nicht abgebildet.
 *
 * @param {number} geburtsjahr Geburtsjahrgang
 * @returns {number} Alter in Monaten
 */
export function regelaltersgrenzeMonate(geburtsjahr) {
  const jahr = Math.trunc(geburtsjahr);
  if (jahr <= 1946) return 65 * 12;
  if (jahr <= 1958) return 65 * 12 + (jahr - 1946);
  if (jahr <= 1963) return 66 * 12 + (jahr - 1958) * 2;
  return 67 * 12;
}

/**
 * Altersgrenze für die abschlagsfreie Rente nach 45 Beitragsjahren
 * (§ 38 Nr. 1, § 236b Abs. 2 SGB VI).
 *
 * Bis Jahrgang 1952 liegt sie bei 63 Jahren und wird für die Jahrgänge 1953
 * bis 1963 um je zwei Monate angehoben, bis sie ab Jahrgang 1964 bei 65 Jahren
 * steht.
 *
 * @param {number} geburtsjahr Geburtsjahrgang
 * @returns {number} Alter in Monaten
 */
export function altersgrenzeBesondersLangjaehrigMonate(geburtsjahr) {
  const jahr = Math.trunc(geburtsjahr);
  if (jahr <= 1952) return 63 * 12;
  if (jahr <= 1963) return 63 * 12 + (jahr - 1952) * 2;
  return 65 * 12;
}

/**
 * Zugangsfaktor nach § 77 Abs. 2 SGB VI.
 *
 * Maßstab für den Abschlag ist die Regelaltersgrenze, für Versicherte mit
 * 45 Beitragsjahren dagegen das für sie maßgebende niedrigere Rentenalter des
 * § 236b SGB VI. Der Zuschlag entsteht dagegen in beiden Fällen erst für
 * Monate nach der Regelaltersgrenze – § 77 Abs. 2 Nr. 2b SGB VI knüpft ihn
 * ausdrücklich an sie. Zwischen beiden Grenzen bleibt der Zugangsfaktor
 * deshalb bei 1,0.
 *
 * @param {object} eingabe
 * @param {number} eingabe.geburtsjahr Geburtsjahrgang
 * @param {number} eingabe.rentenbeginnAlterMonate Alter bei Rentenbeginn in Monaten
 * @param {boolean} [eingabe.wartezeit45] 45 Jahre mit Beiträgen erfüllt (§ 51 Abs. 3a SGB VI)
 */
export function zugangsfaktor({ geburtsjahr, rentenbeginnAlterMonate, wartezeit45 = false }) {
  const regelgrenze = regelaltersgrenzeMonate(geburtsjahr);
  const grenze45 = altersgrenzeBesondersLangjaehrigMonate(geburtsjahr);

  const gewuenscht = Number.isFinite(rentenbeginnAlterMonate) ? rentenbeginnAlterMonate : regelgrenze;
  const beginn = Math.max(gewuenscht, FRUEHESTE_ALTERSRENTE_MONATE);
  const aufFruehestenBeginnAngehoben = beginn > gewuenscht;

  // Abschlagsfrei ist nur, wer die eigene Altersgrenze erreicht. Wer 45 Jahre
  // vorweisen kann, aber früher geht, bezieht eine Rente nach § 36 SGB VI und
  // wird an der Regelaltersgrenze gemessen wie alle anderen.
  const abschlagsfreiAb = wartezeit45 && beginn >= grenze45 ? grenze45 : regelgrenze;

  const monateVorzeitig = Math.max(0, abschlagsfreiAb - beginn);
  const monateAufgeschoben = Math.max(0, beginn - regelgrenze);

  const faktor = 1
    - monateVorzeitig * ABSCHLAG_JE_MONAT
    + monateAufgeschoben * ZUSCHLAG_JE_MONAT;

  return {
    zugangsfaktor: runde4(faktor),
    monateVorzeitig,
    monateAufgeschoben,
    regelaltersgrenzeMonate: regelgrenze,
    abschlagsfreiAbMonate: abschlagsfreiAb,
    rentenbeginnAlterMonate: beginn,
    aufFruehestenBeginnAngehoben,
  };
}

/**
 * Kranken- und Pflegeversicherungsbeitrag aus einer gesetzlichen Rente.
 *
 * Zwei Normen, die auf den ersten Blick dasselbe regeln, gehen hier
 * auseinander: Aus der Rente gilt nach § 247 Satz 1 SGB V der volle allgemeine
 * Beitragssatz, aber § 249a Satz 1 SGB V teilt ihn zwischen Rentner und
 * Rentenversicherungsträger – der Rentner zahlt also die Hälfte, wie ein
 * Arbeitnehmer. In der Pflegeversicherung ist es umgekehrt: § 59 Abs. 1 Satz 1
 * SGB XI weist die Beiträge aus der Rente dem Mitglied allein zu, hier trägt
 * der Rentner den vollen Satz des § 55 SGB XI.
 *
 * Der Abschlag für Kinder nach § 55 Abs. 3 Satz 4 SGB XI läuft mit dem
 * 25. Lebensjahr des Kindes aus und greift bei Altersrentnern praktisch nicht
 * mehr; die Elterneigenschaft selbst bleibt dagegen lebenslang und erspart
 * den Zuschlag für Kinderlose. Deshalb ist hier nur nach Elterneigenschaft
 * unterschieden, nicht nach der Zahl der Kinder.
 *
 * Die Einkommensteuer auf die Rente (§ 22 Nr. 1 Satz 3 Buchst. a
 * Doppelbuchst. aa EStG) ist nicht abgezogen – sie hängt von allen Einkünften
 * des Haushalts ab und lässt sich aus der Rente allein nicht bestimmen.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttorente Monatliche Bruttorente in Euro
 * @param {boolean} [eingabe.elternteil] Elterneigenschaft nach § 55 Abs. 3 SGB XI
 * @param {number} [eingabe.zusatzbeitrag] Zusatzbeitragssatz der Krankenkasse
 */
export function rentnerBeitraege({ bruttorente, elternteil = true, zusatzbeitrag }) {
  const rente = Number.isFinite(bruttorente) ? Math.max(0, bruttorente) : 0;

  const pflegesatz = elternteil
    ? BEITRAGSSAETZE.pflegeversicherung
    : BEITRAGSSAETZE.pflegeversicherung + BEITRAGSSAETZE.pflegeZuschlagKinderlose;

  const krankenversicherung = runde2(rente * krankenkasseArbeitnehmerSatz(zusatzbeitrag));
  const pflegeversicherung = runde2(rente * pflegesatz);

  return {
    krankenversicherung,
    pflegeversicherung,
    gesamt: runde2(krankenversicherung + pflegeversicherung),
    netto: runde2(rente - krankenversicherung - pflegeversicherung),
  };
}

/** Rundung auf vier Dezimalstellen nach § 121 Abs. 1 und 2 SGB VI. */
function runde4(wert) {
  return Math.round(wert * 1e4) / 1e4;
}

function runde2(betrag) {
  return Math.round(betrag * 100) / 100;
}
