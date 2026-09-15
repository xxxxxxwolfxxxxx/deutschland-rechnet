// Wirtschaftlichkeit eines Batteriespeichers an einer PV-Anlage
//
// Der Speicher verdient nichts an der Erzeugung, sondern allein an der
// Umwidmung: Eine Kilowattstunde, die sonst für die Einspeisevergütung ins
// Netz geflossen wäre, ersetzt stattdessen teuren Netzstrom. Sein Vorteil ist
// deshalb nicht der Strompreis, sondern die Differenz aus Strompreis und
// Einspeisevergütung. Wer mit dem vollen Strompreis rechnet, überschätzt die
// Ersparnis um rund ein Viertel.
//
// Der zweite häufige Fehler ist die Bezugsgröße: „30 Prozent Eigenverbrauch“
// meint je nach Quelle den Anteil am Ertrag oder den Anteil am Verbrauch. Bei
// einer Anlage, die mehr erzeugt, als der Haushalt braucht, gehen beide Zahlen
// weit auseinander. Dieses Modul weist beide getrennt aus:
//
//   Eigenverbrauchsquote = selbst genutzter Strom / Jahresertrag
//   Autarkiegrad         = selbst genutzter Strom / Jahresstromverbrauch
//
// Quellen: Einspeisevergütung nach § 48 Abs. 2 EEG über ./photovoltaik.js;
// spezifischer Ertrag ebenda. Die Nutzungsannahmen für den Speicher sind
// Planungsgrößen, keine Rechtsgrößen.

import { verguetungProKwh, SPEZIFISCHER_ERTRAG } from './photovoltaik.js';
import { STROMPREIS_CENT_PRO_KWH } from './strompreis.js';

// Anteil des Jahresstromverbrauchs, der ohne Speicher direkt aus der Anlage
// gedeckt wird. Er hängt allein davon ab, wie viel Last in die Stunden mit
// Erzeugung fällt – bei einem Haushaltsprofil mit Abendspitze rund 30 %.
export const DIREKTVERBRAUCH_ANTEIL = 0.3;

// Round-Trip-Wirkungsgrad des Speichers samt Wechselrichter (AC nach AC).
export const SPEICHER_WIRKUNGSGRAD = 0.92;

// An rund 250 Tagen im Jahr liefert die Anlage genug Überschuss, um den
// Speicher zu füllen. An den übrigen Tagen – im Winterhalbjahr und bei
// Schlechtwetter – bleibt er teilweise leer. Mit 365 Zyklen zu rechnen ist
// der dritte verbreitete Fehler.
export const SPEICHER_NUTZTAGE = 250;

const TAGE_JE_JAHR = 365;

function rundeAufCent(betrag) {
  return Math.round(betrag * 100) / 100;
}

// Eingaben aus Formularfeldern kommen als Text und können leer sein.
function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Jahresbilanz einer PV-Anlage mit und ohne Batteriespeicher.
 *
 * Nicht abgebildet: Strompreissteigerung, Zinsen auf das eingesetzte Kapital,
 * Alterung des Speichers und Installationskosten neben dem Speicherpreis. Die
 * Amortisation ist deshalb eine nominale Rechnung in heutigen Preisen und
 * fällt tendenziell zu günstig aus.
 *
 * @param {object} eingaben
 * @param {number} eingaben.speicher nutzbare Speicherkapazität in kWh
 * @param {number} eingaben.pvLeistung installierte Leistung in kWp
 * @param {number} eingaben.stromverbrauch Jahresstromverbrauch in kWh
 * @param {number} eingaben.strompreis Bezugspreis in Cent je kWh
 * @param {number} eingaben.speicherkosten Preis in Euro je kWh Kapazität
 */
