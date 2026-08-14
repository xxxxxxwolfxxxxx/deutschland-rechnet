// Trailergespann: Fahrerlaubnisklasse, technische Grenzen und Tempo 100
//
// Quellen, abgerufen am 14.08.2026:
//   Fahrerlaubnis-Verordnung (FeV) vom 13.12.2010, zuletzt geändert durch
//     Art. 7 G v. 12.5.2026 (BGBl. 2026 I Nr. 142) – §§ 6, 6a, Anlagen 3 und 7a
//     https://www.gesetze-im-internet.de/fev_2010/xml.zip
//   Neunte Verordnung über Ausnahmen von den Vorschriften der
//     Straßenverkehrs-Ordnung, zuletzt geändert durch Art. 2 V v. 19.12.2025
//     (BGBl. 2025 I Nr. 382) – §§ 1 bis 4
//     https://www.gesetze-im-internet.de/stvoausnv_9/xml.zip
//
// Maßgeblich ist immer die zulässige Gesamtmasse (zGM) aus den Fahrzeug-
// papieren, nicht das gewogene Gewicht. § 6 Abs. 1 Satz 2 FeV: Die zGM der
// Kombination ist die Summe der Einzel-zGM "ohne Berücksichtigung von Stütz-
// und Aufliegelasten" – die Stützlast wird also NICHT doppelt gezählt.
//
// Die Fahrerlaubnis ist nur eine von drei Grenzen. Ein Gespann kann von der
// Klasse gedeckt und trotzdem unzulässig sein, wenn die zulässige Anhängelast
// des Zugfahrzeugs (Feld O.1) oder die zulässige Gesamtmasse der Kombination
// (Feld F.3) überschritten wird. Beide sind deshalb optionale Eingaben.
//
// NICHT abgebildet: Fahrerlaubnisse alten Rechts (Anlage 3 FeV – die vor dem
// 1.1.1999 erworbene Klasse 3 umfasst B, BE, C1, C1E und CE 79 und ist damit
// durchweg besser gestellt), Sattelanhänger, Mindestalter und die Frage, ob
// das Zugfahrzeug den Trailer auch am Berg anfahren kann.

/** Obergrenze der zGM eines Zugfahrzeugs der Klasse B (§ 6 Abs. 1 FeV). */
const ZUGFAHRZEUG_B_KG = 3500;
/** Obergrenze der zGM eines Zugfahrzeugs der Klasse C1. */
const ZUGFAHRZEUG_C1_KG = 7500;
/** Anhänger bis hierhin sind mit B immer erlaubt, unabhängig vom Zugfahrzeug. */
const ANHAENGER_FREI_KG = 750;
/** Obergrenze der Kombination für die reine Klasse B. */
const KOMBINATION_B_KG = 3500;
/** Obergrenze der Kombination mit Schlüsselzahl 96 (§ 6a Abs. 1 FeV). */
const KOMBINATION_B96_KG = 4250;
/** Anhänger-Obergrenze der Klasse BE. */
const ANHAENGER_BE_KG = 3500;
/** Obergrenze der Kombination für die Klasse C1E. */
const KOMBINATION_C1E_KG = 12000;

const HINWEIS = {
  B_FREI: 'Anhänger bis 750 kg zGM sind mit Klasse B immer erlaubt – unabhängig vom Zugfahrzeug und von der Kombination.',
  B: 'Die Kombination bleibt bei höchstens 3.500 kg zGM – Klasse B genügt.',
  B96: 'Für 3.500 bis 4.250 kg Kombination genügt die Schlüsselzahl 96 nach § 6a FeV: eine Fahrerschulung von mindestens sieben Stunden ohne Prüfung.',
  BE: 'Über 4.250 kg Kombination ist die Klasse BE nötig – mit praktischer Prüfung. BE begrenzt den Anhänger auf 3.500 kg zGM, die Kombination dagegen nicht.',
  C1E: 'Ein Anhänger über 3.500 kg zGM oder ein Zugfahrzeug über 3.500 kg zGM führt in die Klasse C1E. Sie ist auf 12.000 kg zGM der Kombination begrenzt.',
  C1: 'Ein Zugfahrzeug über 3.500 kg zGM fällt unter die Klasse C1; Anhänger bis 750 kg zGM sind darin eingeschlossen.',
  C: 'Ein Zugfahrzeug über 7.500 kg zGM fällt unter die Klasse C; Anhänger bis 750 kg zGM sind darin eingeschlossen.',
  CE: 'Erforderlich ist die Klasse CE.',
  UEBER_12T: 'Oberhalb von 12.000 kg zGM der Kombination endet die Klasse C1E; erforderlich ist dann CE, die ein Zugfahrzeug der Klasse C voraussetzt.',
};

