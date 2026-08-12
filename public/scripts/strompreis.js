// Durchschnittlicher Haushaltsstrompreis in Deutschland
//
// Primärquelle: BDEW-Strompreisanalyse April 2026 (Datenstand 04/2026,
// veröffentlicht am 15. April 2026), Folie 4 und Folie 12.
// https://www.bdew.de/service/daten-und-grafiken/bdew-strompreisanalyse/
// Abgerufen am 12.08.2026.
//
// Amtlicher Vergleichswert: Statistisches Bundesamt, Pressemitteilung Nr. 111
// vom 31. März 2026 (Strompreise für Haushalte im 2. Halbjahr 2025).
//
// Warum es diese Datei gibt: Der Stromkosten-Rechner startete mit 31 ct/kWh im
// Eingabefeld, nannte in der Beschreibung und in der FAQ 36-40 ct/kWh und
// rechnete die Vergleichstabelle mit 36 und 40 ct/kWh. Der Photovoltaik- und
// der Wärmepumpen-Rechner hatten wieder eigene Werte. Der Strompreis steht
// deshalb nur noch hier.
//
// Zur Methodik des BDEW-Werts, die für jede Verwendung wichtig ist:
//   - Bezugsgröße ist ein Musterhaushalt mit 3.500 kWh Jahresverbrauch.
//   - Der Grundpreis ist anteilig im ct/kWh-Wert ENTHALTEN. Wer zusätzlich
//     einen Grundpreis aufschlägt, zählt ihn doppelt.
//   - Erfasst sind Tarifprodukte und Grundversorgungstarife, die zum
//     Berechnungszeitpunkt abschließbar waren, gewichtet mit der
//     Vertragsstruktur der Bundesnetzagentur. Es sind also Neukundenpreise,
//     keine Mengengewichtung über bestehende Verträge.
//   - Nicht enthalten sind Sondertarife: Heizstrom, Wärmepumpentarife,
//     Ökostrom mit Aufschlag, Koppeltarife. Für Wärmepumpenstrom rechnet
//     deshalb heizkosten.js mit einem eigenen, niedrigeren Arbeitspreis.

/** Bezeichnung der Primärquelle für Quellenangaben auf den Seiten. */
export const STROMPREIS_QUELLE = 'BDEW-Strompreisanalyse April 2026';

export const STROMPREIS_QUELLE_URL =
  'https://www.bdew.de/service/daten-und-grafiken/bdew-strompreisanalyse/';

/** Datenstand der Analyse, nicht das Abrufdatum. */
export const STROMPREIS_DATENSTAND = 'April 2026';

/** Tag, an dem die Quelle für dieses Modul geprüft wurde (ISO). */
export const STROMPREIS_ABGERUFEN_AM = '2026-08-12';

/** Jahresverbrauch des Musterhaushalts, auf den sich der Preis bezieht. */
export const STROMPREIS_REFERENZVERBRAUCH_KWH = 3500;

/**
 * Durchschnittlicher Strompreis für Haushalte 2026 in Cent je kWh.
 *
 * Gesamtpreis einschließlich aller Steuern, Abgaben und Umlagen sowie des
 * anteiligen Grundpreises bei 3.500 kWh Jahresverbrauch.
 */
export const STROMPREIS_CENT_PRO_KWH = 37.0;

/** Derselbe Preis in Euro je kWh – abgeleitet, nicht zweite Zahl. */
export const STROMPREIS_EURO_PRO_KWH = STROMPREIS_CENT_PRO_KWH / 100;

/**
 * Steuern, Abgaben und Umlagen im Einzelnen, in Cent je kWh (Folie 12).
 *
 * Die EEG-Umlage fehlt hier nicht versehentlich: Sie wurde zum 1. Juli 2022
 * auf null gesetzt (§ 60 Abs. 1a EEG 2021, seither aus dem EEG gestrichen) und
 * ist kein Bestandteil des Strompreises mehr.
 */
export const STROMPREIS_UMLAGEN = Object.freeze({
  mehrwertsteuer: 5.91,
  stromsteuer: 2.05,
  konzessionsabgabe: 1.665,
  besondereNetznutzung: 1.559,
  offshoreNetzumlage: 0.941,
  kwkgUmlage: 0.446,
});

const UMLAGEN_SUMME = Object.values(STROMPREIS_UMLAGEN).reduce((a, b) => a + b, 0);

/**
 * Die drei Blöcke des Strompreises in Cent je kWh (Folie 4 und 12).
 *
 * Die Summe weicht um wenige Hundertstel vom Gesamtpreis ab; der BDEW weist
 * selbst auf Rundungsdifferenzen zwischen Komponenten und Summe hin.
 */
export const STROMPREIS_BESTANDTEILE = Object.freeze({
  beschaffungUndVertrieb: 15.17,
  netzentgelt: 9.26,
  steuernAbgabenUmlagen: UMLAGEN_SUMME,
});

