// Elterngeld nach dem BEEG
//
// Rechtsstand: 2026-01-01
// Primärquellen:
// - § 1 BEEG   https://www.gesetze-im-internet.de/beeg/__1.html
// - § 2 BEEG   https://www.gesetze-im-internet.de/beeg/__2.html
// - § 2a BEEG  https://www.gesetze-im-internet.de/beeg/__2a.html
// - § 2c BEEG  https://www.gesetze-im-internet.de/beeg/__2c.html
// - § 2e BEEG  https://www.gesetze-im-internet.de/beeg/__2e.html
// - § 2f BEEG  https://www.gesetze-im-internet.de/beeg/__2f.html
// - § 4 BEEG   https://www.gesetze-im-internet.de/beeg/__4.html
// - § 4a BEEG  https://www.gesetze-im-internet.de/beeg/__4a.html
//
// Der Weg zum Elterngeld: Aus den Einnahmen wird das Erwerbseinkommen nach
// §§ 2c bis 2f gebildet – Einnahmen abzüglich des anteiligen
// Arbeitnehmer-Pauschbetrags, der Steuern und pauschaler Sozialabgaben. Darauf
// wird die nach § 2 Abs. 2 gestaffelte Ersatzrate angewandt, das Ergebnis auf
// 300 bis 1.800 Euro begrenzt und um die Zuschläge des § 2a erhöht.
//
// Bis zum 11.08.2026 bestand dieses Modul aus sieben Zeilen: 67 Prozent eines
// entgegengenommenen "Nettos", begrenzt auf 300 bis 1.800 Euro, Elterngeld Plus
// pauschal die Hälfte. Der feste Satz von 67 Prozent war für normale Einkommen
// schlicht falsch – die Absenkung nach § 2 Abs. 2 Satz 2 erreicht ihren Boden
// von 65 Prozent schon bei 1.240 Euro Einkommen. Geschwisterbonus und
// Mehrlingszuschlag fehlten ganz, und die Hälfte ist bei Elterngeld Plus nach
// § 4a Abs. 2 Satz 2 die Obergrenze, nicht der Betrag.
//
// Nicht abgebildet: das Einkommen aus selbstständiger Erwerbstätigkeit nach
// § 2d, die Verschiebung des Bemessungszeitraums nach § 2b Abs. 1 Satz 2 und
// die Anrechnung von Mutterschaftsleistungen und anderen Einnahmen nach § 3.
// Wer solche Bestandteile hat, erhält hier einen Näherungswert.

import {
  ARBEITNEHMER_PAUSCHBETRAG,
  jahreslohnsteuer,
  solidaritaetszuschlagJahr,
} from './lohnsteuer.js';
import { PFLEGE_ARBEITNEHMER_GRUNDSATZ } from './sozialversicherung.js';

export const ELTERNGELD_STAND = '2026-01-01';

/** § 2 Abs. 1 Satz 2 BEEG. */
export const HOECHSTBETRAG = 1800;

/** § 2 Abs. 4 Satz 1 BEEG. */
export const MINDESTBETRAG = 300;

/** § 2 Abs. 1 Satz 1 BEEG – Regelersatzrate. */
export const SATZ_REGEL = 0.67;

/** § 2 Abs. 2 Satz 2 BEEG – Untergrenze der Absenkung. */
export const SATZ_MIN = 0.65;

/** § 2 Abs. 2 Satz 1 BEEG – Obergrenze der Anhebung. */
export const SATZ_MAX = 1;

/** § 2 Abs. 2 Satz 1 BEEG – darunter steigt die Ersatzrate. */
export const GERINGVERDIENER_GRENZE = 1000;

/** § 2 Abs. 2 Satz 2 BEEG – darüber sinkt die Ersatzrate. */
export const ABSENKUNGS_GRENZE = 1200;

/** § 2 Abs. 2 BEEG – 0,1 Prozentpunkte … */
export const SATZ_SCHRITT = 0.001;

/** … § 2 Abs. 2 BEEG – … für je 2 Euro. */
export const EINKOMMEN_SCHRITT = 2;

/** § 2 Abs. 3 Satz 2 BEEG – Obergrenze des vorgeburtlichen Einkommens beim Unterschiedsbetrag. */
export const KAPPUNG_VORGEBURTLICH = 2770;

