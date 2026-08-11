// Arbeitslosengeld nach dem SGB III
//
// Rechtsstand: 2026-01-01
// Primärquellen:
// - § 147 SGB III  https://www.gesetze-im-internet.de/sgb_3/__147.html
// - § 149 SGB III  https://www.gesetze-im-internet.de/sgb_3/__149.html
// - § 151 SGB III  https://www.gesetze-im-internet.de/sgb_3/__151.html
// - § 153 SGB III  https://www.gesetze-im-internet.de/sgb_3/__153.html
// - § 154 SGB III  https://www.gesetze-im-internet.de/sgb_3/__154.html
//
// Der Weg nach § 149 SGB III: Aus dem beitragspflichtigen Bruttoentgelt wird
// das Bemessungsentgelt je Kalendertag gebildet (§ 151), daraus das
// pauschalierte Nettoentgelt – das Leistungsentgelt nach § 153 –, und davon
// sind 60 beziehungsweise 67 Prozent das Arbeitslosengeld. Gezahlt wird je
// Kalendertag; ein voller Monat zählt 30 Tage (§ 154).
//
// Bis zum 11.08.2026 rechnete dieses Modul etwas anderes: Bemessungsentgelt =
// Brutto minus Sozialabgaben, davon 60 Prozent. Zusätzlich waren die
// Sozialabgaben mit den Gesamtbeitragssätzen statt den Arbeitnehmeranteilen
// angesetzt – 18,6 statt 9,3 Prozent Rentenversicherung, 14,6 statt 7,3 plus
// halbem Zusatzbeitrag, 2,6 statt 1,3 Prozent Arbeitslosenversicherung –, und
// die Beitragsbemessungsgrenzen waren die von 2025. Die Steuerklasse wurde
// entgegengenommen und ignoriert, obwohl § 153 Abs. 2 SGB III sie
// vorschreibt; die exportierten SK_FAKTOREN waren toter Code. Auch der
// Verweis auf "§ 129 SGB III" für die Leistungssätze stimmte nicht, das ist
// die Nummerierung vor 2012.
//
// Nicht abgebildet: die fiktive Bemessung nach § 152 SGB III, das Ruhen bei
// Entlassungsentschädigung (§ 158) oder Sperrzeit (§ 159) und die Anrechnung
// von Nebeneinkommen (§ 155).

import { STEUERKLASSEN } from './lohnsteuer.js';
import { BBG_RV_AV_MONAT } from './sozialversicherung.js';
import { leistungsentgeltTag, TAGE_JE_MONAT, TAGE_JE_JAHR } from './leistungsentgelt.js';

export const ALG_STAND = '2026-01-01';

export { TAGE_JE_MONAT, TAGE_JE_JAHR };

/** § 149 Nr. 2 SGB III – allgemeiner Leistungssatz. */
export const LEISTUNGSSATZ = 0.6;

/** § 149 Nr. 1 SGB III – erhöhter Leistungssatz für Arbeitslose mit Kind. */
export const LEISTUNGSSATZ_ERHOEHT = 0.67;

/**
 * Dauer des Anspruchs nach § 147 Abs. 2 SGB III.
 *
 * Die längeren Stufen setzen beides voraus: die Versicherungszeit und das
 * vollendete Lebensalter.
 */
export const ANSPRUCHSDAUER = [
  { versicherungsmonate: 12, mindestalter: 0, dauer: 6 },
  { versicherungsmonate: 16, mindestalter: 0, dauer: 8 },
  { versicherungsmonate: 20, mindestalter: 0, dauer: 10 },
  { versicherungsmonate: 24, mindestalter: 0, dauer: 12 },
  { versicherungsmonate: 30, mindestalter: 50, dauer: 15 },
  { versicherungsmonate: 36, mindestalter: 55, dauer: 18 },
  { versicherungsmonate: 48, mindestalter: 58, dauer: 24 },
];

/** Dauer bei kurzer Anwartschaftszeit nach § 147 Abs. 3 SGB III, unabhängig vom Alter. */
export const ANSPRUCHSDAUER_KURZE_ANWARTSCHAFT = [
  { versicherungsmonate: 6, dauer: 3 },
  { versicherungsmonate: 8, dauer: 4 },
  { versicherungsmonate: 10, dauer: 5 },
];

