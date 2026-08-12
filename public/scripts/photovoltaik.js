// Wirtschaftlichkeit einer Photovoltaik-Anlage auf dem Hausdach
//
// Die Einspeisevergütung ist kein fester Satz: Sie ergibt sich aus § 48 Abs. 2
// EEG 2023 nach Leistungsklassen, sinkt nach § 49 Abs. 1 EEG halbjährlich um
// 1 % und wird nach § 25 Abs. 1 EEG nur 20 Jahre lang gezahlt. Wer mit einem
// einzigen Satz über die gesamte Lebensdauer rechnet, überschätzt den Ertrag
// einer 15-kWp-Anlage doppelt – beim Satz und bei der Dauer.
//
// Quelle: Bundesnetzagentur, Fördersätze für Solaranlagen, abgerufen am
// 12.08.2026; EEG 2023 unter https://www.gesetze-im-internet.de/eeg_2014/

// Anzulegende Werte für Anlagen an oder auf Gebäuden bei Teileinspeisung
// (Überschusseinspeisung), § 48 Abs. 2 EEG. Beträge in Euro pro kWh.
const VERGUETUNG_STUFEN = [
  { bisKwp: 10, euroProKwh: 0.077 },
  { bisKwp: 40, euroProKwh: 0.0666 },
  { bisKwp: 100, euroProKwh: 0.0544 },
];

// Zeitraum, für den die Sätze oben gelten. Zum 1. Februar 2027 sinken sie
// erneut um 1 % (§ 49 Abs. 1 EEG) – dann ist dieses Modul nachzuziehen.
export const VERGUETUNG_GUELTIG_BIS = '31. Januar 2027';

// § 25 Abs. 1 EEG: Vergütung für 20 Jahre zuzüglich des Inbetriebnahmejahres.
export const VERGUETUNGSDAUER_JAHRE = 20;

// Spezifischer Jahresertrag im deutschen Mittel über alle Ausrichtungen.
const SPEZIFISCHER_ERTRAG = 950; // kWh je kWp und Jahr

// Alterung der Module, Herstellerangaben liegen typisch bei 0,4 bis 0,5 % p. a.
const DEGRADATION = 0.005;

// Versicherung, Wartung, Zählermiete und Rücklage für den Wechselrichter,
// üblicherweise mit rund 1 % der Investitionssumme pro Jahr angesetzt.
const BETRIEBSKOSTEN_ANTEIL = 0.01;

// Betrachtungszeitraum der Wirtschaftlichkeitsrechnung.
const BETRACHTUNG_JAHRE = 25;
const AMORTISATION_MAX_JAHRE = 30;

function rundeAufCent(betrag) {
  return Math.round(betrag * 100) / 100;
}

/**
 * Anzulegender Wert für die Teileinspeisung nach § 48 Abs. 2 EEG.
 *
 * Oberhalb einer Stufengrenze gilt nicht der niedrigere Satz für die gesamte
 * Anlage: Nach § 48 Abs. 2 Satz 2 EEG ist der anzulegende Wert der nach der
 * installierten Leistung gewichtete Durchschnitt der Stufenwerte. Eine
 * 15-kWp-Anlage bekommt also für 10 kWp den Satz der ersten und für die
 * restlichen 5 kWp den der zweiten Stufe.
 *
 * Ab 100 kW installierter Leistung besteht Direktvermarktungspflicht
 * (§ 21b Abs. 1 EEG); für größere Anlagen ist diese Rechnung nicht gedacht.
 *
 * @param {number} leistungKwp installierte Leistung in kWp
 * @returns {number} anzulegender Wert in Euro pro kWh
 */
export function verguetungProKwh(leistungKwp) {
  const leistung = Number(leistungKwp);
  if (!Number.isFinite(leistung) || leistung <= 0) {
    return VERGUETUNG_STUFEN[0].euroProKwh;
  }

  let verguetetesEntgelt = 0;
  let untergrenze = 0;

  for (const stufe of VERGUETUNG_STUFEN) {
    const obergrenze = Math.min(leistung, stufe.bisKwp);
    verguetetesEntgelt += (obergrenze - untergrenze) * stufe.euroProKwh;
    untergrenze = obergrenze;
    if (leistung <= stufe.bisKwp) break;
  }

  // Anteil oberhalb der höchsten Stufe zum Satz der höchsten Stufe.
  const letzte = VERGUETUNG_STUFEN[VERGUETUNG_STUFEN.length - 1];
  if (leistung > letzte.bisKwp) {
    verguetetesEntgelt += (leistung - letzte.bisKwp) * letzte.euroProKwh;
  }

  return verguetetesEntgelt / leistung;
}

