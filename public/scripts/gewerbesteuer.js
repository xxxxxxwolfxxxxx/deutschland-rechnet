// Gewerbesteuer: Messbetrag, Steuer und Anrechnung nach § 35 EStG.
//
// Warum es dieses Modul gibt: Die Rechnerseite hatte ihre Logik inline und
// enthielt drei Rechenfehler, die erst beim Gegenlesen des Artikels auffielen.
//
//   1. Die Abrundung des Gewerbeertrags auf volle 100 Euro fehlte. § 11 Abs. 1
//      Satz 3 GewStG rundet ZUERST ab und zieht DANN den Freibetrag ab.
//   2. Die Anrechnung nach § 35 EStG wurde ungekappt als "das Vierfache des
//      Messbetrags" ausgewiesen. § 35 Abs. 1 Satz 5 EStG beschränkt sie auf die
//      tatsächlich zu zahlende Gewerbesteuer – unterhalb von 400 % Hebesatz war
//      der angezeigte Wert deshalb zu hoch.
//   3. Die Anrechnungszeile erschien auch für Kapitalgesellschaften. § 35 EStG
//      ermäßigt die Einkommensteuer; eine GmbH zahlt Körperschaftsteuer.
//
// Was dieses Modul NICHT kann: Es kennt den Ermäßigungshöchstbetrag nicht –
// den Anteil der Einkommensteuer, der auf die gewerblichen Einkünfte entfällt
// (§ 35 Abs. 1 Satz 2 EStG). Die Anrechnung kann daran zusätzlich scheitern.
// Die Rechnerseite weist darauf hin.

/** § 11 Abs. 1 Satz 3 Nr. 1 GewStG – nur natürliche Personen und Personengesellschaften. */
export const FREIBETRAG = 24500;
/** § 11 Abs. 2 GewStG. */
export const MESSZAHL = 0.035;
/** § 35 Abs. 1 Satz 1 Nr. 1 EStG: das Vierfache des Messbetrags. */
export const ANRECHNUNGSFAKTOR = 4;
/** § 16 Abs. 4 Satz 2 GewStG. */
export const MINDESTHEBESATZ = 200;
/** § 11 Abs. 1 Satz 3 GewStG: Abrundung auf volle 100 Euro nach unten. */
export const ABRUNDUNG = 100;

/**
 * Bis zu diesem Hebesatz deckt die Anrechnung die Gewerbesteuer vollständig:
 * Anrechnung = 4 × Messbetrag, Steuer = Messbetrag × Hebesatz/100.
 * Gleichgesetzt bleibt Hebesatz = 400.
 */
export const NEUTRALER_HEBESATZ = ANRECHNUNGSFAKTOR * 100;

/** Rechtsformen, für die der Freibetrag und die Anrechnung gelten. */
const NATUERLICHE = new Set(['einzel', 'person']);

/**
 * @param {object} e
 * @param {number} e.gewerbeertrag  Gewerbeertrag nach §§ 7–9 GewStG, in Euro
 * @param {number} e.hebesatz       Hebesatz der Gemeinde in Prozent (§ 16 GewStG)
 * @param {'einzel'|'person'|'koerper'} e.rechtsform
 */
export function berechneGewerbesteuer({ gewerbeertrag, hebesatz, rechtsform }) {
  if (!Number.isFinite(gewerbeertrag) || gewerbeertrag < 0) {
    throw new Error('Der Gewerbeertrag muss null oder positiv sein.');
  }
  if (!Number.isFinite(hebesatz) || hebesatz < MINDESTHEBESATZ) {
    throw new Error(`Der Hebesatz darf ${MINDESTHEBESATZ} Prozent nicht unterschreiten (§ 16 Abs. 4 Satz 2 GewStG).`);
  }

  const anrechenbar = NATUERLICHE.has(rechtsform);

  // § 11 Abs. 1 Satz 3 GewStG: erst abrunden, dann kürzen.
  const ertragAbgerundet = Math.floor(gewerbeertrag / ABRUNDUNG) * ABRUNDUNG;
  const freibetrag = anrechenbar ? FREIBETRAG : 0;
  const steuerpflichtig = Math.max(0, ertragAbgerundet - freibetrag);

  const messbetrag = steuerpflichtig * MESSZAHL;
  const gewerbesteuer = messbetrag * (hebesatz / 100);

  // § 35 Abs. 1 EStG: das Vierfache des Messbetrags, aber höchstens die
  // tatsächlich zu zahlende Gewerbesteuer (Satz 5).
  const anrechnungRechnerisch = anrechenbar ? messbetrag * ANRECHNUNGSFAKTOR : 0;
  const anrechnung = anrechenbar ? Math.min(anrechnungRechnerisch, gewerbesteuer) : 0;
  const gekappt = anrechenbar && anrechnungRechnerisch > gewerbesteuer;

  return {
    gewerbeertrag,
    ertragAbgerundet,
    hebesatz,
    rechtsform,
    anrechenbar,
    freibetrag,
    steuerpflichtig,
    messbetrag,
    gewerbesteuer,
    anrechnungRechnerisch,
    anrechnung,
    gekappt,
    /** Was nach der Anrechnung an Gewerbesteuer übrig bleibt. */
    restbelastung: gewerbesteuer - anrechnung,
    /** Bezogen auf den eingegebenen Gewerbeertrag, nicht auf den abgerundeten. */
    effektiverSatz: gewerbeertrag > 0 ? (gewerbesteuer / gewerbeertrag) * 100 : 0,
  };
}