function positiv(wert) {
  const zahl = Number(wert);
  return Number.isFinite(zahl) && zahl > 0 ? zahl : 0;
}

/**
 * Ermittelt die nötige Fahrerlaubnisklasse und prüft die technischen Grenzen.
 *
 * @param {object} eingabe
 * @param {number} eingabe.zugfahrzeugKg  zGM des Zugfahrzeugs, Feld F.1
 * @param {number} eingabe.anhaengerKg    zGM des Trailers inklusive Boot, Feld F.1 des Anhängers
 * @param {number} [eingabe.anhaengelastKg=0]  zulässige Anhängelast gebremst, Feld O.1
 * @param {number} [eingabe.kombinationMaxKg=0]  zulässige Gesamtmasse der Kombination, Feld F.3
 */
export function berechneBootstrailer({
  zugfahrzeugKg,
  anhaengerKg,
  anhaengelastKg = 0,
  kombinationMaxKg = 0,
} = {}) {
  const zug = positiv(zugfahrzeugKg);
  const haenger = positiv(anhaengerKg);
  const anhaengelast = positiv(anhaengelastKg);
  const kombinationMax = positiv(kombinationMaxKg);
  const kombinationKg = zug + haenger;

  const hinweise = [];
  let klasse;
  let spielraumKombinationKg = null;
  let spielraumAnhaengerKg = null;

  if (zug > ZUGFAHRZEUG_C1_KG) {
    klasse = haenger <= ANHAENGER_FREI_KG ? 'C' : 'CE';
    hinweise.push(klasse === 'C' ? HINWEIS.C : HINWEIS.CE);
  } else if (zug > ZUGFAHRZEUG_B_KG) {
    if (haenger <= ANHAENGER_FREI_KG) {
      klasse = 'C1';
      hinweise.push(HINWEIS.C1);
      spielraumAnhaengerKg = ANHAENGER_FREI_KG - haenger;
    } else if (kombinationKg <= KOMBINATION_C1E_KG) {
      klasse = 'C1E';
      hinweise.push(HINWEIS.C1E);
      spielraumKombinationKg = KOMBINATION_C1E_KG - kombinationKg;
    } else {
      klasse = 'CE';
      hinweise.push(HINWEIS.UEBER_12T);
    }
  } else if (haenger <= ANHAENGER_FREI_KG) {
    // Die 750-kg-Regel steht unabhängig neben der Kombinationsgrenze: Ein
    // 3.500-kg-Zugfahrzeug mit 750-kg-Trailer ergibt 4.250 kg und bleibt B.
    klasse = 'B';
    hinweise.push(HINWEIS.B_FREI);
  } else if (haenger <= ANHAENGER_BE_KG) {
    if (kombinationKg <= KOMBINATION_B_KG) {
      klasse = 'B';
      hinweise.push(HINWEIS.B);
      spielraumKombinationKg = KOMBINATION_B_KG - kombinationKg;
    } else if (kombinationKg <= KOMBINATION_B96_KG) {
      klasse = 'B96';
      hinweise.push(HINWEIS.B96);
      spielraumKombinationKg = KOMBINATION_B96_KG - kombinationKg;
    } else {
      klasse = 'BE';
      hinweise.push(HINWEIS.BE);
    }
  } else if (kombinationKg <= KOMBINATION_C1E_KG) {
    klasse = 'C1E';
    hinweise.push(HINWEIS.C1E);
    spielraumKombinationKg = KOMBINATION_C1E_KG - kombinationKg;
  } else {
    klasse = 'CE';
    hinweise.push(HINWEIS.UEBER_12T);
  }

  // Der größte Anhänger, der in der jeweiligen Klasse noch möglich wäre.
  if (klasse === 'B') {
    spielraumAnhaengerKg = Math.max(ANHAENGER_FREI_KG, KOMBINATION_B_KG - zug) - haenger;
  } else if (klasse === 'B96') {
    spielraumAnhaengerKg = Math.min(ANHAENGER_BE_KG, KOMBINATION_B96_KG - zug) - haenger;
  } else if (klasse === 'BE') {
    spielraumAnhaengerKg = ANHAENGER_BE_KG - haenger;
  }

  // Technische Grenzen – unabhängig von der Fahrerlaubnis.
  const anhaengelastUeberschritten = anhaengelast > 0 && haenger > anhaengelast;
  const kombinationUeberschritten = kombinationMax > 0 && kombinationKg > kombinationMax;
  const technischeGrenzen = [
    anhaengelast > 0 ? anhaengelast : null,
    kombinationMax > 0 ? kombinationMax - zug : null,
  ].filter(wert => wert !== null);
  const maxAnhaengerTechnischKg = technischeGrenzen.length
    ? Math.max(0, Math.min(...technischeGrenzen))
    : null;

  if (anhaengelastUeberschritten) {
    hinweise.push(`Die zulässige Anhängelast des Zugfahrzeugs beträgt ${anhaengelast.toLocaleString('de-DE')} kg `
      + `und wird um ${(haenger - anhaengelast).toLocaleString('de-DE')} kg überschritten. `
      + 'Die Fahrerlaubnisklasse hilft darüber nicht hinweg.');
  }
  if (kombinationUeberschritten) {
    hinweise.push(`Die zulässige Gesamtmasse der Kombination beträgt ${kombinationMax.toLocaleString('de-DE')} kg `
      + `(Feld F.3) und wird um ${(kombinationKg - kombinationMax).toLocaleString('de-DE')} kg überschritten.`);
  }

  return {
    kombinationKg,
    klasse,
    erlaubtMitB: klasse === 'B',
    spielraumKombinationKg,
    spielraumAnhaengerKg,
    anhaengelastUeberschritten,
    kombinationUeberschritten,
    maxAnhaengerTechnischKg,
    zulaessig: !anhaengelastUeberschritten && !kombinationUeberschritten,
    hinweise,
  };
}