/**
 * § 2f Abs. 1 Satz 2 BEEG – Beitragssatzpauschalen.
 *
 * Pauschalen, keine echten Beitragssätze: Das Gesetz rechnet mit runden 9, 10
 * und 2 Prozent, und nach Absatz 3 bleiben andere Maßgaben zur Bestimmung der
 * Beitragsbemessungsgrundlagen außer Betracht. Deshalb wirkt hier – anders als
 * beim Leistungsentgelt des § 153 SGB III – keine Beitragsbemessungsgrenze.
 */
export const SOZIALABGABEN_PAUSCHALEN = {
  krankenPflege: 0.09,
  rente: 0.10,
  arbeitsfoerderung: 0.02,
};

/** § 2e Abs. 5 Satz 1 BEEG – Kirchensteuer wird pauschal mit 8 Prozent angesetzt. */
export const KIRCHENSTEUERSATZ = 0.08;

/** § 2a Abs. 1 Satz 1 BEEG. */
export const GESCHWISTERBONUS_SATZ = 0.1;
export const GESCHWISTERBONUS_MINDESTBETRAG = 75;

/** § 2a Abs. 4 Satz 1 BEEG – je zweitem und weiterem Kind einer Mehrlingsgeburt. */
export const MEHRLINGSZUSCHLAG = 300;

/**
 * § 1 Abs. 8 BEEG – oberhalb dieses zu versteuernden Einkommens entfällt der
 * Anspruch. Die Grenze lag früher bei 300.000, dann 250.000 und 200.000 Euro.
 */
export const EINKOMMENSGRENZE = 175000;

/** § 4 Abs. 3 Satz 1 BEEG – gemeinsamer Anspruch der Eltern. */
export const BASISMONATE = 12;

/** § 4 Abs. 3 Satz 2 BEEG. */
export const PARTNERMONATE = 2;

/** § 4b Abs. 2 Satz 1 BEEG – je Elternteil. */
export const PARTNERSCHAFTSBONUS_MONATE = 4;

/** § 4 Abs. 5 Satz 1 BEEG – verlängerter Anspruch bei Frühgeburten. */
export const BASISMONATE_FRUEHGEBURT = [
  { wochenVorher: 6, monate: 13 },
  { wochenVorher: 8, monate: 14 },
  { wochenVorher: 12, monate: 15 },
  { wochenVorher: 16, monate: 16 },
];

/** § 4 Abs. 3 Satz 3 BEEG – ein Basismonat entspricht zwei Monaten Elterngeld Plus. */
const PLUSMONATE_JE_BASISMONAT = 2;

/** § 4a Abs. 2 Satz 2 BEEG – Elterngeld Plus beträgt höchstens die Hälfte. */
const PLUS_ANTEIL = 0.5;

/** § 2e Abs. 3 Satz 1 Halbsatz 2 BEEG – die Steuerklasse VI bleibt unberücksichtigt. */
const STEUERKLASSEN_BEEG = [1, 2, 3, 4, 5];

/**
 * Erwerbseinkommen nach §§ 2c, 2e und 2f BEEG, umgangssprachlich das
 * "Elterngeld-Netto".
 *
 * Es ist nicht das Netto der Gehaltsabrechnung. Abgezogen werden nach § 2c
 * Abs. 1 Satz 1 ein Zwölftel des Arbeitnehmer-Pauschbetrags, nach § 2e die
 * Steuern auf Grundlage des Programmablaufplans und nach § 2f pauschale
 * Sozialabgaben von zusammen 21 Prozent.
 *
 * Kein Parameter für die Kinderzahl: § 2e Abs. 2 Satz 2 Nr. 2 bestimmt die
 * Vorsorgepauschale ausdrücklich ohne die besonderen Regelungen des § 55 Abs. 3
 * SGB XI, also ohne Zuschlag für Kinderlose und ohne Abschläge für Eltern.
 *
 * @param {object} eingabe
 * @param {number} eingabe.einnahmenMonat monatlich durchschnittliche Einnahmen aus
 *   nichtselbstständiger Arbeit, ohne sonstige Bezüge (§ 2c Abs. 1 Satz 2 BEEG)
 * @param {number} eingabe.steuerklasse 1 bis 5
 * @param {boolean} [eingabe.kirchensteuer] Kirchensteuerpflicht (§ 2e Abs. 1 Satz 1 BEEG)
 * @returns {number} Einkommen aus Erwerbstätigkeit im Monat, in Euro, nie negativ
 */
