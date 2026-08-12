// Bußgeldkatalog: Regelsätze, Punkte und Fahrverbote für die häufigsten
// Verkehrsverstöße.
//
// Datengrundlage ist die Anlage zur Bußgeldkatalog-Verordnung (BKatV) in der
// seit dem 9. November 2021 geltenden Fassung samt Tabelle 1 und Tabelle 2 des
// Anhangs, abgerufen am 12.08.2026 unter
// https://www.gesetze-im-internet.de/bkatv_2013/
//
// Zwei Dinge lassen sich aus dem Katalog nicht ablesen und werden hier
// ausdrücklich abgebildet:
//
// 1. Das Fahrverbot steht nicht in jeder Zeile. § 4 Abs. 1 BKatV nennt die
//    Nummern, bei denen ein Regelfahrverbot in Betracht kommt; § 4 Abs. 2
//    ergänzt den beharrlichen Wiederholungstäter ab 26 km/h. Ein Rechner, der
//    das Fahrverbot allein an die Höhe des Bußgelds knüpft, liegt daneben.
// 2. Die Punkte stehen gar nicht im Bußgeldkatalog, sondern folgen aus
//    § 28 Abs. 3 Nr. 3 StVG in Verbindung mit Anlage 13 FeV.

export const BKAT_STAND = '9. November 2021';

// Absolute Fahruntüchtigkeit eines Kraftfahrzeugführers, ab der die Tat keine
// Ordnungswidrigkeit mehr ist, sondern eine Straftat nach § 316 StGB. Der oft
// genannte Wert von 1,6 Promille gilt für Radfahrer, nicht für Autofahrer.
export const PROMILLE_STRAFTAT = 1.1;

// Grenzwert des § 24a Abs. 1 StVG.
export const PROMILLE_OWI = 0.5;

// Ab dieser Geldbuße wird die Tat in das Fahreignungsregister eingetragen,
// § 28 Abs. 3 Nr. 3 Buchst. a StVG.
const EINTRAGUNGSGRENZE_EURO = 60;

/**
 * Punkte im Fahreignungsregister nach Anlage 13 FeV.
 *
 * Wird die Tat mit einem Fahrverbot geahndet, sind es zwei Punkte; sonst ein
 * Punkt, sobald die Geldbuße die Eintragungsgrenze erreicht. Gilt nur für die
 * in Anlage 13 FeV aufgeführten Tatbestände – Halten und Parken gehören nicht
 * dazu und tragen ihre Punktzahl deshalb in den Daten selbst.
 *
 * @param {number} bussgeld Regelsatz in Euro
 * @param {number} fahrverbot Dauer des Fahrverbots in Monaten
 * @returns {number} Punkte
 */
function punkteNachAnlage13(bussgeld, fahrverbot) {
  if (fahrverbot > 0) return 2;
  return bussgeld >= EINTRAGUNGSGRENZE_EURO ? 1 : 0;
}

// Tabelle 1 Buchstabe c des Anhangs zur BKatV: Geschwindigkeitsüberschreitung
// mit anderen als kennzeichnungspflichtigen Kraftfahrzeugen, also mit Pkw und
// Motorrad. Für Lkw und Kraftomnibusse gelten die deutlich höheren Sätze der
// Buchstaben a und b, die dieses Modul nicht abbildet.
// Format: [bis einschließlich km/h Überschreitung, Regelsatz, Fahrverbot Monate]
const GESCHWINDIGKEIT = {
  innerorts: [
    [10, 30, 0],
    [15, 50, 0],
    [20, 70, 0],
    [25, 115, 0],
    [30, 180, 0],
    [40, 260, 1],
    [50, 400, 1],
    [60, 560, 2],
    [70, 700, 3],
    [Infinity, 800, 3],
  ],
  ausserorts: [
    [10, 20, 0],
    [15, 40, 0],
    [20, 60, 0],
    [25, 100, 0],
    [30, 150, 0],
    [40, 200, 0],
    [50, 320, 1],
    [60, 480, 1],
    [70, 600, 2],
    [Infinity, 700, 3],
  ],
};

// § 4 Abs. 2 Satz 2 BKatV: Wer innerhalb eines Jahres nach Rechtskraft einer
// Geldbuße wegen mindestens 26 km/h erneut mindestens 26 km/h zu schnell ist,
// handelt beharrlich. Das Fahrverbot beträgt beim ersten Mal einen Monat.
const BEHARRLICH_AB_KMH = 26;
const BEHARRLICH_FAHRVERBOT_MONATE = 1;

