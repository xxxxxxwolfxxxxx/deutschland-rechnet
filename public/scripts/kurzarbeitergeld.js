// Kurzarbeitergeld nach §§ 95 ff. SGB III
//
// Rechtsstand: 2026-01-01
// Primärquellen:
// - § 96 SGB III   https://www.gesetze-im-internet.de/sgb_3/__96.html
// - § 104 SGB III  https://www.gesetze-im-internet.de/sgb_3/__104.html
// - § 105 SGB III  https://www.gesetze-im-internet.de/sgb_3/__105.html
// - § 106 SGB III  https://www.gesetze-im-internet.de/sgb_3/__106.html
// - § 153 SGB III  https://www.gesetze-im-internet.de/sgb_3/__153.html
// - 4. KugBeV      https://www.gesetze-im-internet.de/kugbev_4/
//
// Der Weg zum Kurzarbeitergeld führt über die Nettoentgeltdifferenz: Soll- und
// Ist-Entgelt werden getrennt in ein pauschaliertes Nettoentgelt umgerechnet,
// erst deren Differenz wird mit dem Leistungssatz multipliziert.
//
// Bis zum 11.08.2026 stand hier eine Tabelle fester Nettoanteile je
// Steuerklasse (0,698 für I, 0,778 für III …) ohne Rechtsgrundlage. Sie machte
// das pauschalierte Netto zu einem festen Prozentsatz des Bruttos und die
// Nettoentgeltdifferenz damit linear zum Arbeitsausfall. Die Lohnsteuer ist
// aber progressiv, und wegfallendes Entgelt fällt oben weg: Bei 3.500 € Brutto,
// Steuerklasse I und halbem Arbeitsausfall kam so ein Kurzarbeitergeld von
// 732,90 € heraus statt 620,90 €.
//
// Nicht abgebildet, weil § 106 SGB III dafür Angaben verlangt, die ein Rechner
// nicht kennen kann: Entgelt für Mehrarbeit und Einmalzahlungen bleiben nach
// § 106 Abs. 1 Sätze 2 und 4 außer Betracht, Nebeneinkommen erhöht nach
// § 106 Abs. 3 das Ist-Entgelt. Wer solche Bestandteile hat, gibt hier das
// bereits bereinigte Entgelt ein.
//
// Eine Kappung des Soll-Entgelts auf die Beitragsbemessungsgrenze findet nicht
// statt: § 106 SGB III kennt keine, und der Verweis in Absatz 1 Satz 6 betrifft
// nur § 153 über die Berechnung des Leistungsentgelts, nicht das
// Bemessungsentgelt des § 151.

import { STEUERKLASSEN } from './lohnsteuer.js';
import { leistungsentgeltMonat, SOZIALVERSICHERUNGSPAUSCHALE } from './leistungsentgelt.js';

export const KUG_STAND = '2026-01-01';

export { SOZIALVERSICHERUNGSPAUSCHALE };

/** § 105 Nr. 2 SGB III – Regelleistungssatz. */
export const LEISTUNGSSATZ = 0.6;

/** § 105 Nr. 1 SGB III – erhöhter Leistungssatz für Berechtigte mit Kind. */
export const LEISTUNGSSATZ_ERHOEHT = 0.67;

/** § 106 Abs. 1 Satz 5 SGB III – Soll- und Ist-Entgelt werden auf durch 20 teilbare Euro-Beträge gerundet. */
export const RUNDUNGSSTUFE = 20;

/** § 104 Abs. 1 Satz 1 SGB III – gesetzliche Bezugsdauer. */
export const BEZUGSDAUER_MONATE = 12;

/** § 1 der Vierten Kurzarbeitergeldbezugsdauerverordnung – verlängerte Bezugsdauer, längstens bis 31.12.2026. */
export const BEZUGSDAUER_MONATE_VERLAENGERT = 24;

/** § 2 der Vierten Kurzarbeitergeldbezugsdauerverordnung. */
export const BEZUGSDAUER_VERLAENGERUNG_BIS = '2026-12-31';

/**
 * § 96 Abs. 1 Satz 1 Nr. 4 SGB III – Anteil der Beschäftigten, die von einem
 * Entgeltausfall betroffen sein müssen.
 *
 * Ein Drittel, nicht ein Zehntel: Die Absenkung auf 10 Prozent war eine
 * befristete Verordnung nach § 109 Abs. 5 Nr. 1 SGB III und ist ausgelaufen.
 */
export const MINDESTANTEIL_BETROFFENE = 1 / 3;

/** § 96 Abs. 1 Satz 1 Nr. 4 SGB III – Entgeltausfall der Betroffenen. */
export const MINDEST_ENTGELTAUSFALL = 0.1;