export function elterngeldNetto({ einnahmenMonat, steuerklasse, kirchensteuer = false }) {
  pruefeSteuerklasse(steuerklasse);
  const einnahmen = Number.isFinite(einnahmenMonat) ? Math.max(0, einnahmenMonat) : 0;
  if (einnahmen === 0) return 0;

  const lohnsteuer = jahreslohnsteuer({
    jahresarbeitslohn: einnahmen * 12,
    steuerklasse,
    pflegesatz: PFLEGE_ARBEITNEHMER_GRUNDSATZ,
  });
  const soli = solidaritaetszuschlagJahr(lohnsteuer, steuerklasse);
  const kirche = kirchensteuer ? lohnsteuer * KIRCHENSTEUERSATZ : 0;
  const steuernMonat = (lohnsteuer + soli + kirche) / 12;

  const sozialabgaben = einnahmen * (
    SOZIALABGABEN_PAUSCHALEN.krankenPflege
    + SOZIALABGABEN_PAUSCHALEN.rente
    + SOZIALABGABEN_PAUSCHALEN.arbeitsfoerderung
  );

  return Math.max(0, einnahmen - ARBEITNEHMER_PAUSCHBETRAG / 12 - steuernMonat - sozialabgaben);
}

/**
 * Ersatzrate nach § 2 Abs. 1 Satz 1 und Abs. 2 BEEG.
 *
 * Sie beträgt im Regelfall 67 Prozent, steigt unterhalb von 1.000 Euro um
 * 0,1 Prozentpunkte je volle 2 Euro Unterschreitung auf bis zu 100 Prozent und
 * sinkt oberhalb von 1.200 Euro nach derselben Staffel auf bis zu 65 Prozent.
 * Der Boden ist deshalb schon bei 1.240 Euro erreicht.
 *
 * @param {number} einkommen Einkommen aus Erwerbstätigkeit vor der Geburt, im Monat
 * @returns {number} Ersatzrate zwischen 0,65 und 1
 */
export function ersatzrate(einkommen) {
  const wert = Number.isFinite(einkommen) ? Math.max(0, einkommen) : 0;

  if (wert < GERINGVERDIENER_GRENZE) {
    const schritte = Math.floor((GERINGVERDIENER_GRENZE - wert) / EINKOMMEN_SCHRITT);
    return Math.min(SATZ_MAX, SATZ_REGEL + schritte * SATZ_SCHRITT);
  }
  if (wert > ABSENKUNGS_GRENZE) {
    const schritte = Math.floor((wert - ABSENKUNGS_GRENZE) / EINKOMMEN_SCHRITT);
    return Math.max(SATZ_MIN, SATZ_REGEL - schritte * SATZ_SCHRITT);
  }
  return SATZ_REGEL;
}

/**
 * Basiselterngeld nach §§ 2 und 2a BEEG.
 *
 * @param {object} eingabe
 * @param {number} eingabe.einnahmenMonat Einnahmen vor der Geburt, im Monat
 * @param {number} eingabe.steuerklasse 1 bis 5
 * @param {boolean} [eingabe.kirchensteuer]
 * @param {number} [eingabe.einnahmenBezugMonat] Einnahmen während des Bezugs; ohne
 *   Angabe wird von keinem Einkommen ausgegangen (§ 2 Abs. 1 Satz 2 BEEG)
 * @param {boolean} [eingabe.geschwisterbonus] Voraussetzungen des § 2a Abs. 1 BEEG
 * @param {number} [eingabe.kinderZahl] Zahl der Kinder einer Mehrlingsgeburt
 */
