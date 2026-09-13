// Kfz-Versicherung: Rueckstufung nach einem Schaden – melden oder selbst zahlen?
//
// Bis September 2026 "schaetzte" dieses Modul einen Jahresbeitrag aus einem
// gesetzten Grundbeitrag von 400 € und frei gewaehlten Faktoren fuer
// Fahrzeugtyp, Region, SF-Klasse und Alter. Keine dieser Zahlen hatte eine
// Quelle; die Seite schrieb sie trotzdem dem GDV zu. Einen echten Beitrag kann
// ohne Tarifdaten des Versicherers niemand rechnen.
//
// Rechenbar ist dagegen, was eine Schadenmeldung ueber die Folgejahre kostet –
// wenn man den eigenen Beitrag kennt. Dafuer braucht es die Beitragssaetze je
// SF-Klasse und die Rueckstufungstabelle. Beide sind je Versicherer
// verschieden. Dieses Modul verwendet die veroeffentlichten Tabellen fuer Pkw
// aus den AKB 2025 der GHV Versicherung (Anhang 1.1 und 1.2) als belegtes
// Beispiel. Die Regeln zur Neueinstufung stehen dort in I.3.

/** Quelle der Tabellen. */
export const QUELLE = {
  titel: 'Allgemeine Bedingungen für die Kfz-Versicherung (AKB 2025), Anhang 1.1 und 1.2 – GHV Versicherung',
  url: 'https://www.ghv-versicherung.de/wp-content/uploads/2024/12/AKB-2025-Stand-2024-11-25.pdf',
};

/** SF-Klassen von der besten zur schlechtesten. */
export const KLASSEN = [
  ...Array.from({ length: 35 }, (_, i) => String(35 - i)),
  '1/2', '0', 'S', 'M',
];

// Anhang 1.1: Beitragssatz in Prozent, [Haftpflicht, Vollkasko].
const SAETZE = {
  35: [20, 20], 34: [20, 21], 33: [21, 21], 32: [22, 22], 31: [22, 22],
  30: [23, 23], 29: [23, 23], 28: [23, 23], 27: [24, 24], 26: [25, 24],
  25: [25, 25], 24: [26, 25], 23: [26, 25], 22: [27, 25], 21: [27, 26],
  20: [28, 26], 19: [29, 27], 18: [29, 27], 17: [30, 28], 16: [30, 28],
  15: [31, 29], 14: [31, 30], 13: [32, 31], 12: [33, 32], 11: [35, 33],
  10: [37, 34], 9: [38, 35], 8: [40, 36], 7: [42, 38], 6: [44, 39],
  5: [46, 42], 4: [52, 45], 3: [58, 51], 2: [64, 55], 1: [74, 60],
  '1/2': [84, 72], 0: [100, 95], S: [100, 100], M: [140, 125],
};

// Anhang 1.2: Rueckstufung, [nach 1 Schaden, nach 2 und mehr Schaeden].
const RUECK_KH = {
  35: ['20', '8'], 34: ['17', '7'], 33: ['16', '7'], 32: ['16', '6'], 31: ['15', '6'],
  30: ['15', '6'], 29: ['14', '6'], 28: ['14', '5'], 27: ['13', '5'], 26: ['13', '5'],
  25: ['12', '4'], 24: ['12', '4'], 23: ['11', '4'], 22: ['11', '4'], 21: ['10', '3'],
  20: ['10', '3'], 19: ['9', '3'], 18: ['9', '2'], 17: ['8', '2'], 16: ['8', '2'],
  15: ['7', '1'], 14: ['6', '1'], 13: ['6', '1'], 12: ['5', '1'], 11: ['5', '1'],
  10: ['4', '1/2'], 9: ['3', '1/2'], 8: ['3', '1/2'], 7: ['2', '1/2'], 6: ['2', 'S'],
  5: ['1', 'S'], 4: ['1', '0'], 3: ['1', '0'], 2: ['1/2', '0'], 1: ['1/2', '0'],
  '1/2': ['0', 'M'], 0: ['M', 'M'], S: ['M', 'M'], M: ['M', 'M'],
};
const RUECK_VK = {
  35: ['22', '12'], 34: ['21', '12'], 33: ['20', '12'], 32: ['20', '11'], 31: ['19', '11'],
  30: ['18', '10'], 29: ['18', '10'], 28: ['17', '9'], 27: ['16', '9'], 26: ['16', '8'],
  25: ['15', '8'], 24: ['14', '7'], 23: ['14', '7'], 22: ['13', '6'], 21: ['12', '6'],
  20: ['12', '5'], 19: ['11', '5'], 18: ['10', '5'], 17: ['10', '4'], 16: ['9', '4'],
  15: ['8', '3'], 14: ['7', '3'], 13: ['7', '2'], 12: ['6', '1'], 11: ['5', '1'],
  10: ['5', '1/2'], 9: ['4', '1/2'], 8: ['3', '0'], 7: ['2', '0'], 6: ['2', '0'],
  5: ['1', '0'], 4: ['1/2', '0'], 3: ['0', 'M'], 2: ['0', 'M'], 1: ['0', 'M'],
  '1/2': ['M', 'M'], 0: ['M', 'M'], S: ['M', 'M'], M: ['M', 'M'],
};