// Nummern 132 bis 132.3.2 BKat. Die Rotphase und die Folge des Verstoßes sind
// zwei unabhängige Merkmale; der Katalog kombiniert sie zu sechs Tatbeständen.
const ROTLICHT = {
  unter1s: {
    keine: { bussgeld: 90, fahrverbot: 0, nummer: '132' },
    gefaehrdung: { bussgeld: 200, fahrverbot: 1, nummer: '132.1' },
    sachbeschaedigung: { bussgeld: 240, fahrverbot: 1, nummer: '132.2' },
  },
  ueber1s: {
    keine: { bussgeld: 200, fahrverbot: 1, nummer: '132.3' },
    gefaehrdung: { bussgeld: 320, fahrverbot: 1, nummer: '132.3.1' },
    sachbeschaedigung: { bussgeld: 360, fahrverbot: 1, nummer: '132.3.2' },
  },
};

// Nummer 246 BKat. § 23 Abs. 1a StVO richtet sich an Fahrzeugführer; für
// Fußgänger mit Mobiltelefon gibt es keinen Bußgeldtatbestand.
const HANDY = {
  kfz: { bussgeld: 100, fahrverbot: 0, nummer: '246.1', label: 'Beim Führen eines Kraftfahrzeugs' },
  kfz_gefaehrdung: { bussgeld: 150, fahrverbot: 1, nummer: '246.2', label: 'Beim Führen eines Kraftfahrzeugs, mit Gefährdung' },
  kfz_sachbeschaedigung: { bussgeld: 200, fahrverbot: 1, nummer: '246.3', label: 'Beim Führen eines Kraftfahrzeugs, mit Sachbeschädigung' },
  radfahren: { bussgeld: 55, fahrverbot: 0, nummer: '246.4', label: 'Beim Radfahren' },
};

// Tabelle 2 des Anhangs zur BKatV. Bezugsgröße ist der halbe Tachowert in
// Metern, nicht der volle. Die Stufen greifen, wenn der gemessene Abstand
// *weniger als* den angegebenen Bruchteil des halben Tachowertes beträgt.
// Format: [Bruchteil, Regelsatz, Fahrverbot Monate, Nummer]
const ABSTAND_TABELLE = {
  a: [
    [0.5, 75, 0, '12.5.1'],
    [0.4, 100, 0, '12.5.2'],
    [0.3, 160, 0, '12.5.3'],
    [0.2, 240, 0, '12.5.4'],
    [0.1, 320, 0, '12.5.5'],
  ],
  b: [
    [0.5, 75, 0, '12.6.1'],
    [0.4, 100, 0, '12.6.2'],
    [0.3, 160, 1, '12.6.3'],
    [0.2, 240, 2, '12.6.4'],
    [0.1, 320, 3, '12.6.5'],
  ],
  c: [
    [0.5, 100, 0, '12.7.1'],
    [0.4, 180, 0, '12.7.2'],
    [0.3, 240, 1, '12.7.3'],
    [0.2, 320, 2, '12.7.4'],
    [0.1, 400, 3, '12.7.5'],
  ],
};

const ABSTAND_BIS_80 = { bussgeld: 25, fahrverbot: 0, nummer: '12.1' };
const ABSTAND_UEBER_80_GERING = { bussgeld: 35, fahrverbot: 0, nummer: '12.4' };

// Nummer 241 BKat zu § 24a Abs. 1 StVG. Der Katalog staffelt nicht nach der
// Höhe der Blutalkoholkonzentration, sondern nach bereits eingetragenen
// Entscheidungen im Fahreignungsregister.
const ALKOHOL_STUFEN = [
  { bussgeld: 500, fahrverbot: 1, nummer: '241', label: 'Erstverstoß' },
  { bussgeld: 1000, fahrverbot: 3, nummer: '241.1', label: 'Eine Voreintragung' },
  { bussgeld: 1500, fahrverbot: 3, nummer: '241.2', label: 'Mehrere Voreintragungen' },
];