/**
 * Wirtschaftlichkeit einer PV-Anlage über 25 Jahre.
 *
 * Der Eigenverbrauch wird mit dem Strompreis bewertet (ersparter Zukauf), die
 * Einspeisung mit dem anzulegenden Wert nach EEG – aber nur in den ersten
 * 20 Jahren. Danach bleibt allein die Stromkostenersparnis.
 *
 * Nicht abgebildet: Strompreissteigerung, Inflation und Zinsen auf das
 * eingesetzte Kapital. Alle Beträge sind daher nominal und in heutigen Preisen.
 *
 * @param {object} eingaben
 * @param {number} eingaben.leistungKwp installierte Leistung in kWp
 * @param {number} eingaben.investition Anschaffungskosten in Euro
 * @param {number} eingaben.strompreis Bezugspreis in Euro pro kWh
 * @param {number} [eingaben.eigenverbrauchAnteil] Anteil des selbst genutzten
 *   Stroms, 0 bis 1
 * @param {number} [eingaben.jahresertragFaktor] spezifischer Ertrag in
 *   kWh je kWp und Jahr
 * @param {number} [eingaben.betriebskostenAnteil] jährliche Betriebskosten als
 *   Anteil der Investition
 */
export function berechnePhotovoltaik({
  leistungKwp,
  investition,
  strompreis,
  eigenverbrauchAnteil = 0.3,
  jahresertragFaktor = SPEZIFISCHER_ERTRAG,
  betriebskostenAnteil = BETRIEBSKOSTEN_ANTEIL,
}) {
  const jahresertrag = leistungKwp * jahresertragFaktor;
  const eigenverbrauchKwh = jahresertrag * eigenverbrauchAnteil;
  const einspeisungKwh = jahresertrag * (1 - eigenverbrauchAnteil);

  const verguetung = verguetungProKwh(leistungKwp);
  const einsparungStrom = rundeAufCent(eigenverbrauchKwh * strompreis);
  const einspeiseerloese = rundeAufCent(einspeisungKwh * verguetung);
  const betriebskosten = rundeAufCent(investition * betriebskostenAnteil);

  // Überschuss eines Jahres. Die Degradation mindert Ersparnis und Erlöse,
  // die Betriebskosten laufen unverändert weiter.
  const ueberschussImJahr = (jahr) => {
    const faktor = Math.pow(1 - DEGRADATION, jahr - 1);
    const erloese = jahr <= VERGUETUNGSDAUER_JAHRE ? einspeiseerloese * faktor : 0;
    return einsparungStrom * faktor + erloese - betriebskosten;
  };

  let kumuliert = 0;
  let amortJahre = null;
  for (let jahr = 1; jahr <= AMORTISATION_MAX_JAHRE; jahr++) {
    kumuliert += ueberschussImJahr(jahr);
    if (kumuliert >= investition && amortJahre === null) amortJahre = jahr;
  }

  let ueberschuss25j = -investition;
  for (let jahr = 1; jahr <= BETRACHTUNG_JAHRE; jahr++) {
    ueberschuss25j += ueberschussImJahr(jahr);
  }

  return {
    jahresertragKwh: Math.round(jahresertrag),
    eigenverbrauchKwh: Math.round(eigenverbrauchKwh),
    einspeisungKwh: Math.round(einspeisungKwh),
    einsparungStrom,
    einspeiseerloese,
    betriebskosten,
    jahresueberschuss: rundeAufCent(einsparungStrom + einspeiseerloese - betriebskosten),
    verguetungCentProKwh: rundeAufCent(verguetung * 100),
    amortJahre,
    ueberschuss25j: rundeAufCent(ueberschuss25j),
  };
}
