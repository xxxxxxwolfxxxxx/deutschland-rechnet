// Einkommensteuer-Rechner: tarifliche und festzusetzende Einkommensteuer,
// Solidaritätszuschlag und Kirchensteuer aus dem Einkommen.
//
// Rechtsstand: Veranlagungszeitraum 2026, Wortlaut abgerufen am 16.09.2026
// auf gesetze-im-internet.de:
//   § 32a Abs. 1, 5, 6 EStG – Grund- und Splittingtarif (einkommensteuer.js)
//   § 2 Abs. 5 EStG        – zu versteuerndes Einkommen = Einkommen, vermindert
//                            um die Freibeträge nach § 32 Abs. 6
//   § 31 EStG              – Freistellung des Existenzminimums der Kinder
//                            entweder durch Kindergeld oder durch Freibeträge;
//                            bei Freibeträgen erhöht sich die tarifliche Steuer
//                            um den Kindergeldanspruch (Satz 4), bei nicht
//                            zusammenveranlagten Eltern im Umfang des
//                            Kinderfreibetrags
//   § 32 Abs. 6 S. 1, 2    – Freibeträge je Kind, verdoppelt bei
//                            Zusammenveranlagung (Werte in kindergeld.js)
//   § 66 Abs. 1 EStG       – Kindergeld je Monat (kindergeld.js)
//   § 51a Abs. 2 EStG,
//   § 3 Abs. 2 SolzG 1995  – Zuschlagsteuern bemessen sich immer nach der
//                            Steuer unter Abzug der Freibeträge nach § 32 Abs. 6
//   §§ 3, 4 SolzG 1995     – Freigrenzen und Milderungszone (lohnsteuer.js)
//   Kirchensteuersätze     – kirchensteuer.js
//
// Nicht abgebildet: Progressionsvorbehalt (§ 32b), Abgeltungsteuer (§ 32d),
// Tarifermäßigungen (§ 34 ff.), Steuerermäßigungen (§ 35 ff.), die Kappung der
// Kirchensteuer, Fälle, in denen ein Elternteil allein den vollen
// Kinderfreibetrag erhält, und Kinder, für die nicht im ganzen Jahr Kindergeld
// zusteht.

import { tariflicheEinkommensteuer } from './einkommensteuer.js';
import { solidaritaetszuschlag, SOLI_FREIGRENZE, SOLI_FREIGRENZE_SPLITTING } from './lohnsteuer.js';
import { berechneKirchensteuer } from './kirchensteuer.js';
import {
  KINDERGELD_MONAT,
  KINDERFREIBETRAG_JE_ELTERNTEIL,
  BEA_FREIBETRAG_JE_ELTERNTEIL,
} from './kindergeld.js';

/**
 * Wählbare Tarife.
 * `splitting`: § 32a Abs. 5 und 6 EStG, zugleich die höhere Soli-Freigrenze
 * nach § 3 Abs. 3 Satz 1 Nr. 1 SolzG.
 * `zusammenveranlagt`: §§ 26, 26b EStG – nur dann verdoppeln sich die
 * Kinderfreibeträge (§ 32 Abs. 6 Satz 2) und zählt der volle Kindergeldanspruch
 * (§ 31 Satz 4).
 */
export const TARIFE = Object.freeze({
  grund: { label: 'Grundtarif (Einzelveranlagung)', splitting: false, zusammenveranlagt: false },
  zusammen: { label: 'Splittingtarif (Zusammenveranlagung)', splitting: true, zusammenveranlagt: true },
  witwe: { label: 'Splittingtarif für Verwitwete (§ 32a Abs. 6 EStG)', splitting: true, zusammenveranlagt: false },
});

/** Schrittweite für den Grenzsteuersatz: Mehrsteuer auf die nächsten 100 €. */
export const GRENZSATZ_SCHRITT = 100;

const FREIBETRAG_JE_KIND_EINZELN = KINDERFREIBETRAG_JE_ELTERNTEIL + BEA_FREIBETRAG_JE_ELTERNTEIL;

const zahl = (wert) => (Number.isFinite(wert) ? Math.max(0, wert) : 0);
const aufCent = (betrag) => Math.round(betrag * 100) / 100;

function tarifOderFehler(tarif) {
  const t = TARIFE[tarif];
  if (!t) throw new Error(`Unbekannter Tarif: ${tarif}`);
  return t;
}

