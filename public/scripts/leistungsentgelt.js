// Leistungsentgelt nach § 153 SGB III – das pauschalierte Nettoentgelt
//
// Rechtsstand: 2026-01-01
// Primärquelle: § 153 SGB III
//   https://www.gesetze-im-internet.de/sgb_3/__153.html
//
// Das Leistungsentgelt ist die Grundlage für das Arbeitslosengeld (§ 149
// SGB III) und – über den Verweis in § 106 Abs. 1 Satz 6 SGB III – auch für
// das Kurzarbeitergeld. Beide Rechner leiten es aus dieser einen Stelle ab.
//
// Abzüge nach § 153 Abs. 1 Satz 2 sind die Sozialversicherungspauschale von
// 20 Prozent, die Lohnsteuer und der Solidaritätszuschlag. Die Pauschale ist
// pauschal und kennt deshalb keine Beitragsbemessungsgrenze; die
// Vorsorgepauschale innerhalb der Lohnsteuer dagegen schon.

import { jahreslohnsteuer, solidaritaetszuschlagJahr, STEUERKLASSEN } from './lohnsteuer.js';
import { PFLEGE_ARBEITNEHMER_GRUNDSATZ } from './sozialversicherung.js';

/** § 153 Abs. 1 Satz 2 Nr. 1 SGB III. */
export const SOZIALVERSICHERUNGSPAUSCHALE = 0.2;

/** § 154 Satz 2 SGB III – ein voller Kalendermonat ist mit 30 Tagen anzusetzen. */
export const TAGE_JE_MONAT = 30;

/** Kalendertage im Jahr, über die ein Jahresbetrag auf den Tag umgelegt wird. */
export const TAGE_JE_JAHR = 365;

/**
 * Leistungsentgelt für ein Jahr (§ 153 Abs. 1 SGB III).
 *
 * Kein Parameter für die Kinderzahl: § 153 Abs. 1 Satz 4 Nr. 3 SGB III
 * schreibt den Grundbeitragssatz des § 55 Abs. 1 Satz 1 SGB XI vor, also ohne
 * den Zuschlag für Kinderlose, den § 39b Abs. 2 Satz 5 Nr. 3c EStG beim
 * Lohnsteuerabzug umgekehrt sehr wohl berücksichtigt. Ob jemand Kinder hat,
 * wirkt sich allein auf den Leistungssatz aus.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bemessungsentgeltJahr Bemessungsentgelt im Jahr, in Euro
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @returns {number} Leistungsentgelt im Jahr, in Euro
 */
export function leistungsentgeltJahr({ bemessungsentgeltJahr, steuerklasse }) {
  pruefeSteuerklasse(steuerklasse);
  const entgelt = Number.isFinite(bemessungsentgeltJahr) ? Math.max(0, bemessungsentgeltJahr) : 0;
  if (entgelt === 0) return 0;

  const lohnsteuer = jahreslohnsteuer({
    jahresarbeitslohn: entgelt,
    steuerklasse,
    pflegesatz: PFLEGE_ARBEITNEHMER_GRUNDSATZ,
  });
  const soli = solidaritaetszuschlagJahr(lohnsteuer, steuerklasse);

  return Math.max(0, entgelt - entgelt * SOZIALVERSICHERUNGSPAUSCHALE - lohnsteuer - soli);
}

/**
 * Leistungsentgelt für einen Monat.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bemessungsentgeltMonat Bemessungsentgelt im Monat, in Euro
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @returns {number} Leistungsentgelt im Monat, in Euro
 */
export function leistungsentgeltMonat({ bemessungsentgeltMonat, steuerklasse }) {
  const monat = Number.isFinite(bemessungsentgeltMonat) ? Math.max(0, bemessungsentgeltMonat) : 0;
  return leistungsentgeltJahr({ bemessungsentgeltJahr: monat * 12, steuerklasse }) / 12;
}

/**
 * Leistungsentgelt für einen Kalendertag (§ 153 i. V. m. § 154 SGB III).
 *
 * @param {object} eingabe
 * @param {number} eingabe.bemessungsentgeltTag Bemessungsentgelt am Tag, in Euro
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @returns {number} Leistungsentgelt am Tag, in Euro
 */
export function leistungsentgeltTag({ bemessungsentgeltTag, steuerklasse }) {
  const tag = Number.isFinite(bemessungsentgeltTag) ? Math.max(0, bemessungsentgeltTag) : 0;
  return leistungsentgeltJahr({ bemessungsentgeltJahr: tag * TAGE_JE_JAHR, steuerklasse }) / TAGE_JE_JAHR;
}

function pruefeSteuerklasse(steuerklasse) {
  if (!STEUERKLASSEN.includes(steuerklasse)) {
    throw new Error(`Unbekannte Steuerklasse: ${steuerklasse}`);
  }
  return steuerklasse;
}
