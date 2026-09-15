// Energieausweis-Vorberechnung: Verbrauchskennwert, Effizienzklasse,
// Treibhausgasemissionen und Ausweisart aus den eigenen Abrechnungen.
//
// Die frühere Seite schätzte einen Endenergiebedarf aus Baujahr, Dämmstandard
// und Heizungsart mit Faktoren ohne Quelle und kannte die Klasse H nicht. Der
// Bedarf eines Gebäudes lässt sich ohne Gebäudeaufnahme nicht ehrlich rechnen;
// der Verbrauch steht auf der Abrechnung. Dieses Modul rechnet deshalb, was
// ein Energieverbrauchsausweis ausweist:
//
//   § 82 Abs. 2 GModG  – Endenergieverbrauch für Heizung und Warmwasser je m²
//                      Gebäudenutzfläche; Pauschalen für die Fläche und für
//                      dezentrales Warmwasser (siehe jahresenergie.js)
//   § 82 Abs. 4 GModG  – Abrechnungen aus mindestens 36 Monaten
//   § 86, Anlage 10    – Energieeffizienzklasse aus dem Endenergieverbrauch
//   § 85 Abs. 6,
//   Anlage 9 Nr. 2/3   – Treibhausgasemissionen = Verbrauch × Emissionsfaktor
//   § 80 Abs. 3 S. 2/3 – wann ein Energiebedarfsausweis vorgeschrieben ist
//
// Bekanntmachung der Regeln für Energieverbrauchswerte im Wohngebäudebestand
// vom 29.03.2021 (BAnz AT 16.04.2021 B1), Nr. 2: Werden die 36 Monate aus
// Jahresabrechnungen zusammengesetzt, ist der Wert der Durchschnitt aus drei
// Jahreswerten. Brennstoffmengen werden mit dem Heizwert Hi nach der
// Heizkostenverordnung umgerechnet; brennwertbezogene Angaben sind nach
// DIN V 18599-1: 2018-09 Tabelle B.1 auf Hi umzurechnen.
//
// NICHT nachgebildet – der Kennwert ist deshalb eine Vorberechnung, kein
// Ausweiswert:
//   - die Witterungs- und Klimabereinigung (§ 82 Abs. 3, Bekanntmachung Nr. 3.2)
//   - die Umrechnung von Brennwert auf Heizwert bei Erdgas: Die DIN-Tabelle ist
//     nicht frei zugänglich, ein Faktor wird hier nicht unterstellt. Die
//     Seite weist darauf hin, dass der Gas-Kennwert dadurch höher liegt.
//   - Leerstandskorrektur (Bekanntmachung Nr. 6) und Primärenergie (§ 22)
//
// Das Gebäudeenergiegesetz (GEG) heißt seit dem Änderungsgesetz vom 23.07.2026
// (BGBl. verkündet am 28.07.2026, in Kraft am 29.07.2026) Gebäudemodernisierungs-
// gesetz (GModG); Paragrafen und Anlagen sind unverändert.
// Quellen: https://www.gesetze-im-internet.de/geg/ (§§ 79, 80, 82, 85–88,
// Anlagen 9 und 10) und https://www.gesetze-im-internet.de/heizkostenv/__9.html,
// abgerufen am 15.09.2026; Anlage 9 zuerst abgerufen am 12.08.2026.

import {
  effizienzklasse,
  nutzflaecheAusWohnflaeche,
  ZUSCHLAG_DEZENTRALES_WARMWASSER,
} from './jahresenergie.js';

// ABGRENZUNG zu `emissionsfaktor()` aus heizkosten.js: Die dortigen Werte nach
// EBeV 2030 Anlage 2 Teil 4 (Erdgas 0,1814 kg/kWh, Heizöl 0,2664 kg/kWh) gelten
// je ABGERECHNETER Kilowattstunde. Der Energieausweis hat in Anlage 9 eigene,
// höhere Faktoren. Die beiden Zahlenreihen sind nicht austauschbar.