/**
 * Dauer des Anspruchs auf Arbeitslosengeld in Monaten (§ 147 SGB III).
 *
 * @param {object} eingabe
 * @param {number} eingabe.versicherungsmonate Monate mit Versicherungspflichtverhältnis
 *   innerhalb der erweiterten Rahmenfrist
 * @param {number} eingabe.alter bei Entstehung des Anspruchs vollendetes Lebensjahr
 * @param {boolean} [eingabe.kurzeAnwartschaft] Anwartschaftszeit nach § 142 Abs. 2 SGB III
 * @returns {number} Anspruchsdauer in Monaten, 0 wenn kein Anspruch besteht
 */
export function anspruchsdauer({ versicherungsmonate, alter, kurzeAnwartschaft = false }) {
  const monate = Number.isFinite(versicherungsmonate) ? Math.max(0, versicherungsmonate) : 0;
  const lebensalter = Number.isFinite(alter) ? Math.max(0, alter) : 0;

  const tabelle = kurzeAnwartschaft
    ? ANSPRUCHSDAUER_KURZE_ANWARTSCHAFT.map(s => ({ ...s, mindestalter: 0 }))
    : ANSPRUCHSDAUER;

  return tabelle.reduce(
    (beste, stufe) =>
      monate >= stufe.versicherungsmonate && lebensalter >= stufe.mindestalter
        ? Math.max(beste, stufe.dauer)
        : beste,
    0
  );
}

/**
 * Bemessungsentgelt je Kalendertag (§ 151 Abs. 1 SGB III).
 *
 * Maßgeblich ist das beitragspflichtige Arbeitsentgelt. Deshalb wirkt die
 * Beitragsbemessungsgrenze der Arbeitsförderung als Obergrenze.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttoMonat Bruttoarbeitsentgelt im Monat, in Euro
 * @returns {number} Bemessungsentgelt je Kalendertag, in Euro
 */
export function bemessungsentgeltTag({ bruttoMonat }) {
  const brutto = Number.isFinite(bruttoMonat) ? Math.max(0, bruttoMonat) : 0;
  return Math.min(brutto, BBG_RV_AV_MONAT) * 12 / TAGE_JE_JAHR;
}

/**
 * Arbeitslosengeld nach §§ 149, 151, 153 und 154 SGB III.
 *
 * @param {object} eingabe
 * @param {number} eingabe.bruttoMonat Bruttoarbeitsentgelt im Bemessungszeitraum, im Monat
 * @param {number} eingabe.steuerklasse 1 bis 6
 * @param {boolean} [eingabe.hatKind] erhöhter Leistungssatz nach § 149 Nr. 1 SGB III
 * @param {number} [eingabe.versicherungsmonate] für die Anspruchsdauer nach § 147 SGB III
 * @param {number} [eingabe.alter] vollendetes Lebensjahr
 * @param {boolean} [eingabe.kurzeAnwartschaft] § 142 Abs. 2 SGB III
 */
export function berechneArbeitslosengeld({
  bruttoMonat,
  steuerklasse = 1,
  hatKind = false,
  versicherungsmonate,
  alter,
  kurzeAnwartschaft = false,
}) {
  pruefeSteuerklasse(steuerklasse);

  const bemessungTag = bemessungsentgeltTag({ bruttoMonat });
  const leistungTag = leistungsentgeltTag({ bemessungsentgeltTag: bemessungTag, steuerklasse });

  const leistungssatz = hatKind ? LEISTUNGSSATZ_ERHOEHT : LEISTUNGSSATZ;
  const algTag = leistungTag * leistungssatz;
  // Auf den ausgewiesenen Monatsbetrag runden, bevor die Gesamtsumme gebildet
  // wird: Sonst weicht die angezeigte Summe von dem ab, was ein Leser beim
  // Nachrechnen mit dem angezeigten Monatsbetrag erhält.
  const algMonat = runde(algTag * TAGE_JE_MONAT);

  const dauer = versicherungsmonate === undefined
    ? null
    : anspruchsdauer({ versicherungsmonate, alter, kurzeAnwartschaft });

  return {
    bemessungsentgeltTag: runde(bemessungTag),
    leistungsentgeltTag: runde(leistungTag),
    leistungssatz,
    arbeitslosengeldTag: runde(algTag),
    arbeitslosengeldMonat: algMonat,
    anspruchsdauerMonate: dauer,
    gesamtanspruch: dauer === null ? null : runde(algMonat * dauer),
    hatAnspruch: dauer === null ? algMonat > 0 : dauer > 0 && algMonat > 0,
    beitragsbemessungsgrenzeErreicht: bruttoMonat > BBG_RV_AV_MONAT,
  };
}

function pruefeSteuerklasse(steuerklasse) {
  if (!STEUERKLASSEN.includes(steuerklasse)) {
    throw new Error(`Unbekannte Steuerklasse: ${steuerklasse}`);
  }
  return steuerklasse;
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}
