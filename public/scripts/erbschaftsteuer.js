// Erbschaft- und Schenkungsteuer nach dem ErbStG
//
// Die Erbschaftsteuer ist KEINE Stufensteuer wie die Einkommensteuer. § 19
// Abs. 1 ErbStG ordnet dem steuerpflichtigen Erwerb eine Wertstufe zu und
// besteuert den GESAMTEN Erwerb mit dem Satz dieser Stufe (Vollmengen-
// staffelung). Wer stattdessen jede Stufe einzeln hochrechnet, kommt bei
// einem Kind mit 500.000 Euro auf 8.000 statt der richtigen 11.000 Euro.
//
// Genau weil ein Euro über einer Wertgrenze den Satz für die volle Summe
// anhebt, kennt § 19 Abs. 3 den Härteausgleich: Der Sprung wird nur insoweit
// erhoben, wie er aus dem übersteigenden Betrag gedeckt werden kann.
//
// Rechtsgrundlagen, abgerufen am 13.08.2026 unter
// https://www.gesetze-im-internet.de/erbstg_1974/ :
//   § 15 Abs. 1  Steuerklassen I bis III
//   § 16 Abs. 1  persönliche Freibeträge
//   § 19 Abs. 1  Steuersätze
//   § 19 Abs. 3  Härteausgleich
//
// NICHT abgebildet, weil das Formular die nötigen Angaben nicht erhebt:
//   § 17 besonderer Versorgungsfreibetrag (Ehegatte 256.000 Euro, Kinder je
//        nach Alter 10.300 bis 52.000 Euro). Er gilt nur bei Erwerben von
//        Todes wegen und wird um den Kapitalwert steuerfreier Versorgungs-
//        bezüge gekürzt – bei gesetzlicher Witwenrente bleibt davon regelmäßig
//        wenig übrig. Ihn ungefragt anzusetzen würde die Steuer für die
//        meisten Fälle zu niedrig ausweisen.
//   §§ 13a ff. Verschonung von Betriebsvermögen, § 13d für vermietete
//        Wohnimmobilien, § 13 Abs. 1 Nr. 4b für das Familienheim.
//   § 14 Zusammenrechnung mehrerer Erwerbe binnen zehn Jahren.

/**
 * Persönliche Freibeträge nach § 16 Abs. 1 ErbStG bei unbeschränkter
 * Steuerpflicht. Die Schlüssel sind Personengruppen, keine Steuerklassen:
 * Innerhalb der Steuerklasse I hängt der Freibetrag am Verwandtschaftsgrad,
 * der Steuersatz dagegen nicht.
 */
export const FREIBETRAEGE = Object.freeze({
  I1: 500000, // Nr. 1 – Ehegatte und Lebenspartner
  I2: 400000, // Nr. 2 – Kinder, Stiefkinder, Kinder verstorbener Kinder
  I3: 200000, // Nr. 3 – Kinder der Kinder (Enkel bei lebendem Elternteil)
  I4: 100000, // Nr. 4 – übrige Personen der Steuerklasse I (Eltern, Voreltern)
  II: 20000, // Nr. 5 – Steuerklasse II
  III: 20000, // Nr. 7 – Steuerklasse III (Nr. 6 ist weggefallen)
});

/**
 * Zuordnung der Personengruppen zur Steuerklasse des § 15 Abs. 1 ErbStG.
 * Eltern und Voreltern stehen in Steuerklasse I nur bei Erwerben von Todes
 * wegen; bei einer Schenkung fallen sie nach § 15 Abs. 1 II Nr. 1 in die
 * Steuerklasse II.
 */
export const PERSONENGRUPPEN = Object.freeze({
  I1: { klasse: 'I', label: 'Ehegatte oder Lebenspartner' },
  I2: { klasse: 'I', label: 'Kind oder Stiefkind' },
  I3: { klasse: 'I', label: 'Enkelkind' },
  I4: { klasse: 'I', label: 'Eltern oder Großeltern (Erwerb von Todes wegen)' },
  II: { klasse: 'II', label: 'Geschwister, Nichten und Neffen, Schwiegerkinder' },
  III: { klasse: 'III', label: 'alle übrigen Erwerber' },
});

/**
 * Steuersätze nach § 19 Abs. 1 ErbStG in Prozent.
 *
 * `bis` ist die Obergrenze der Wertstufe einschließlich – ein Erwerb von genau
 * 75.000 Euro wird noch mit dem Satz der ersten Zeile besteuert.
 */