/**
 * Amtlicher Vergleichswert des Statistischen Bundesamts.
 *
 * Er liegt deutlich über dem BDEW-Wert, weil er anders erhoben wird: Destatis
 * erfasst mengengewichtet, was Haushalte in bestehenden Verträgen tatsächlich
 * zahlen, der BDEW dagegen, was am Markt neu abschließbar ist. Die Differenz
 * ist ungefähr das, was ein Haushalt durch einen Tarifwechsel gewinnen kann.
 */
export const STROMPREIS_AMTLICH = Object.freeze({
  quelle: 'Statistisches Bundesamt, Pressemitteilung Nr. 111 vom 31. März 2026',
  quelleUrl: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/03/PD26_111_61243.html',
  zeitraum: '2. Halbjahr 2025',
  centProKwh: 40.55,
  verbrauchsband: '2.500 bis 5.000 kWh',
});

// ---------------------------------------------------------------------------
// Wärmepumpenstrom
//
// Der BDEW-Durchschnitt oben gilt ausdrücklich NICHT hier: Heizstrom- und
// Wärmepumpentarife sind aus der Strompreisanalyse ausgenommen. Sie sind ein
// eigener Markt mit eigenem Zähler, eigenem Tarif und – seit § 14a EnWG – mit
// reduzierten Netzentgelten für steuerbare Verbrauchseinrichtungen. Wer eine
// Wärmepumpe mit 37 ct rechnet, rechnet sie systematisch zu teuer.
// ---------------------------------------------------------------------------

export const WAERMEPUMPENSTROM_QUELLE = 'Verivox, Wärmepumpenstrom-Preisentwicklung';

/**
 * Belegte Marktspanne spezieller Wärmepumpentarife in Cent je kWh.
 *
 * Die Untergrenze erreichen Neukunden im Tarifwechsel, die Obergrenze zahlen
 * Bestandskunden; in der Grundversorgung verlangen einzelne Versorger nahezu
 * den Haushaltspreis.
 */
export const WAERMEPUMPENSTROM_SPANNE = Object.freeze({ min: 20, max: 26 });

/**
 * Günstigster am Markt abschließbarer Tarif – bewusst NICHT der Rechenwert.
 *
 * Verivox mittelt hier die drei günstigsten Angebote. Das ist eine andere
 * Methodik als beim BDEW-Haushaltswert und ein Best Case. Als Rechenwert würde
 * er die Wärmepumpe gegen die Marktdurchschnittspreise von Gas, Öl und Pellets
 * in heizkosten.js systematisch bevorteilen.
 */
export const WAERMEPUMPENSTROM_NEUKUNDEN = Object.freeze({
  centProKwh: 20.66,
  stichtag: '2026-07-13',
  referenzverbrauchKwh: 7500,
  quelleUrl: 'https://www.verivox.de/heizstrom/waermepumpenstrom-preisentwicklung/',
});

/**
 * Rechenwert für Wärmepumpenstrom in Cent je kWh.
 *
 * Die Obergrenze der belegten Spanne, also der konservative Rand: Er trifft
 * Bestandskunden ohne Tarifwechsel und lässt die Wärmepumpe im Vergleich mit
 * anderen Heizungsarten eher zu schlecht als zu gut aussehen. Wer wechselt,
 * zahlt weniger – das ist der ehrlichere Fehler.
 */
export const WAERMEPUMPENSTROM_CENT_PRO_KWH = WAERMEPUMPENSTROM_SPANNE.max;

/** Derselbe Preis in Euro je kWh – abgeleitet, nicht zweite Zahl. */
export const WAERMEPUMPENSTROM_EURO_PRO_KWH = WAERMEPUMPENSTROM_CENT_PRO_KWH / 100;

// ---------------------------------------------------------------------------
// Ladestrom für Elektroautos
//
// Auch das ist ein eigener Markt, und zwar ein dreigeteilter: Wer zu Hause
// lädt, zahlt seinen Haushaltstarif. Wer unterwegs lädt, zahlt den Preis des
// Ladepunktbetreibers – und der liegt um ein Vielfaches höher, weil Aufbau und
// Betrieb der Säule mitbezahlt werden. Ein Rechner, der beides zu einem Wert
// verschmilzt, beantwortet die eigentliche Frage nicht.
// ---------------------------------------------------------------------------

export const LADESTROM_QUELLE = 'LichtBlick Ladesäulencheck 2025 (Erhebung: Statista)';

export const LADESTROM_QUELLE_URL = 'https://www.lichtblick.de/ladesaeulencheck/';