// § 1 Nr. 1 der Neunten Ausnahmeverordnung: Die zGM des Anhängers darf höchstens
// das X-fache der LEERMASSE des Zugfahrzeugs betragen. Die Leermasse, nicht die
// zulässige Gesamtmasse – das ist die Größe, an der die meisten Gespanne
// scheitern.
export const TEMPO100_FAKTOREN = {
  /** Buchst. a: ohne Bremse oder ohne hydraulische Schwingungsdämpfer. */
  ohneDaempfer: 0.3,
  /** Buchst. b: Wohnanhänger mit starrem Aufbau und hydraulischen Dämpfern. */
  wohnanhaenger: 0.8,
  /** Buchst. d in Verbindung mit b: zusätzlich mit Stabilisierungseinrichtung. */
  wohnanhaengerStabilisiert: 1.0,
  /** Buchst. c: andere Anhänger mit hydraulischen Dämpfern – auch Bootstrailer. */
  sonstiger: 1.1,
  /** Buchst. d in Verbindung mit c. */
  sonstigerStabilisiert: 1.2,
};

const TEMPO100_GELTUNGSBEREICH =
  'Die 100 km/h gelten nur auf Autobahnen (Zeichen 330.1) und Kraftfahrstraßen '
  + '(Zeichen 331.1). Auf allen übrigen Straßen außerhalb geschlossener Ortschaften '
  + 'bleibt es auch mit Plakette bei 80 km/h nach § 3 Abs. 3 StVO.';

