// Abgeltungsteuer auf Kapitalertraege nach § 32d EStG.
//
// Bis September 2026 rechnete die Seite die Kirchensteuer als Aufschlag auf die
// vollen 25 Prozent und machte den Satz von der Konfession abhaengig. Beides ist
// falsch: § 32d Abs. 1 Satz 3 EStG ermaessigt die Steuer um ein Viertel der
// Kirchensteuer, und der Satz haengt am Bundesland, nicht am Bekenntnis.

/** Rechtsstand dieser Werte. */
export const RECHTSSTAND = '2026-01-01';

/** § 32d Abs. 1 Satz 1 EStG – der Satz ohne Kirchensteuerpflicht. */
export const ABGELTUNGSTEUERSATZ = 0.25;

/** § 4 SolzG 1995 – Zuschlagsatz auf die Einkommen- bzw. Kapitalertragsteuer. */
export const SOLI_SATZ = 0.055;

/**
 * § 20 Abs. 9 EStG – Sparer-Pauschbetrag. Seit 2023 unveraendert.
 * Bei Zusammenveranlagung gilt der gemeinsame Betrag.
 */
export const SPARERPAUSCHBETRAG_EINZEL = 1000;
export const SPARERPAUSCHBETRAG_ZUSAMMEN = 2000;

/**
 * Kirchensteuersatz je Bundesland – 8 Prozent in Bayern und Baden-Wuerttemberg,
 * 9 Prozent in allen uebrigen Laendern. Der Satz richtet sich nach dem
 * Wohnsitz, NICHT nach der Konfession: evangelisch und katholisch zahlen im
 * selben Land denselben Satz.
 * Quelle: Bundeszentralamt für Steuern, Kirchensteuer auf Abgeltungsteuer.
 */
export const KIRCHENSTEUERSATZ_ACHT = 0.08;
export const KIRCHENSTEUERSATZ_NEUN = 0.09;
export const LAENDER_MIT_ACHT_PROZENT = ['BW', 'BY'];

export const BUNDESLAENDER = {
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen',
};

/** Kirchensteuersatz eines Bundeslandes als Dezimalzahl. */
export function kirchensteuersatz(bundesland) {
  const kuerzel = String(bundesland || '').toUpperCase();
  if (!(kuerzel in BUNDESLAENDER)) {
    throw new Error(`Unbekanntes Bundesland: "${bundesland}"`);
  }
  return LAENDER_MIT_ACHT_PROZENT.includes(kuerzel)
    ? KIRCHENSTEUERSATZ_ACHT
    : KIRCHENSTEUERSATZ_NEUN;
}

const runde = (n) => Math.round(n * 100) / 100;

/**
 * Steuerlast auf Kapitalertraege.
 *
 * Ohne Kirchensteuerpflicht gilt § 32d Abs. 1 Satz 1 EStG: 25 Prozent.
 * Mit Kirchensteuerpflicht greift Satz 3 – die Steuer ermaessigt sich um
 * 25 Prozent der Kirchensteuer. Aufgeloest ergibt das die Formel aus Satz 4,
 * hier ohne anrechenbare auslaendische Steuer (q = 0):
 *
 *     S = 0,25·e − 0,25·k·S   →   S = e / (4 + k)
 *
 * Der Solidaritaetszuschlag faellt auch dann an, wenn der Steuerpflichtige
 * sonst unter der Freigrenze des § 3 Abs. 3 SolzG liegt: Satz 2 dieses Absatzes
 * nimmt die Abgeltungsteuer davon ausdruecklich aus.
 *
 * @param {object} p
 * @param {number} p.ertrag – Kapitalertraege im Jahr, in Euro
 * @param {number} [p.pauschbetrag] – anzusetzender Sparer-Pauschbetrag
 * @param {string} [p.bundesland] – Kuerzel, nur bei Kirchensteuerpflicht nötig
 * @param {boolean} [p.kirchensteuerpflichtig]
 */
export function berechneAbgeltungsteuer({
  ertrag,
  pauschbetrag = SPARERPAUSCHBETRAG_EINZEL,
  bundesland = 'NW',
  kirchensteuerpflichtig = false,
}) {
  const brutto = Math.max(0, Number(ertrag) || 0);
  const frei = Math.min(brutto, Math.max(0, Number(pauschbetrag) || 0));
  const zuVersteuern = brutto - frei;

  const k = kirchensteuerpflichtig ? kirchensteuersatz(bundesland) : 0;
  // § 32d Abs. 1 Satz 4 EStG. Ohne Kirchensteuerpflicht ist k = 0 und die
  // Formel faellt auf die 25 Prozent des Satzes 1 zurueck.
  const kapitalertragsteuer = zuVersteuern / (4 + k);
  const kirchensteuer = kapitalertragsteuer * k;
  const soli = kapitalertragsteuer * SOLI_SATZ;
  const gesamt = kapitalertragsteuer + kirchensteuer + soli;

  return {
    brutto: runde(brutto),
    freigestellt: runde(frei),
    zuVersteuern: runde(zuVersteuern),
    kapitalertragsteuer: runde(kapitalertragsteuer),
    kirchensteuer: runde(kirchensteuer),
    soli: runde(soli),
    gesamt: runde(gesamt),
    netto: runde(brutto - gesamt),
    kirchensteuersatz: k,
    /** Belastung des zu versteuernden Teils, in Prozent. */
    grenzbelastung: zuVersteuern > 0 ? runde((gesamt / zuVersteuern) * 1000) / 10 : 0,
    /** Belastung des gesamten Ertrags inklusive Pauschbetrag, in Prozent. */
    effektivbelastung: brutto > 0 ? runde((gesamt / brutto) * 1000) / 10 : 0,
  };
}

/**
 * Die Belastung des zu versteuernden Ertrags in Prozent – unabhaengig von der
 * Hoehe, weil der Tarif linear ist. Fuer Vergleichstabellen.
 */
export function belastungssatz({ kirchensteuerpflichtig = false, bundesland = 'NW' } = {}) {
  const k = kirchensteuerpflichtig ? kirchensteuersatz(bundesland) : 0;
  const kapESt = 1 / (4 + k);
  // Ungerundet: Der bekannte Wert 26,375 Prozent hat drei Nachkommastellen,
  // eine Rundung auf zwei wuerde ihn verfaelschen. Gerundet wird im Text.
  return kapESt * (1 + k + SOLI_SATZ) * 100;
}