/**
 * Datenstand der Ladepreis-Erhebung, nicht das Abrufdatum.
 *
 * Älter als der BDEW-Wert oben, weil der Ladesäulencheck jährlich erscheint und
 * für 2026 noch keine Ausgabe vorliegt. Der ADAC nannte im Februar 2026
 * weiterhin rund 52 ct als vertragsgebundenen Preis – die Werte tragen also
 * noch, sind aber beim nächsten Ladesäulencheck zu prüfen.
 */
export const LADESTROM_DATENSTAND = 'Juni 2025';

/** Laden an der eigenen Steckdose oder Wallbox: der Haushaltstarif. */
export const LADESTROM_HEIM_CENT_PRO_KWH = STROMPREIS_CENT_PRO_KWH;

export const LADESTROM_HEIM_EURO_PRO_KWH = STROMPREIS_EURO_PRO_KWH;

/** Öffentliches Normalladen (AC), Durchschnitt über die führenden Betreiber. */
export const LADESTROM_AC_CENT_PRO_KWH = 52;

export const LADESTROM_AC_EURO_PRO_KWH = LADESTROM_AC_CENT_PRO_KWH / 100;

/** Öffentliches Schnellladen (DC). */
export const LADESTROM_DC_CENT_PRO_KWH = 60;

export const LADESTROM_DC_EURO_PRO_KWH = LADESTROM_DC_CENT_PRO_KWH / 100;

/**
 * Laden ohne Vertrag an einem Autobahn-Schnelllader, in Cent je kWh.
 *
 * Der teuerste regelmäßig vorkommende Fall und deshalb die sinnvolle Obergrenze
 * für Eingabefelder. Quelle: ADAC, Ladetarife für Elektroautos (Stand 2026) –
 * dort dem vertragsgebundenen Preis von 52 ct gegenübergestellt.
 */
export const LADESTROM_ADHOC_AUTOBAHN_CENT_PRO_KWH = 84;

export const LADESTROM_ADHOC_AUTOBAHN_EURO_PRO_KWH =
  LADESTROM_ADHOC_AUTOBAHN_CENT_PRO_KWH / 100;

/** Die drei Ladewege für Tabellen und Vergleiche, aufsteigend nach Preis. */
export const LADEWEGE = Object.freeze([
  Object.freeze({
    schluessel: 'heim',
    label: 'Zu Hause (Wallbox oder Steckdose)',
    centProKwh: LADESTROM_HEIM_CENT_PRO_KWH,
  }),
  Object.freeze({
    schluessel: 'ac',
    label: 'Öffentlich, Normalladen (AC)',
    centProKwh: LADESTROM_AC_CENT_PRO_KWH,
  }),
  Object.freeze({
    schluessel: 'dc',
    label: 'Öffentlich, Schnellladen (DC)',
    centProKwh: LADESTROM_DC_CENT_PRO_KWH,
  }),
]);

/**
 * Energiekosten eines Elektroautos je 100 km.
 *
 * @param {object} eingaben
 * @param {number} eingaben.verbrauchKwhJe100km Verbrauch in kWh je 100 km
 * @param {number} [eingaben.centProKwh] Ladepreis in Cent je kWh
 * @returns {number} Kosten in Euro je 100 km
 */
export function ladekostenJe100km({
  verbrauchKwhJe100km,
  centProKwh = LADESTROM_HEIM_CENT_PRO_KWH,
}) {
  const verbrauch = Number.isFinite(verbrauchKwhJe100km) ? Math.max(0, verbrauchKwhJe100km) : 0;
  const preis = Number.isFinite(centProKwh) ? Math.max(0, centProKwh) : 0;
  return rundeAufCent((verbrauch * preis) / 100);
}

function rundeAufCent(betrag) {
  return Math.round(betrag * 100) / 100;
}

/**
 * Stromkosten eines Jahres aus Verbrauch und Preis.
 *
 * Ein Grundpreis wird bewusst nicht addiert: Im Durchschnittspreis des BDEW
 * steckt er bei 3.500 kWh bereits anteilig drin. Bei deutlich kleinerem
 * Verbrauch unterschätzt die Rechnung die Kosten leicht, bei größerem
 * überschätzt sie sie – der Grundpreis verteilt sich dann auf mehr oder
 * weniger Kilowattstunden.
 *
 * @param {object} eingaben
 * @param {number} eingaben.verbrauchKwh Jahresverbrauch in kWh
 * @param {number} [eingaben.centProKwh] Preis in Cent je kWh
 * @returns {{ jahr: number, monat: number }} Kosten in Euro
 */
export function stromkostenProJahr({ verbrauchKwh, centProKwh = STROMPREIS_CENT_PRO_KWH }) {
  const verbrauch = Number.isFinite(verbrauchKwh) ? Math.max(0, verbrauchKwh) : 0;
  const preis = Number.isFinite(centProKwh) ? Math.max(0, centProKwh) : 0;
  const jahr = rundeAufCent((verbrauch * preis) / 100);
  return { jahr, monat: rundeAufCent(jahr / 12) };
}