const TEMPO100_VORAUSSETZUNGEN = [
  'Das Zugfahrzeug ist mit einem automatischen Blockierverhinderer (ABS) ausgestattet (§ 1 Nr. 1).',
  'Die Reifen des Anhängers sind jünger als sechs Jahre und mindestens mit der Geschwindigkeitskategorie L (120 km/h) gekennzeichnet (§ 3).',
  'Ein Sachverständiger oder Prüfingenieur hat die Voraussetzungen bestätigt und die Behörde hat 100 km/h in die Fahrzeugpapiere des Anhängers eingetragen (§ 1 Nr. 2 und 3).',
  'Die gesiegelte Tempo-100-Plakette ist an der Rückseite des Anhängers angebracht (§ 1 Nr. 4).',
  'Die Stützlast richtet sich nach dem kleineren der beiden zulässigen Werte von Zugfahrzeug und Anhänger (§ 4).',
];

/**
 * Prüft die rechenbare Bedingung des § 1 Nr. 1 der Neunten Ausnahmeverordnung.
 *
 * @param {object} eingabe
 * @param {number} eingabe.anhaengerKg  zGM des Anhängers
 * @param {number} eingabe.leermasseZugfahrzeugKg  Leermasse, Feld G
 * @param {number} [eingabe.zugfahrzeugKg=0]  zGM des Zugfahrzeugs, Feld F.1
 * @param {number} [eingabe.anhaengelastKg=0]  zulässige Anhängelast, Feld O.1
 * @param {boolean} [eingabe.bremse=true]  Auflaufbremse vorhanden?
 * @param {boolean} [eingabe.schwingungsdaempfer=false]  hydraulische Schwingungsdämpfer?
 * @param {boolean} [eingabe.stabilisierung=false]  Stabilisierungseinrichtung nach Buchst. d?
 * @param {'sonstiger'|'wohnanhaenger'} [eingabe.anhaengerart='sonstiger']
 */
export function pruefeTempo100({
  anhaengerKg,
  leermasseZugfahrzeugKg,
  zugfahrzeugKg = 0,
  anhaengelastKg = 0,
  bremse = true,
  schwingungsdaempfer = false,
  stabilisierung = false,
  anhaengerart = 'sonstiger',
} = {}) {
  const leermasse = positiv(leermasseZugfahrzeugKg);
  if (leermasse === 0) {
    throw new Error('Die Leermasse des Zugfahrzeugs (Feld G) ist die Bezugsgröße und muss angegeben werden.');
  }
  const haenger = positiv(anhaengerKg);
  const zug = positiv(zugfahrzeugKg);
  const anhaengelast = positiv(anhaengelastKg);
  const wohnanhaenger = anhaengerart === 'wohnanhaenger';

  let faktor;
  if (!bremse || !schwingungsdaempfer) {
    faktor = TEMPO100_FAKTOREN.ohneDaempfer;
  } else if (wohnanhaenger) {
    faktor = stabilisierung
      ? TEMPO100_FAKTOREN.wohnanhaengerStabilisiert
      : TEMPO100_FAKTOREN.wohnanhaenger;
  } else {
    faktor = stabilisierung
      ? TEMPO100_FAKTOREN.sonstigerStabilisiert
      : TEMPO100_FAKTOREN.sonstiger;
  }

  let maxAnhaengerKg = Math.round(leermasse * faktor);

  // Die doppelte Obergrenze steht im Verordnungstext ausdrücklich nur bei
  // Buchstabe c; Buchstabe d hebt diesen Fall lediglich auf 1,2 an und
  // übernimmt sie damit. Für Buchstabe a und b ist sie nicht vorgesehen.
  const buchstabeC = schwingungsdaempfer && bremse && !wohnanhaenger;
  if (buchstabeC) {
    const obergrenzen = [zug, anhaengelast].filter(wert => wert > 0);
    if (obergrenzen.length) {
      maxAnhaengerKg = Math.min(maxAnhaengerKg, ...obergrenzen);
    }
  }

  return {
    faktor,
    maxAnhaengerKg,
    zulaessig: haenger > 0 && haenger <= maxAnhaengerKg,
    ueberschussKg: Math.max(0, haenger - maxAnhaengerKg),
    geltungsbereich: TEMPO100_GELTUNGSBEREICH,
    voraussetzungen: TEMPO100_VORAUSSETZUNGEN,
  };
}
