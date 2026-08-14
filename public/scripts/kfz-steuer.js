// Kraftfahrzeugsteuer für Pkw, Krafträder und Elektrofahrzeuge
//
// Quelle: Kraftfahrzeugsteuergesetz (KraftStG) in der Fassung der Bekanntmachung
// vom 26.09.2002, zuletzt geändert durch Art. 1 des Gesetzes vom 22.12.2025
// (BGBl. 2025 I Nr. 342), abgerufen am 14.08.2026 über
// https://www.gesetze-im-internet.de/kraftstg/xml.zip
//
// Die Bemessungsgrundlage hängt ausschließlich am Tag der ERSTZULASSUNG
// (§ 8 Nr. 1 KraftStG), nicht am Kalenderjahr der Rechnung. Es gibt drei
// Regime nebeneinander, und alle drei sind bis heute in Kraft:
//
//   bis 30.06.2009   Hubraum mal Satz der Schadstoffklasse (§ 9 Abs. 1 Nr. 2 a)
//                    – keine CO2-Komponente
//   01.07.2009 bis   Hubraum plus 2,00 EUR je g/km über einem Freibetrag, der
//   31.12.2020       nach dem Zulassungsjahr 120, 110 oder 95 g/km beträgt
//                    (§ 9 Abs. 1 Nr. 2 b)
//   ab 01.01.2021    Hubraum plus eine sechsstufige CO2-Staffel ab 95 g/km
//                    (§ 9 Abs. 1 Nr. 2 c)
//
// Eine "Kfz-Steuer-Reform 2024" hat es nicht gegeben; die letzte Änderung des
// § 9 Abs. 1 Nr. 2 stammt aus dem Siebten KraftStG-Änderungsgesetz von 2020.
// Der CO2-Freibetrag hängt am Zulassungsdatum, NICHT an der Kraftstoffart.
//
// NICHT abgebildet: Wohnmobile (§ 9 Abs. 1 Nr. 2a), dreirädrige und leichte
// vierrädrige Kfz (Nr. 2b), Fahrzeuge über 3,5 t (Nr. 4), Anhänger (Nr. 5),
// Oldtimer- und rote Kennzeichen (§ 9 Abs. 4: 191,73 EUR, für Krafträder
// 46,02 EUR), der ausgelaufene Partikelzuschlag des § 9a (bis 31.03.2011) und
// die Entlastung des § 10b (30 EUR jährlich, endete am 31.12.2025).

export const HUBRAUMSATZ_AB_2009 = { benzin: 2.0, diesel: 9.5 };

// § 9 Abs. 1 Nr. 2 Buchst. c: Teilmengenstaffel – jedes Gramm wird mit dem Satz
// SEINER Klasse belegt, nicht der ganze Wert mit dem höchsten erreichten Satz.
export const CO2_STAFFEL_AB_2021 = [
  { bis: 115, satz: 2.0 },
  { bis: 135, satz: 2.2 },
  { bis: 155, satz: 2.5 },
  { bis: 175, satz: 2.9 },
  { bis: 195, satz: 3.4 },
  { bis: Infinity, satz: 4.0 },
];

export const CO2_FREIBETRAG_AB_2021 = 95;

// § 9 Abs. 1 Nr. 2 Buchst. b: Freibetrag nach dem Datum der Erstzulassung.
const CO2_FREIBETRAEGE_2009_BIS_2020 = [
  { ab: '2014-01-01', freibetrag: 95 },
  { ab: '2012-01-01', freibetrag: 110 },
  { ab: '2009-07-01', freibetrag: 120 },
];

// § 9 Abs. 1 Nr. 2 Buchst. a, Doppelbuchstaben aa bis ee, je 100 ccm.
// Die Schlüssel folgen der geläufigen Bezeichnung; maßgeblich ist die
// emissionsbezogene Schlüsselnummer in der Zulassungsbescheinigung Teil I.
export const SCHADSTOFFSAETZE_VOR_2009 = {
  euro3: { benzin: 6.75, diesel: 15.44 },   // aa: Euro 3 und besser oder CO2 bis 90 g/km
  euro2: { benzin: 7.36, diesel: 16.05 },   // bb: Euro 2
  euro1: { benzin: 15.13, diesel: 27.35 },  // cc: Euro 1, kein Ozon-Fahrverbot
  euro0_ohne_fahrverbot: { benzin: 21.07, diesel: 33.29 }, // dd
  euro0: { benzin: 25.36, diesel: 37.58 },  // ee: alle übrigen
};