export function berechneStromspeicher({
  speicher,
  pvLeistung,
  stromverbrauch,
  strompreis = STROMPREIS_CENT_PRO_KWH,
  speicherkosten,
}) {
  const kapazitaet = zahl(speicher);
  const leistung = zahl(pvLeistung);
  const verbrauch = zahl(stromverbrauch);
  const preis = zahl(strompreis) / 100; // Euro je kWh
  const verguetung = verguetungProKwh(leistung);

  const jahresertrag = leistung * SPEZIFISCHER_ERTRAG;

  // Ohne Speicher: Was zeitgleich zur Erzeugung gebraucht wird, höchstens
  // aber, was die Anlage überhaupt liefert.
  const direktKwh = Math.min(verbrauch * DIREKTVERBRAUCH_ANTEIL, jahresertrag);
  const ueberschussKwh = jahresertrag - direktKwh;
  const restverbrauchKwh = verbrauch - direktKwh;

  // Mit Speicher: Pro Tag lässt sich nicht mehr entladen, als der Haushalt
  // außerhalb der Erzeugungsstunden braucht – ein größerer Speicher steht
  // dann teilweise ungenutzt. Über das Jahr begrenzt zusätzlich der
  // Überschuss, der überhaupt zum Laden zur Verfügung steht.
  const entladungProTag = Math.min(
    kapazitaet * SPEICHER_WIRKUNGSGRAD,
    restverbrauchKwh / TAGE_JE_JAHR,
  );
  const speicherKwh = Math.min(entladungProTag * SPEICHER_NUTZTAGE, ueberschussKwh);

  const eigenverbrauchKwh = direktKwh + speicherKwh;
  const einspeisungKwh = jahresertrag - eigenverbrauchKwh;
  const netzbezugKwh = verbrauch - eigenverbrauchKwh;

  // Jahresvorteil der Anlage: ersparter Zukauf plus Vergütung für den Rest.
  const ohneSpeicher = direktKwh * preis + ueberschussKwh * verguetung;
  const mitSpeicher = eigenverbrauchKwh * preis + einspeisungKwh * verguetung;

  // Identisch zur Differenz beider Bilanzen, nur ohne Rundungsfehler.
  const ersparnis = speicherKwh * (preis - verguetung);

  const investition = kapazitaet * zahl(speicherkosten);
  const amortisation = ersparnis > 0 ? Math.round((investition / ersparnis) * 10) / 10 : null;

  const anteil = (menge, bezug) => (bezug > 0 ? Math.round((menge / bezug) * 100) : 0);

  return {
    direktKwh: Math.round(direktKwh),
    speicherKwh: Math.round(speicherKwh),
    eigenverbrauchKwh: Math.round(eigenverbrauchKwh),
    einspeisungKwh: Math.round(einspeisungKwh),
    netzbezugKwh: Math.round(netzbezugKwh),
    netzstromkosten: rundeAufCent(netzbezugKwh * preis),
    ohneSpeicher: rundeAufCent(ohneSpeicher),
    mitSpeicher: rundeAufCent(mitSpeicher),
    ersparnis: rundeAufCent(ersparnis),
    investition: rundeAufCent(investition),
    amortisation,
    eigenverbrauchsquote: anteil(eigenverbrauchKwh, jahresertrag),
    autarkiegrad: anteil(eigenverbrauchKwh, verbrauch),
    verguetungCentProKwh: rundeAufCent(verguetung * 100),
  };
}

/**
 * Speichergrößen im Vergleich: Was jede zusätzliche Kilowattstunde Kapazität
 * im Jahr noch einbringt, und bis zu welcher Größe sie ihren Preis über die
 * angenommene Nutzungsdauer wieder hereinholt.
 *
 * Die frühere Dimensionierungsseite rechnete mit eigenen Nachtanteilen und
 * Deckeln ohne Quelle. Hier entsteht die Empfehlung aus derselben
 * Jahresbilanz wie im Stromspeicher-Rechner: Solange die nächste Stufe über
 * die Nutzungsdauer mehr einspart, als sie kostet, lohnt sie sich; danach
 * nicht mehr. Nicht abgebildet sind Zinsen, Strompreisänderungen und die
 * Alterung – die Empfehlung ist deshalb eine Obergrenze.
 *
 * @param {object} e
 * @param {number} e.pvLeistung kWp
 * @param {number} e.stromverbrauch kWh im Jahr
 * @param {number} [e.strompreis] Cent je kWh
 * @param {number} e.preisJeKwh Speicherpreis in Euro je kWh Kapazität
 * @param {number} e.nutzungsdauer Jahre
 * @param {number[]} [e.groessen] zu vergleichende Kapazitäten in kWh, aufsteigend
 */
export function vergleicheSpeichergroessen({
  pvLeistung,
  stromverbrauch,
  strompreis = STROMPREIS_CENT_PRO_KWH,
  preisJeKwh,
  nutzungsdauer,
  groessen = [2, 4, 6, 8, 10, 12, 15],
}) {
  const jahre = zahl(nutzungsdauer);
  const preis = zahl(preisJeKwh);
  let vorher = { speicher: 0, ersparnis: 0 };
  let empfehlung = 0;
  let nochSteigend = true;

  const zeilen = groessen.map((speicher) => {
    const r = berechneStromspeicher({ speicher, pvLeistung, stromverbrauch, strompreis, speicherkosten: preis });
    const mehrKapazitaet = speicher - vorher.speicher;
    const mehrErsparnis = r.ersparnis - vorher.ersparnis;
    const grenzertragJeKwh = mehrKapazitaet > 0 ? rundeAufCent(mehrErsparnis / mehrKapazitaet) : 0;
    // Lohnt die Stufe über die Nutzungsdauer? Nur solange alle kleineren
    // Stufen es auch taten – sonst würde ein Ausreißer die Empfehlung heben.
    const lohntStufe = mehrErsparnis * jahre >= mehrKapazitaet * preis && mehrErsparnis > 0;
    if (nochSteigend && lohntStufe) empfehlung = speicher;
    else nochSteigend = false;
    vorher = { speicher, ersparnis: r.ersparnis };
    return {
      speicher,
      ersparnis: r.ersparnis,
      speicherKwh: r.speicherKwh,
      autarkiegrad: r.autarkiegrad,
      eigenverbrauchsquote: r.eigenverbrauchsquote,
      investition: r.investition,
      amortisation: r.amortisation,
      grenzertragJeKwh,
      lohntStufe,
    };
  });

  return { zeilen, empfehlung };
}