export function basiselterngeld({
  einnahmenMonat,
  steuerklasse,
  kirchensteuer = false,
  einnahmenBezugMonat,
  geschwisterbonus = false,
  kinderZahl = 1,
}) {
  const einkommen = elterngeldNetto({ einnahmenMonat, steuerklasse, kirchensteuer });
  const satz = ersatzrate(einkommen);

  const hatBezugseinkommen = einnahmenBezugMonat !== undefined;
  const einkommenBezug = hatBezugseinkommen
    ? elterngeldNetto({ einnahmenMonat: einnahmenBezugMonat, steuerklasse, kirchensteuer })
    : 0;

  // § 2 Abs. 3 Satz 1 und 2 BEEG: Bei Einkommen während des Bezugs tritt der
  // Unterschiedsbetrag an die Stelle des Einkommens, und das vorgeburtliche
  // Einkommen ist dabei höchstens mit 2.770 Euro anzusetzen.
  const bemessung = hatBezugseinkommen
    ? Math.max(0, Math.min(einkommen, KAPPUNG_VORGEBURTLICH) - einkommenBezug)
    : einkommen;

  const ausFormel = bemessung * satz;
  const nachGrenzen = Math.min(HOECHSTBETRAG, Math.max(MINDESTBETRAG, ausFormel));

  return {
    einkommen: runde(einkommen),
    einkommenBezug: hatBezugseinkommen ? runde(einkommenBezug) : null,
    ersatzrate: satz,
    ...mitZuschlaegen(runde(nachGrenzen), { geschwisterbonus, kinderZahl }),
  };
}

/**
 * Elterngeld Plus nach § 4a Abs. 2 BEEG.
 *
 * Es wird wie das Basiselterngeld ermittelt, beträgt aber höchstens die Hälfte
 * des Basiselterngeldes, das ohne Einkommen während des Bezugs zustünde. Ohne
 * Teilzeiteinkommen ist es deshalb genau die Hälfte, mit Teilzeiteinkommen
 * liegt es meist darunter. Die Mindestbeträge halbieren sich nach Satz 3.
 *
 * @param {object} eingabe siehe basiselterngeld
 */
export function elterngeldPlus({
  einnahmenMonat,
  steuerklasse,
  kirchensteuer = false,
  einnahmenBezugMonat,
  geschwisterbonus = false,
  kinderZahl = 1,
}) {
  const ohneEinkommen = basiselterngeld({
    einnahmenMonat, steuerklasse, kirchensteuer, geschwisterbonus, kinderZahl,
  });
  const deckel = ausCent(Math.round(inCent(ohneEinkommen.betrag) * PLUS_ANTEIL));

  const einkommen = elterngeldNetto({ einnahmenMonat, steuerklasse, kirchensteuer });
  const satz = ersatzrate(einkommen);
  const einkommenBezug = einnahmenBezugMonat === undefined
    ? 0
    : elterngeldNetto({ einnahmenMonat: einnahmenBezugMonat, steuerklasse, kirchensteuer });
  const bemessung = einnahmenBezugMonat === undefined
    ? einkommen
    : Math.max(0, Math.min(einkommen, KAPPUNG_VORGEBURTLICH) - einkommenBezug);

  const ausFormel = bemessung * satz;
  const nachGrenzen = Math.max(MINDESTBETRAG * PLUS_ANTEIL, ausFormel);
  const mitBonus = mitZuschlaegen(runde(Math.min(HOECHSTBETRAG, nachGrenzen)), {
    geschwisterbonus, kinderZahl, anteil: PLUS_ANTEIL,
  });

  return {
    einkommen: runde(einkommen),
    einkommenBezug: einnahmenBezugMonat === undefined ? null : runde(einkommenBezug),
    ersatzrate: satz,
    betrag: Math.min(mitBonus.betrag, deckel),
    geschwisterbonus: mitBonus.geschwisterbonus,
    mehrlingszuschlag: mitBonus.mehrlingszuschlag,
    istGedeckelt: mitBonus.betrag > deckel,
  };
}

/**
 * Elterngeld im Überblick: Basiselterngeld, Elterngeld Plus und Bezugsdauer.
 *
 * @param {object} eingabe siehe basiselterngeld
 * @param {number} [eingabe.wochenVorTermin] Wochen zwischen tatsächlicher Geburt und
 *   voraussichtlichem Entbindungstermin (§ 4 Abs. 5 BEEG)
 * @param {number} [eingabe.zvE] zu versteuerndes Einkommen im letzten abgeschlossenen
 *   Veranlagungszeitraum vor der Geburt (§ 1 Abs. 8 BEEG)
 */