// § 9 Abs. 1 Nr. 3: Gewichtssteuer bis 3.500 kg, ebenfalls teilmengengestaffelt.
const GEWICHTSSTAFFEL_BIS_3500 = [
  { bis: 2000, satzJe200kg: 11.25 },
  { bis: 3000, satzJe200kg: 12.02 },
  { bis: 3500, satzJe200kg: 12.78 },
];

// § 3d Abs. 1 in der Fassung vom 22.12.2025. Vorher endete das Zulassungs-
// fenster am 31.12.2025 und die Befreiung spätestens am 31.12.2030 – wer diese
// Daten noch nennt, zitiert die alte Fassung.
export const ELEKTRO_BEFREIUNG = {
  zulassungVon: '2011-05-18',
  zulassungBis: '2030-12-31',
  jahre: 10,
  spaetestensBis: '2035-12-31',
};

// § 9 Abs. 2: Elektrofahrzeuge zahlen nur die Hälfte der Gewichtssteuer.
const ELEKTRO_ERMAESSIGUNG = 0.5;

// § 11 Abs. 2: unterjährige Zahlung ist nur oberhalb dieser Jahressteuer
// zulässig und kostet ein Aufgeld.
const ENTRICHTUNG = {
  halbjahr: { abJahressteuer: 500, teiler: 2, aufgeld: 0.03 },
  vierteljahr: { abJahressteuer: 1000, teiler: 4, aufgeld: 0.06 },
};

const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;
const TAG_MS = 24 * 60 * 60 * 1000;

function alsTag(iso, feldname) {
  if (typeof iso !== 'string' || !ISO_DATUM.test(iso)) {
    throw new Error(`${feldname} muss als Datum im Format JJJJ-MM-TT angegeben werden.`);
  }
  const [jahr, monat, tag] = iso.split('-').map(Number);
  const ms = Date.UTC(jahr, monat - 1, tag);
  if (!Number.isFinite(ms)) throw new Error(`${feldname} ist kein gültiges Datum.`);
  return ms;
}