/**
 * Rundung des Soll- oder Ist-Entgelts nach § 106 Abs. 1 Satz 5 SGB III.
 *
 * @param {number} entgelt Bruttoarbeitsentgelt im Monat, in Euro
 * @returns {number} auf den nächsten durch 20 teilbaren Euro-Betrag gerundet
 */
export function rundeEntgelt(entgelt) {
  const betrag = Number.isFinite(entgelt) ? Math.max(0, entgelt) : 0;
  return Math.round(betrag / RUNDUNGSSTUFE) * RUNDUNGSSTUFE;
}

/**
 * Pauschaliertes Nettoentgelt nach § 153 SGB III, den § 106 Abs. 1 Satz 6
 * SGB III für das Kurzarbeitergeld für entsprechend anwendbar erklärt.
 *
 * Abzüge sind die Sozialversicherungspauschale von 20 Prozent, die Lohnsteuer
 * und der Solidaritätszuschlag. Die Sozialversicherungspauschale ist pauschal
 * und kennt deshalb keine Beitragsbemessungsgrenze; die Vorsorgepauschale
 * innerhalb der Lohnsteuer dagegen schon.
 *
 * Kein Parameter für die Kinderzahl: § 153 Abs. 1 Satz 4 Nr. 3 SGB III schreibt
 * den Grundbeitragssatz des § 55 Abs. 1 Satz 1 SGB XI vor, also ohne den
 * Zuschlag für Kinderlose. Ob jemand Kinder hat, wirkt sich allein auf den
 * Leistungssatz aus.
 *
 * @param {object} eingabe
 * @param {number} eingabe.entgeltMonat Bruttoarbeitsentgelt im Monat, in Euro
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @returns {number} pauschaliertes Nettoentgelt im Monat, in Euro
 */
export function pauschaliertesNettoentgelt({ entgeltMonat, steuerklasse }) {
  pruefeSteuerklasse(steuerklasse);
  return leistungsentgeltMonat({ bemessungsentgeltMonat: entgeltMonat, steuerklasse });
}

/**
 * Kurzarbeitergeld für einen Anspruchszeitraum, also einen Kalendermonat.
 *
 * @param {object} eingabe
 * @param {number} eingabe.sollEntgelt Bruttoentgelt ohne den Arbeitsausfall, in
 *   Euro im Monat, ohne Entgelt für Mehrarbeit und ohne Einmalzahlungen
 * @param {number} [eingabe.istEntgelt] tatsächlich erzieltes Bruttoentgelt; ohne
 *   Angabe aus ausfallProzent abgeleitet
 * @param {number} [eingabe.ausfallProzent] Anteil des ausgefallenen Entgelts in
 *   Prozent; wird auf 0 bis 100 begrenzt
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @param {boolean} [eingabe.hatKind] erhöhter Leistungssatz nach § 105 Nr. 1
 *   SGB III i. V. m. § 149 Nr. 1 SGB III
 */
export function berechneKurzarbeitergeld({
  sollEntgelt,
  istEntgelt,
  ausfallProzent = 100,
  steuerklasse = 1,
  hatKind = false,
}) {
  pruefeSteuerklasse(steuerklasse);

  const soll = rundeEntgelt(sollEntgelt);
  const ist = rundeEntgelt(
    istEntgelt === undefined
      ? soll * (1 - begrenzeAnteil(ausfallProzent) / 100)
      : Math.min(istEntgelt, soll)
  );

  const sollNetto = pauschaliertesNettoentgelt({ entgeltMonat: soll, steuerklasse });
  const istNetto = pauschaliertesNettoentgelt({ entgeltMonat: ist, steuerklasse });
  const nettoentgeltdifferenz = Math.max(0, sollNetto - istNetto);

  const leistungssatz = hatKind ? LEISTUNGSSATZ_ERHOEHT : LEISTUNGSSATZ;
  const kurzarbeitergeld = nettoentgeltdifferenz * leistungssatz;
  const gesamtNetto = istNetto + kurzarbeitergeld;

  return {
    sollEntgelt: soll,
    istEntgelt: ist,
    ausfallProzent: soll === 0 ? 0 : ((soll - ist) / soll) * 100,
    sollNetto: runde(sollNetto),
    istNetto: runde(istNetto),
    nettoentgeltdifferenz: runde(nettoentgeltdifferenz),
    leistungssatz,
    kurzarbeitergeld: runde(kurzarbeitergeld),
    gesamtNetto: runde(gesamtNetto),
    verlust: runde(sollNetto - gesamtNetto),
  };
}

function pruefeSteuerklasse(steuerklasse) {
  if (!STEUERKLASSEN.includes(steuerklasse)) {
    throw new Error(`Unbekannte Steuerklasse: ${steuerklasse}`);
  }
  return steuerklasse;
}

function begrenzeAnteil(prozent) {
  const wert = Number.isFinite(prozent) ? prozent : 0;
  return Math.min(100, Math.max(0, wert));
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}
