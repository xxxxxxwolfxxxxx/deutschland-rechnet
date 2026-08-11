// Gesetzlicher Mindestlohn und Geringfügigkeitsgrenze
//
// Rechtsstand: 2026-01-01
// Primärquellen:
// - § 1 Abs. 2 MiLoG        https://www.gesetze-im-internet.de/milog/__1.html
// - Fünfte Mindestlohnanpassungsverordnung (MiLoV5) vom 05.11.2025,
//   BGBl. 2025 I Nr. 268    https://www.gesetze-im-internet.de/milov5/
// - § 8 Abs. 1a SGB IV      https://www.gesetze-im-internet.de/sgb_4/__8.html
//
// Bis zum 11.08.2026 rechnete das Modul mit 12,82 Euro – dem Satz des Jahres
// 2025 aus der Vierten Anpassungsverordnung.
//
// § 1 Abs. 2 Satz 1 MiLoG nennt selbst nur 12,00 Euro ab dem 01.10.2022. Die
// Erhöhungen ergehen nach Satz 2 durch Rechtsverordnung; maßgeblich ist also
// stets die jüngste Verordnung, nicht der Gesetzestext.

export const MINDESTLOHN_STAND = '2026-01-01';

/**
 * Verkündete Mindestlohnsätze mit Fundstelle. Frühere Sätze – ab 8,50 Euro
 * zum 01.01.2015 – beruhten auf inzwischen außer Kraft getretenen
 * Verordnungen, die nicht mehr abrufbar sind; sie werden hier deshalb nicht
 * geführt.
 */
export const MINDESTLOHN_ENTWICKLUNG = [
  { ab: '2022-10-01', betrag: 12.0, fundstelle: '§ 1 Abs. 2 Satz 1 MiLoG' },
  { ab: '2024-01-01', betrag: 12.41, fundstelle: '§ 1 Nr. 1 MiLoV4' },
  { ab: '2025-01-01', betrag: 12.82, fundstelle: '§ 1 Nr. 2 MiLoV4' },
  { ab: '2026-01-01', betrag: 13.9, fundstelle: '§ 1 Nr. 1 MiLoV5' },
  { ab: '2027-01-01', betrag: 14.6, fundstelle: '§ 1 Nr. 2 MiLoV5' },
];

/**
 * Der an einem Stichtag geltende Mindestlohn.
 *
 * @param {string} datum ISO-Datum, etwa '2026-08-11'
 */
export function mindestlohnAm(datum) {
  const gueltig = MINDESTLOHN_ENTWICKLUNG.filter((e) => e.ab <= datum);
  return gueltig.length ? gueltig[gueltig.length - 1].betrag : 0;
}

/** Der zum Rechtsstand dieses Moduls geltende Satz. */
export const MINDESTLOHN = mindestlohnAm(MINDESTLOHN_STAND);

/**
 * § 8 Abs. 1a Satz 2 SGB IV: Mindestlohn mal 130, geteilt durch drei, auf
 * volle Euro aufgerundet. Die Grenze ist damit an den Mindestlohn gekoppelt
 * und darf nicht als eigener Wert gepflegt werden.
 */
export function geringfuegigkeitsgrenze(stundenlohn = MINDESTLOHN) {
  return Math.ceil((stundenlohn * 130) / 3);
}

export const MINIJOB_GRENZE = geringfuegigkeitsgrenze();

/** Durchschnittliche Wochen je Monat: 52 Wochen auf 12 Monate verteilt. */
const WOCHEN_JE_MONAT = 52 / 12;

/**
 * Entgelt zum Mindestlohn.
 *
 * @param {object} eingabe
 * @param {number} eingabe.stundenProWoche vereinbarte Wochenarbeitszeit
 * @param {number} [eingabe.stundenlohn] abweichender Stundenlohn zum Vergleich
 */
export function berechneMindestlohn({ stundenProWoche, stundenlohn = MINDESTLOHN } = {}) {
  const stunden = Math.max(0, zahl(stundenProWoche));
  const lohn = Math.max(0, zahl(stundenlohn));

  const stundenProMonat = stunden * WOCHEN_JE_MONAT;
  const monat = runde(stundenProMonat * lohn);

  return {
    monat,
    jahr: runde(monat * 12),
    stundenProMonat: Math.round(stundenProMonat * 10) / 10,
    stundenProJahr: Math.round(stunden * 52 * 10) / 10,
    mindestlohn: lohn,
    minijobGrenze: MINIJOB_GRENZE,
    ueberMinijobGrenze: monat > MINIJOB_GRENZE,
  };
}

function zahl(wert) {
  return Number.isFinite(wert) ? wert : 0;
}

function runde(betrag) {
  return Math.round(betrag * 100) / 100;
}