// Halten, Parken und Rettungsgasse. Halte- und Parkverstöße sind nicht in
// Anlage 13 FeV aufgeführt und bleiben deshalb punktfrei, auch wenn der
// Regelsatz die Eintragungsgrenze von 60 Euro überschreitet.
const PARKEN = {
  halten_unzulaessig: { bussgeld: 20, punkte: 0, fahrverbot: 0, nummer: '51', label: 'Unzulässig gehalten' },
  halten_behinderung: { bussgeld: 35, punkte: 0, fahrverbot: 0, nummer: '51.1', label: 'Unzulässig gehalten, mit Behinderung' },
  zweite_reihe: { bussgeld: 55, punkte: 0, fahrverbot: 0, nummer: '51a', label: 'In zweiter Reihe gehalten' },
  halteverbot_parken: { bussgeld: 25, punkte: 0, fahrverbot: 0, nummer: '52', label: 'Geparkt, wo das Halten verboten ist' },
  halteverbot_parken_behinderung: { bussgeld: 40, punkte: 0, fahrverbot: 0, nummer: '52.1', label: 'Geparkt, wo das Halten verboten ist, mit Behinderung' },
  gehweg_radweg: { bussgeld: 55, punkte: 0, fahrverbot: 0, nummer: '52a', label: 'Auf Geh- oder Radweg geparkt' },
  gehweg_radweg_behinderung: { bussgeld: 70, punkte: 0, fahrverbot: 0, nummer: '52a.1', label: 'Auf Geh- oder Radweg geparkt, mit Behinderung' },
  feuerwehrzufahrt: { bussgeld: 55, punkte: 0, fahrverbot: 0, nummer: '53', label: 'In einer Feuerwehrzufahrt geparkt' },
  feuerwehrzufahrt_behinderung: { bussgeld: 100, punkte: 0, fahrverbot: 0, nummer: '53.1', label: 'In einer Feuerwehrzufahrt geparkt, Rettungsfahrzeug behindert' },
  kreuzung_5m: { bussgeld: 10, punkte: 0, fahrverbot: 0, nummer: '54', label: 'Weniger als 5 m vor der Kreuzung geparkt' },
  bushaltestelle: { bussgeld: 55, punkte: 0, fahrverbot: 0, nummer: '54.4', label: 'An einer Haltestelle geparkt (Zeichen 224)' },
  schwerbehindertenparkplatz: { bussgeld: 55, punkte: 0, fahrverbot: 0, nummer: '55', label: 'Unberechtigt auf einem Schwerbehindertenparkplatz geparkt' },
  rettungsgasse_nicht_gebildet: { bussgeld: 200, punkte: 2, fahrverbot: 1, nummer: '50', label: 'Keine Rettungsgasse gebildet' },
  rettungsgasse_benutzt: { bussgeld: 240, punkte: 2, fahrverbot: 1, nummer: '50a', label: 'Rettungsgasse unberechtigt befahren' },
};

/**
 * Geschwindigkeitsüberschreitung mit Pkw oder Motorrad.
 *
 * @param {object} eingaben
 * @param {string} eingaben.ort 'innerorts' oder 'ausserorts'
 * @param {number} eingaben.ueberschreitung km/h über der zulässigen
 *   Höchstgeschwindigkeit, nach Abzug der Messtoleranz
 * @param {boolean} [eingaben.voreintragung] bereits eine rechtskräftige
 *   Geldbuße wegen mindestens 26 km/h innerhalb des letzten Jahres
 * @returns {{bussgeld: number, punkte: number, fahrverbot: number,
 *   beharrlich: boolean}}
 */
export function berechneGeschwindigkeit({ ort, ueberschreitung, voreintragung = false }) {
  const tabelle = GESCHWINDIGKEIT[ort] || GESCHWINDIGKEIT.innerorts;
  const index = tabelle.findIndex(([max]) => ueberschreitung <= max);
  const [, bussgeld, regelfahrverbot] = tabelle[index];
  // Beide Ortslagen stehen in derselben Zeile der Tabelle 1 Buchstabe c und
  // teilen sich deshalb die laufende Nummer 11.3.1 bis 11.3.10.
  const nummer = `11.3.${index + 1}`;

  const beharrlich = Boolean(voreintragung) && ueberschreitung >= BEHARRLICH_AB_KMH;
  const fahrverbot =
    beharrlich && regelfahrverbot === 0 ? BEHARRLICH_FAHRVERBOT_MONATE : regelfahrverbot;

  return {
    bussgeld,
    punkte: punkteNachAnlage13(bussgeld, fahrverbot),
    fahrverbot,
    beharrlich,
    nummer,
  };
}

/**
 * Rotlichtverstoß eines Kraftfahrzeugführers.
 *
 * @param {object} eingaben
 * @param {string} [eingaben.rotphase] 'unter1s' oder 'ueber1s'
 * @param {string} [eingaben.folge] 'keine', 'gefaehrdung' oder 'sachbeschaedigung'
 */