// Anlage 9 Nr. 3 GModG, Emissionsfaktoren in g CO2-Äquivalent je kWh.
// Fundstelle BGBl. I 2020, 1788-1789. Die laufende Nummer steht im Kommentar.
export const EMISSIONSFAKTOREN_G_JE_KWH = {
  heizoel: 310,                      // Nr. 1
  erdgas: 240,                       // Nr. 2
  fluessiggas: 270,                  // Nr. 3
  stromNetzbezogen: 560,             // Nr. 12
  fernwaermeKwkKohle: 300,           // Nr. 20 – KWK-Deckungsanteil >= 70 %
  fernwaermeKwkGasOel: 180,          // Nr. 21
  fernwaermeKwkErneuerbar: 40,       // Nr. 22
  fernwaermeHeizwerkKohle: 400,      // Nr. 23 – Heizwerk
  fernwaermeHeizwerkGasOel: 300,     // Nr. 24
  fernwaermeHeizwerkErneuerbar: 60,  // Nr. 25
};

// Fernwärme hat keinen bundesweit gültigen Emissionsfaktor: Anlage 9 trennt nach
// Erzeugung, und der netzscharfe Wert wird nach AGFW FW 309-1 vom Versorger
// ausgewiesen (AGFW, "GEG und Fernwärme", Stand 06/2025, abgerufen am
// 12.08.2026). Das Formular fragt die Erzeugung nicht ab, deshalb rechnet der
// Rechner mit dem in Deutschland häufigsten Fall – KWK mit gasförmigen oder
// flüssigen Brennstoffen – und weist das auf der Seite als Annahme aus:
// über 80 % der Fernwärme stammt aus KWK-Anlagen, Erdgas ist mit rund 45 % der
// meistgenutzte Brennstoff (AGFW-Hauptbericht, abgerufen am 12.08.2026).
export const FERNWAERME_RUECKFALL = 'fernwaermeKwkGasOel';

// § 9 Abs. 3 HeizkostenV: „Als Hi-Werte können verwendet werden für
// Leichtes Heizöl EL 10 kWh/l“. Die Bekanntmachung (Nr. 2) verweist dorthin.
// Nicht zu verwechseln mit den 10,046 kWh/l der EBeV in heizkosten.js.
export const HEIZWERT_HEIZOEL_EL_KWH_JE_LITER = 10;

// Jahresabrechnungen, die nach Nr. 2 der Bekanntmachung gemittelt werden.
export const ABRECHNUNGSJAHRE = 3;

// Energieträger im Formular: Einheit der Abrechnung, Umrechnung auf kWh und
// Zeile der Anlage 9. Wärmepumpe und Nachtspeicher sind beide Strom – die
// Jahresarbeitszahl steckt bereits im gemessenen Verbrauch.
export const VERBRAUCH_TRAEGER = Object.freeze({
  gas: { label: 'Erdgas', einheit: 'kWh', kwhJeEinheit: 1, faktor: 'erdgas', brennwertbezogen: true },
  heizoel: { label: 'Heizöl EL', einheit: 'Liter', kwhJeEinheit: HEIZWERT_HEIZOEL_EL_KWH_JE_LITER, faktor: 'heizoel', brennwertbezogen: false },
  fernwaerme: { label: 'Fernwärme', einheit: 'kWh', kwhJeEinheit: 1, faktor: FERNWAERME_RUECKFALL, brennwertbezogen: false },
  strom: { label: 'Strom (Wärmepumpe, Nachtspeicher)', einheit: 'kWh', kwhJeEinheit: 1, faktor: 'stromNetzbezogen', brennwertbezogen: false },
});

function traegerOderFehler(traeger) {
  const t = VERBRAUCH_TRAEGER[traeger];
  if (!t) {
    throw new Error(`Unbekannter Energieträger: ${traeger}`);
  }
  return t;
}

const positiv = (wert) => Number.isFinite(Number(wert)) && Number(wert) > 0;

/**
 * Emissionsfaktor eines Energieträgers in kg CO2-Äquivalent je kWh Endenergie.
 * Unbekannte Energieträger werfen: Ein stiller Rückfallwert wäre eine
 * erfundene Zahl.
 */
export function co2FaktorJeKwhEndenergie(traeger) {
  return EMISSIONSFAKTOREN_G_JE_KWH[traegerOderFehler(traeger).faktor] / 1000;
}