export function berechneElterngeld({
  einnahmenMonat,
  steuerklasse = 1,
  kirchensteuer = false,
  einnahmenBezugMonat,
  geschwisterbonus = false,
  kinderZahl = 1,
  wochenVorTermin = 0,
  zvE,
}) {
  pruefeSteuerklasse(steuerklasse);

  const eingabe = {
    einnahmenMonat, steuerklasse, kirchensteuer, einnahmenBezugMonat, geschwisterbonus, kinderZahl,
  };
  const basis = basiselterngeld(eingabe);
  const plus = elterngeldPlus(eingabe);
  const monate = basismonate(wochenVorTermin);

  const hatAnspruch = zvE === undefined || zvE <= EINKOMMENSGRENZE;

  return {
    einkommen: basis.einkommen,
    einkommenBezug: basis.einkommenBezug,
    ersatzrate: basis.ersatzrate,
    basiselterngeld: hatAnspruch ? basis.betrag : 0,
    elterngeldPlus: hatAnspruch ? plus.betrag : 0,
    geschwisterbonus: hatAnspruch ? basis.geschwisterbonus : 0,
    mehrlingszuschlag: hatAnspruch ? basis.mehrlingszuschlag : 0,
    basismonate: monate,
    basismonateMitPartner: monate + PARTNERMONATE,
    plusmonateMitPartner: (monate + PARTNERMONATE) * PLUSMONATE_JE_BASISMONAT,
    partnerschaftsbonusMonate: PARTNERSCHAFTSBONUS_MONATE,
    gesamtBasis: hatAnspruch ? runde(basis.betrag * monate) : 0,
    hatAnspruch,
    einkommensgrenzeUeberschritten: !hatAnspruch,
  };
}

/**
 * Zahl der Monatsbeträge Basiselterngeld nach § 4 Abs. 3 Satz 1 und Abs. 5 BEEG.
 *
 * @param {number} wochenVorTermin Wochen vor dem voraussichtlichen Entbindungstermin
 * @returns {number} Monatsbeträge
 */
function basismonate(wochenVorTermin) {
  const wochen = Number.isFinite(wochenVorTermin) ? Math.max(0, wochenVorTermin) : 0;
  return BASISMONATE_FRUEHGEBURT.reduce(
    (beste, stufe) => (wochen >= stufe.wochenVorher ? Math.max(beste, stufe.monate) : beste),
    BASISMONATE
  );
}

/**
 * Zuschläge nach § 2a BEEG. Sie treten neben den Höchstbetrag des § 2 Abs. 1
 * Satz 2 BEEG und werden nicht von ihm gekappt.
 *
 * Gerechnet wird in Cent, ausgehend vom bereits auf Cent gerundeten Elterngeld:
 * Sonst weicht die ausgewiesene Summe von dem ab, was ein Leser erhält, der die
 * angezeigten Einzelbeträge addiert.
 *
 * @param {number} betrag auf Cent gerundetes Elterngeld nach § 2 BEEG
 * @param {object} eingabe
 * @param {number} [eingabe.anteil] 0,5 für Elterngeld Plus (§ 4a Abs. 2 Satz 3 BEEG)
 */
function mitZuschlaegen(betrag, { geschwisterbonus, kinderZahl, anteil = 1 }) {
  const betragCent = inCent(betrag);
  const bonusCent = geschwisterbonus
    ? Math.max(
      Math.round(inCent(GESCHWISTERBONUS_MINDESTBETRAG) * anteil),
      Math.round(betragCent * GESCHWISTERBONUS_SATZ)
    )
    : 0;
  const weitereKinder = Math.max(0, (Number.isFinite(kinderZahl) ? kinderZahl : 1) - 1);
  const mehrlingeCent = Math.round(weitereKinder * inCent(MEHRLINGSZUSCHLAG) * anteil);

  return {
    geschwisterbonus: ausCent(bonusCent),
    mehrlingszuschlag: ausCent(mehrlingeCent),
    betrag: ausCent(betragCent + bonusCent + mehrlingeCent),
  };
}

function pruefeSteuerklasse(steuerklasse) {
  if (!STEUERKLASSEN_BEEG.includes(steuerklasse)) {
    throw new Error(`Für das Elterngeld nicht verwendbare Steuerklasse: ${steuerklasse}`);
  }
  return steuerklasse;
}

function inCent(betrag) {
  return Math.round(betrag * 100);
}

function ausCent(cent) {
  return cent / 100;
}

function runde(betrag) {
  return ausCent(inCent(betrag));
}