function alsIso(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function euro(betrag) {
  return Math.round(betrag * 100) / 100;
}

// § 9 Abs. 1: "für je 100 Kubikzentimeter Hubraum ODER EINEN TEIL DAVON" –
// jede angefangene Einheit zählt voll.
function angefangeneEinheiten(menge, einheit) {
  return Math.ceil(Math.max(0, menge) / einheit);
}

function staffelbetrag(wert, freibetrag, staffel) {
  let betrag = 0;
  let untergrenze = freibetrag;
  for (const { bis, satz } of staffel) {
    if (wert <= untergrenze) break;
    betrag += (Math.min(wert, bis) - untergrenze) * satz;
    untergrenze = bis;
  }
  return euro(betrag);
}

function gewichtssteuer(gesamtgewicht) {
  let betrag = 0;
  let untergrenze = 0;
  for (const { bis, satzJe200kg } of GEWICHTSSTAFFEL_BIS_3500) {
    if (gesamtgewicht <= untergrenze) break;
    const anteil = Math.min(gesamtgewicht, bis) - untergrenze;
    betrag += angefangeneEinheiten(anteil, 200) * satzJe200kg;
    untergrenze = bis;
  }
  return euro(betrag);
}

// § 3d Abs. 1: zehn Jahre ab dem Tag der Erstzulassung, längstens bis zum
// 31.12.2035, und nur für Erstzulassungen im gesetzlichen Fenster.
function elektroBefreiung(erstzulassungMs, stichtagMs) {
  const von = alsTag(ELEKTRO_BEFREIUNG.zulassungVon, 'Zulassungsfenster');
  const bis = alsTag(ELEKTRO_BEFREIUNG.zulassungBis, 'Zulassungsfenster');
  if (erstzulassungMs < von || erstzulassungMs > bis) {
    return { steuerbefreit: false, befreiungBis: null };
  }
  const ez = new Date(erstzulassungMs);
  const ablauf = Date.UTC(
    ez.getUTCFullYear() + ELEKTRO_BEFREIUNG.jahre, ez.getUTCMonth(), ez.getUTCDate());
  const letzterTag = Math.min(
    ablauf - TAG_MS, alsTag(ELEKTRO_BEFREIUNG.spaetestensBis, 'Höchstdauer'));
  return { steuerbefreit: stichtagMs <= letzterTag, befreiungBis: alsIso(letzterTag) };
}

function entrichtung(jahressteuer, art) {
  const { abJahressteuer, teiler, aufgeld } = ENTRICHTUNG[art];
  if (jahressteuer <= abJahressteuer) return null;
  return Math.floor((jahressteuer / teiler) * (1 + aufgeld)); // § 11 Abs. 5
}

/**
 * @param {object} eingabe
 * @param {'pkw'|'kraftrad'} [eingabe.fahrzeugart='pkw']
 * @param {'benzin'|'diesel'|'elektro'} [eingabe.antrieb='benzin']
 * @param {number} [eingabe.hubraum=0]  in Kubikzentimetern
 * @param {number} [eingabe.co2=0]  in g/km nach WLTP, Feld V.7 der Zulassungsbescheinigung
 * @param {string} eingabe.erstzulassung  JJJJ-MM-TT, Feld B der Zulassungsbescheinigung
 * @param {number} [eingabe.gesamtgewicht=0]  in kg, nur für Elektrofahrzeuge
 * @param {keyof SCHADSTOFFSAETZE_VOR_2009} [eingabe.schadstoffklasse='euro3']
 * @param {'keine'|'befreiung'|'haelfte'} [eingabe.ermaessigung='keine']  § 3a
 * @param {string} [eingabe.stichtag]  JJJJ-MM-TT, Tag der Beurteilung
 */
export function berechneKfzSteuer({
  fahrzeugart = 'pkw',
  antrieb = 'benzin',
  hubraum = 0,
  co2 = 0,
  erstzulassung,
  gesamtgewicht = 0,
  schadstoffklasse = 'euro3',
  ermaessigung = 'keine',
  stichtag,
} = {}) {
  if (erstzulassung === undefined || erstzulassung === null || erstzulassung === '') {
    throw new Error('Erstzulassung ist erforderlich: Sie bestimmt die Bemessungsgrundlage.');
  }
  const ez = alsTag(erstzulassung, 'Erstzulassung');
  const heute = stichtag ? alsTag(stichtag, 'Stichtag') : Date.now();

  const ccm = Math.max(0, hubraum || 0);
  const gramm = Math.max(0, co2 || 0);
  const kg = Math.max(0, gesamtgewicht || 0);
  const hinweise = [];

  let hubraumanteil = 0;
  let co2anteil = 0;
  let gewichtsanteil = 0;
  let co2Freibetrag = null;
  let rechtsgrundlage = '';
  let steuerbefreit = false;
  let befreiungBis = null;
  let grundbetrag = 0;

  if (antrieb === 'elektro') {
    ({ steuerbefreit, befreiungBis } = elektroBefreiung(ez, heute));
    rechtsgrundlage = steuerbefreit
      ? '§ 3d Abs. 1 KraftStG'
      : '§ 9 Abs. 1 Nr. 3 in Verbindung mit § 9 Abs. 2 KraftStG';
    if (!steuerbefreit && kg > 3500) {
      hinweise.push('Über 3.500 kg zulässigem Gesamtgewicht gilt die Staffel des '
        + '§ 9 Abs. 1 Nr. 4 KraftStG, die dieser Rechner nicht abbildet.');
      return {
        jahressteuer: null, jahressteuerAbgerundet: null,
        hubraumanteil: 0, co2anteil: 0, gewichtsanteil: 0, co2Freibetrag: null,
        rechtsgrundlage, steuerbefreit, befreiungBis,
        halbjaehrlich: null, vierteljaehrlich: null, monatlichRechnerisch: null,
        hinweise,
      };
    }
    gewichtsanteil = steuerbefreit ? 0 : gewichtssteuer(kg);
    grundbetrag = euro(gewichtsanteil * ELEKTRO_ERMAESSIGUNG);
    if (befreiungBis && !steuerbefreit) {
      const deutsch = befreiungBis.split('-').reverse().join('.');
      hinweise.push(`Die Befreiung nach § 3d KraftStG endete am ${deutsch}.`);
    }
  } else if (fahrzeugart === 'kraftrad') {
    // § 9 Abs. 1 Nr. 1: 1,84 EUR je angefangene 25 ccm, ohne CO2-Komponente.
    rechtsgrundlage = '§ 9 Abs. 1 Nr. 1 KraftStG';
    hubraumanteil = euro(angefangeneEinheiten(ccm, 25) * 1.84);
    grundbetrag = hubraumanteil;
  } else if (ez < alsTag('2009-07-01', 'Stichtag')) {
    rechtsgrundlage = '§ 9 Abs. 1 Nr. 2 Buchst. a KraftStG';
    const saetze = SCHADSTOFFSAETZE_VOR_2009[schadstoffklasse] ?? SCHADSTOFFSAETZE_VOR_2009.euro3;
    const satz = saetze[antrieb] ?? saetze.benzin;
    hubraumanteil = euro(angefangeneEinheiten(ccm, 100) * satz);
    grundbetrag = hubraumanteil;
  } else {
    const satz = HUBRAUMSATZ_AB_2009[antrieb] ?? HUBRAUMSATZ_AB_2009.benzin;
    hubraumanteil = euro(angefangeneEinheiten(ccm, 100) * satz);
    if (ez >= alsTag('2021-01-01', 'Stichtag')) {
      rechtsgrundlage = '§ 9 Abs. 1 Nr. 2 Buchst. c KraftStG';
      co2Freibetrag = CO2_FREIBETRAG_AB_2021;
      co2anteil = staffelbetrag(gramm, co2Freibetrag, CO2_STAFFEL_AB_2021);
    } else {
      rechtsgrundlage = '§ 9 Abs. 1 Nr. 2 Buchst. b KraftStG';
      co2Freibetrag = CO2_FREIBETRAEGE_2009_BIS_2020
        .find(stufe => ez >= alsTag(stufe.ab, 'Stichtag')).freibetrag;
      co2anteil = euro(Math.max(0, gramm - co2Freibetrag) * 2);
    }
    grundbetrag = euro(hubraumanteil + co2anteil);
  }

  // § 3a: Merkzeichen H, Bl oder aG befreien ganz, der orangefarbene
  // Flächenaufdruck halbiert. Die Vergünstigung gilt nur für ein Fahrzeug
  // und nur auf Antrag.
  let jahressteuer = grundbetrag;
  if (ermaessigung === 'befreiung') jahressteuer = 0;
  else if (ermaessigung === 'haelfte') jahressteuer = euro(grundbetrag / 2);
  if (steuerbefreit) jahressteuer = 0;

  return {
    jahressteuer,
    jahressteuerAbgerundet: Math.floor(jahressteuer), // § 11 Abs. 5
    hubraumanteil,
    co2anteil,
    gewichtsanteil,
    co2Freibetrag,
    rechtsgrundlage,
    steuerbefreit,
    befreiungBis,
    halbjaehrlich: entrichtung(jahressteuer, 'halbjahr'),
    vierteljaehrlich: entrichtung(jahressteuer, 'vierteljahr'),
    // Nur eine Umrechnung: § 11 Abs. 1 verlangt die Zahlung für ein Jahr im
    // Voraus, eine monatliche Entrichtung sieht das Gesetz nicht vor.
    monatlichRechnerisch: euro(jahressteuer / 12),
    hinweise,
  };
}