/**
 * Verbrauchskennwert nach § 82 Abs. 2 GModG aus bis zu drei Jahresabrechnungen.
 *
 * @param {object} e
 * @param {keyof VERBRAUCH_TRAEGER} e.traeger
 * @param {Array<number|string>} e.jahresmengen Heizung und zentrales Warmwasser je Jahr, in der Einheit der Abrechnung
 * @param {number} [e.wohnflaeche] für die Pauschale nach § 82 Abs. 2 Satz 4
 * @param {number} [e.gebaeudenutzflaeche] falls bekannt; hat Vorrang
 * @param {boolean} [e.mitBeheiztemKeller] nur bei höchstens zwei Wohneinheiten
 * @param {boolean} [e.dezentralesWarmwasser] Verbrauch dafür nicht bekannt
 * @returns {null | {jahre: number, vollstaendig: boolean, mittelKwh: number,
 *   nutzflaeche: number, flaecheGeschaetzt: boolean, kwhJeQm: number,
 *   klasse: string, co2KgJeQm: number, brennwertbezogen: boolean}}
 */
export function verbrauchskennwert({
  traeger,
  jahresmengen = [],
  wohnflaeche = 0,
  gebaeudenutzflaeche = 0,
  mitBeheiztemKeller = false,
  dezentralesWarmwasser = false,
}) {
  const t = traegerOderFehler(traeger);
  const jahre = jahresmengen.filter(positiv).map(Number).slice(0, ABRECHNUNGSJAHRE);
  const flaecheBekannt = positiv(gebaeudenutzflaeche);
  const flaeche = flaecheBekannt
    ? Number(gebaeudenutzflaeche)
    : nutzflaecheAusWohnflaeche(wohnflaeche, mitBeheiztemKeller);
  if (jahre.length === 0 || flaeche <= 0) return null;

  const mittelKwh = (jahre.reduce((summe, n) => summe + n, 0) / jahre.length) * t.kwhJeEinheit;
  const heizungJeQm = mittelKwh / flaeche;
  // Der Warmwasserzuschlag zählt für Kennwert und Klasse. Beim CO2 bleibt er
  // außen vor, weil der Energieträger des dezentralen Warmwassers nicht
  // abgefragt wird.
  const kwhJeQm = Math.round(heizungJeQm + (dezentralesWarmwasser ? ZUSCHLAG_DEZENTRALES_WARMWASSER : 0));

  return {
    jahre: jahre.length,
    vollstaendig: jahre.length === ABRECHNUNGSJAHRE,
    mittelKwh: Math.round(mittelKwh),
    nutzflaeche: Math.round(flaeche * 10) / 10,
    flaecheGeschaetzt: !flaecheBekannt,
    kwhJeQm,
    klasse: effizienzklasse(kwhJeQm),
    co2KgJeQm: Math.round(heizungJeQm * co2FaktorJeKwhEndenergie(traeger) * 10) / 10,
    brennwertbezogen: t.brennwertbezogen,
  };
}

/**
 * Welche Ausweisart § 80 Abs. 3 GModG bei Verkauf oder Vermietung verlangt.
 *
 * @param {object} e
 * @param {number} e.wohnungen Wohnungen im Wohngebäude
 * @param {boolean} e.bauantragVor1977 Bauantrag vor dem 1. November 1977
 * @param {'ja'|'nein'|'unbekannt'} e.waermeschutz1977 Anforderungsniveau der
 *   WSchVO vom 11.08.1977 bei Fertigstellung oder durch spätere Änderungen erreicht
 * @returns {null | {art: 'bedarf'|'wahl', grund: string}}
 */
export function ausweisPflicht({ wohnungen, bauantragVor1977, waermeschutz1977 }) {
  if (!Number.isInteger(wohnungen) || wohnungen < 1) return null;

  if (wohnungen >= 5) {
    return { art: 'wahl', grund: 'Das Gebäude hat fünf oder mehr Wohnungen; § 80 Abs. 3 Satz 2 GModG greift nicht.' };
  }
  if (!bauantragVor1977) {
    return { art: 'wahl', grund: 'Der Bauantrag wurde nicht vor dem 1. November 1977 gestellt; § 80 Abs. 3 Satz 2 GModG greift nicht.' };
  }
  if (waermeschutz1977 === 'ja') {
    return { art: 'wahl', grund: 'Das Gebäude erreicht das Anforderungsniveau der Wärmeschutzverordnung von 1977; nach § 80 Abs. 3 Satz 3 GModG ist Satz 2 nicht anzuwenden.' };
  }
  return { art: 'bedarf', grund: 'Weniger als fünf Wohnungen und Bauantrag vor dem 1. November 1977: § 80 Abs. 3 Satz 2 GModG schreibt einen Energiebedarfsausweis vor, solange die Ausnahme nach Satz 3 nicht greift.' };
}