export function berechneRotlicht({ rotphase, folge } = {}) {
  const gruppe = ROTLICHT[rotphase] || ROTLICHT.unter1s;
  const eintrag = gruppe[folge] || gruppe.keine;
  return {
    ...eintrag,
    punkte: punkteNachAnlage13(eintrag.bussgeld, eintrag.fahrverbot),
  };
}

/**
 * Rechtswidrige Nutzung eines elektronischen Geräts, § 23 Abs. 1a StVO.
 *
 * @param {object} eingaben
 * @param {string} eingaben.situation Schlüssel aus HANDY
 * @returns {object|null} null, wenn der Bußgeldkatalog dafür keinen Regelsatz
 *   vorsieht – etwa für Fußgänger
 */
export function berechneHandy({ situation } = {}) {
  const eintrag = HANDY[situation];
  if (!eintrag) return null;
  return {
    ...eintrag,
    punkte: punkteNachAnlage13(eintrag.bussgeld, eintrag.fahrverbot),
  };
}

/**
 * Abstandsverstoß nach Nummer 12 BKat und Tabelle 2 des Anhangs.
 *
 * Der erforderliche Abstand entspricht dem halben Tachowert in Metern
 * (§ 4 Abs. 1 StVO, ständige Rechtsprechung). Alle Stufen der Tabelle 2 sind
 * Bruchteile dieses halben Tachowertes, nicht des vollen.
 *
 * @param {object} eingaben
 * @param {number} eingaben.geschwindigkeit gefahrene Geschwindigkeit in km/h
 * @param {number} eingaben.abstandMeter gemessener Abstand in Metern
 * @returns {object|null} null, wenn der Abstand ausreichte
 */
export function berechneAbstand({ geschwindigkeit, abstandMeter }) {
  const halberTacho = geschwindigkeit / 2;
  if (!(halberTacho > 0) || abstandMeter >= halberTacho) return null;

  if (geschwindigkeit <= 80) {
    return { ...ABSTAND_BIS_80, punkte: 0, anteilHalberTacho: abstandMeter / halberTacho };
  }

  const anteil = abstandMeter / halberTacho;
  if (anteil >= 0.5) {
    return { ...ABSTAND_UEBER_80_GERING, punkte: 0, anteilHalberTacho: anteil };
  }

  const buchstabe = geschwindigkeit > 130 ? 'c' : geschwindigkeit > 100 ? 'b' : 'a';
  // Die strengste Stufe gewinnt: gesucht ist die kleinste Schwelle, die der
  // gemessene Anteil noch unterschreitet.
  const stufen = ABSTAND_TABELLE[buchstabe];
  const [, bussgeld, fahrverbot, nummer] = stufen
    .slice()
    .reverse()
    .find(([schwelle]) => anteil < schwelle) ?? stufen[0];

  return {
    bussgeld,
    punkte: punkteNachAnlage13(bussgeld, fahrverbot),
    fahrverbot,
    nummer,
    anteilHalberTacho: anteil,
  };
}

/**
 * Alkohol am Steuer im Ordnungswidrigkeitenbereich, § 24a Abs. 1 StVG.
 *
 * @param {object} eingaben
 * @param {number} eingaben.promille Blutalkoholkonzentration
 * @param {number} [eingaben.voreintragungen] Zahl der bereits eingetragenen
 *   Entscheidungen nach § 24a StVG, § 316 oder § 315c StGB
 * @returns {{art: string, bussgeld?: number, punkte?: number,
 *   fahrverbot?: number}} art ist 'kein_verstoss', 'owi' oder 'straftat'
 */
export function berechneAlkohol({ promille, voreintragungen = 0 }) {
  if (promille >= PROMILLE_STRAFTAT) return { art: 'straftat' };
  if (promille < PROMILLE_OWI) return { art: 'kein_verstoss' };

  const stufe = ALKOHOL_STUFEN[Math.min(voreintragungen, ALKOHOL_STUFEN.length - 1)];
  return {
    art: 'owi',
    ...stufe,
    punkte: punkteNachAnlage13(stufe.bussgeld, stufe.fahrverbot),
  };
}

/**
 * Halte-, Park- und Rettungsgassenverstöße.
 *
 * @param {object} eingaben
 * @param {string} eingaben.typ Schlüssel aus PARKEN
 * @returns {object|null} null bei unbekanntem Tatbestand
 */
export function berechneParken({ typ }) {
  const eintrag = PARKEN[typ];
  return eintrag ? { ...eintrag } : null;
}