/** AKB I.5: Rueckkauf in der Kfz-Haftpflicht bis zu dieser Entschaedigung, Frist sechs Monate. */
export const RUECKKAUF_GRENZE_HAFTPFLICHT = 500;
export const RUECKKAUF_FRIST_MONATE = 6;

const index = (sparte) => (sparte === 'vollkasko' ? 1 : 0);

export function beitragssatz(sparte, klasse) {
  const s = SAETZE[klasse];
  if (!s) throw new Error(`Unbekannte SF-Klasse "${klasse}"`);
  return s[index(sparte)];
}

/** AKB I.3.2 und I.3.4.1: nach einem schadenfreien Kalenderjahr. */
export function naechstbesser(klasse) {
  if (klasse === '1/2' || klasse === '0' || klasse === 'S' || klasse === 'M') return '1';
  return String(Math.min(35, Number(klasse) + 1));
}

/** AKB I.3.5 mit Anhang 1.2. */
export function rueckstufung(sparte, klasse, schaeden = 1) {
  const tabelle = sparte === 'vollkasko' ? RUECK_VK : RUECK_KH;
  return tabelle[klasse][schaeden >= 2 ? 1 : 0];
}

const aufCent = (b) => Math.round(b * 100) / 100;

/**
 * Beitragsverlauf mit und ohne Schadenmeldung.
 *
 * Unterstellt ist ein gleichbleibender Beitrag bei 100 Prozent: keine Aenderung
 * von Typklasse, Regionalklasse oder Tarif. Das Schadenjahr selbst ist in
 * beiden Faellen gleich teuer; die Neueinstufung wirkt ab dem 1. Januar (I.3).
 *
 * @param {object} e
 * @param {'haftpflicht'|'vollkasko'} e.sparte
 * @param {string} e.klasse          aktuelle SF-Klasse, z. B. '10', '1/2', 'M'
 * @param {number} e.jahresbeitrag   aktueller Jahresbeitrag dieser Sparte in Euro
 * @param {number} [e.schaeden]      Zahl der Schaeden im Kalenderjahr
 * @param {number} [e.jahre]         betrachteter Zeitraum ab dem Folgejahr
 * @param {number} [e.entschaedigung] was der Versicherer zahlen muesste (Schaden abzueglich Selbstbeteiligung)
 */
export function berechneRueckstufung({
  sparte = 'haftpflicht',
  klasse,
  jahresbeitrag,
  schaeden = 1,
  jahre = 10,
  entschaedigung = 0,
}) {
  const satzHeute = beitragssatz(sparte, klasse);
  const beitrag100 = Math.max(0, Number(jahresbeitrag) || 0) / (satzHeute / 100);
  const n = Math.max(1, Math.min(35, Math.round(jahre)));

  const zeilen = [];
  let ohne = klasse;
  let mit = rueckstufung(sparte, klasse, schaeden);
  const zielKlasse = mit;
  let summe = 0;
  let eingeholtImJahr = null;
  for (let j = 1; j <= n; j += 1) {
    ohne = naechstbesser(ohne);
    if (j > 1) mit = naechstbesser(mit);
    const satzOhne = beitragssatz(sparte, ohne);
    const satzMit = beitragssatz(sparte, mit);
    const beitragOhne = aufCent(beitrag100 * satzOhne / 100);
    const beitragMit = aufCent(beitrag100 * satzMit / 100);
    const mehr = aufCent(beitragMit - beitragOhne);
    summe += mehr;
    // Eingeholt ist der Abstand erst, wenn beide Verlaeufe in derselben Klasse
    // stehen – ab dann sind sie fuer immer gleich. Ein gleicher Beitragssatz
    // allein reicht nicht: In der Vollkasko haben SF 16 und SF 17 beide 28 %,
    // ein Jahr spaeter ist der Abstand wieder da.
    if (eingeholtImJahr === null && mit === ohne) eingeholtImJahr = j;
    zeilen.push({ jahr: j, klasseOhne: ohne, satzOhne, beitragOhne, klasseMit: mit, satzMit, beitragMit, mehr });
  }
  const mehrbeitrag = aufCent(summe);
  const entsch = Math.max(0, Number(entschaedigung) || 0);

  return {
    satzHeute,
    beitrag100: aufCent(beitrag100),
    zielKlasse,
    zeilen,
    mehrbeitrag,
    eingeholtImJahr,
    entschaedigung: entsch,
    selbstZahlenLohnt: entsch > 0 && entsch < mehrbeitrag,
    rueckkaufMoeglich: sparte === 'haftpflicht' && entsch > 0 && entsch <= RUECKKAUF_GRENZE_HAFTPFLICHT,
  };
}