export const STEUERSAETZE = Object.freeze({
  I: Object.freeze([
    { bis: 75000, satz: 7 },
    { bis: 300000, satz: 11 },
    { bis: 600000, satz: 15 },
    { bis: 6000000, satz: 19 },
    { bis: 13000000, satz: 23 },
    { bis: 26000000, satz: 27 },
    { bis: Infinity, satz: 30 },
  ]),
  II: Object.freeze([
    { bis: 75000, satz: 15 },
    { bis: 300000, satz: 20 },
    { bis: 600000, satz: 25 },
    { bis: 6000000, satz: 30 },
    { bis: 13000000, satz: 35 },
    { bis: 26000000, satz: 40 },
    { bis: Infinity, satz: 43 },
  ]),
  III: Object.freeze([
    { bis: 75000, satz: 30 },
    { bis: 300000, satz: 30 },
    { bis: 600000, satz: 30 },
    { bis: 6000000, satz: 30 },
    { bis: 13000000, satz: 50 },
    { bis: 26000000, satz: 50 },
    { bis: Infinity, satz: 50 },
  ]),
});

const rundeAufCent = (betrag) => Math.round(betrag * 100) / 100;

const zahl = (wert) => (Number.isFinite(wert) && wert > 0 ? wert : 0);

/**
 * Steuersatz in Prozent für einen steuerpflichtigen Erwerb.
 *
 * @param {'I'|'II'|'III'} klasse Steuerklasse nach § 15 Abs. 1 ErbStG
 * @param {number} erwerb steuerpflichtiger Erwerb in Euro
 */
export function steuersatz(klasse, erwerb) {
  const stufen = STEUERSAETZE[klasse];
  if (!stufen) {
    throw new Error(`Unbekannte Steuerklasse: ${klasse}`);
  }
  return stufen.find((stufe) => erwerb <= stufe.bis).satz;
}

/**
 * Untergrenze der Wertstufe, in der ein Erwerb liegt – also die zuletzt
 * überschrittene Wertgrenze. Sie ist die Vergleichsgröße des § 19 Abs. 3.
 */
function letzteWertgrenze(klasse, erwerb) {
  const stufen = STEUERSAETZE[klasse];
  let grenze = 0;
  for (const stufe of stufen) {
    if (erwerb <= stufe.bis) return grenze;
    grenze = stufe.bis;
  }
  return grenze;
}

/**
 * Erbschaft- oder Schenkungsteuer eines Erwerbs.
 *
 * @param {object} eingaben
 * @param {number} eingaben.nachlass Wert des Erwerbs in Euro
 * @param {keyof typeof FREIBETRAEGE} eingaben.klasse Personengruppe
 * @returns {{steuer: number, freibetrag: number, zuVersteuern: number,
 *   satz: number, effektiv: string, steuerklasse: string,
 *   haerteausgleich: boolean, steuerOhneAusgleich: number}}
 */
export function berechneErbschaftsteuer({ nachlass, klasse }) {
  const gruppe = PERSONENGRUPPEN[klasse];
  if (!gruppe) {
    // Ein stiller Rückfall auf Steuerklasse III wäre eine erfundene Zahl.
    throw new Error(`Unbekannte Personengruppe: ${klasse}`);
  }

  const erwerb = zahl(nachlass);
  const freibetrag = FREIBETRAEGE[klasse];
  const zuVersteuern = Math.max(0, erwerb - freibetrag);
  const satz = steuersatz(gruppe.klasse, zuVersteuern);

  // § 19 Abs. 1: ein Satz auf den gesamten steuerpflichtigen Erwerb.
  const steuerOhneAusgleich = rundeAufCent(zuVersteuern * (satz / 100));

  // § 19 Abs. 3: Der Unterschied zur Steuer an der letzten Wertgrenze wird nur
  // erhoben, soweit er aus dem übersteigenden Betrag gedeckt werden kann – aus
  // der Hälfte bei einem Satz bis 30 Prozent, aus drei Vierteln darüber.
  const grenze = letzteWertgrenze(gruppe.klasse, zuVersteuern);
  let steuer = steuerOhneAusgleich;
  let haerteausgleich = false;

  if (grenze > 0) {
    const steuerAnDerGrenze = grenze * (steuersatz(gruppe.klasse, grenze) / 100);
    const uebersteigenderBetrag = zuVersteuern - grenze;
    const anteil = satz > 30 ? 0.75 : 0.5;
    const gedeckelt = rundeAufCent(steuerAnDerGrenze + uebersteigenderBetrag * anteil);
    if (gedeckelt < steuerOhneAusgleich) {
      steuer = gedeckelt;
      haerteausgleich = true;
    }
  }

  const effektiv = erwerb > 0 ? (steuer / erwerb) * 100 : 0;

  return {
    steuer,
    freibetrag,
    zuVersteuern,
    satz,
    effektiv: effektiv.toFixed(2),
    steuerklasse: gruppe.klasse,
    haerteausgleich,
    steuerOhneAusgleich,
  };
}