/**
 * Günstigerprüfung nach § 31 EStG.
 * Die Freibeträge werden abgezogen, wenn ihre Steuerentlastung den
 * angesetzten Kindergeldanspruch übersteigt – dann „bewirkt“ das Kindergeld
 * die Freistellung „nicht vollständig“ (Satz 4).
 */
function guenstigerpruefung(einkommen, kinder, t) {
  const faktor = t.zusammenveranlagt ? 2 : 1;
  const freibetraege = kinder * FREIBETRAG_JE_KIND_EINZELN * faktor;
  // § 31 Satz 4 Halbsatz 2: Bei nicht zusammenveranlagten Eltern zählt der
  // Anspruch nur im Umfang des (einfachen) Kinderfreibetrags, also zur Hälfte.
  const kindergeld = kinder * KINDERGELD_MONAT * 12 * (faktor / 2);
  const steuerOhne = tariflicheEinkommensteuer(einkommen, t.splitting);
  const steuerMit = tariflicheEinkommensteuer(Math.max(0, einkommen - freibetraege), t.splitting);
  const guenstiger = kinder > 0 && steuerOhne - steuerMit > kindergeld;
  return { freibetraege, kindergeld, steuerMit, guenstiger };
}

/**
 * @param {object} e
 * @param {number} e.einkommen Einkommen vor Kinderfreibeträgen (§ 2 Abs. 4 EStG);
 *   ohne Kinder ist das das zu versteuernde Einkommen
 * @param {keyof TARIFE} [e.tarif]
 * @param {number} [e.kinder] Kinder mit Kindergeldanspruch für das ganze Jahr
 * @param {boolean} [e.kirchensteuer] kirchensteuerpflichtig
 * @param {string} [e.bundesland] Kürzel für den Kirchensteuersatz
 */
export function berechneEinkommensteuer({
  einkommen,
  tarif = 'grund',
  kinder = 0,
  kirchensteuer = false,
  bundesland = 'NW',
}) {
  const t = tarifOderFehler(tarif);
  if (!Number.isInteger(kinder) || kinder < 0) {
    throw new Error(`Ungültige Kinderzahl: ${kinder}`);
  }
  const basis = zahl(einkommen);
  const pruefung = guenstigerpruefung(basis, kinder, t);

  const zvE = pruefung.guenstiger ? Math.max(0, basis - pruefung.freibetraege) : basis;
  const tariflicheSteuer = tariflicheEinkommensteuer(zvE, t.splitting);
  const hinzurechnungKindergeld = pruefung.guenstiger ? pruefung.kindergeld : 0;
  const steuer = tariflicheSteuer + hinzurechnungKindergeld;

  // § 51a Abs. 2 EStG und § 3 Abs. 2 SolzG: in allen Fällen mit Freibeträgen.
  const bemessungZuschlag = pruefung.steuerMit;
  const soli = solidaritaetszuschlag(bemessungZuschlag, t.splitting ? SOLI_FREIGRENZE_SPLITTING : SOLI_FREIGRENZE);
  const kirche = kirchensteuer
    ? berechneKirchensteuer({ lohnsteuerJahr: bemessungZuschlag, bundesland, konfession: 'rk' })
    : { kirchensteuerJahr: 0, satz: 0 };

  const mehrsteuer = tariflicheEinkommensteuer(zvE + GRENZSATZ_SCHRITT, t.splitting) - tariflicheSteuer;

  return {
    zvE,
    tarif,
    splitting: t.splitting,
    freibetraegeKinder: pruefung.freibetraege,
    kindergeldJahr: pruefung.kindergeld,
    freibetraegeGuenstiger: pruefung.guenstiger,
    tariflicheSteuer,
    hinzurechnungKindergeld,
    einkommensteuer: steuer,
    durchschnittssatz: zvE > 0 ? tariflicheSteuer / zvE : 0,
    grenzsteuersatz: Math.round((mehrsteuer / GRENZSATZ_SCHRITT) * 1000) / 1000,
    bemessungZuschlag,
    soli,
    kirchensteuer: kirche.kirchensteuerJahr,
    kirchensteuersatz: kirche.satz,
    gesamt: aufCent(steuer + soli + kirche.kirchensteuerJahr),
  };
}
