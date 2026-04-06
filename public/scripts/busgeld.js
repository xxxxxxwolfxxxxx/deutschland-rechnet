// Bußgeldkatalog Deutschland 2021 (gültig ab 09.11.2021, BKatV)
// Format: [maxÜberschreitung, bußgeld, punkte, fahrverbotMonate]

const GESCHWINDIGKEIT = {
  innerorts: [
    [10,  30,  0, 0],
    [15,  50,  1, 0],
    [20,  70,  1, 0],
    [25, 115,  1, 0],
    [30, 180,  1, 1],
    [40, 260,  2, 1],
    [50, 400,  2, 1],
    [60, 560,  2, 2],
    [70, 700,  2, 3],
    [Infinity, 800, 2, 3],
  ],
  ausserorts: [
    [10,  20,  0, 0],
    [15,  40,  1, 0],
    [20,  60,  1, 0],
    [25, 100,  1, 0],
    [30, 150,  1, 1],
    [40, 200,  1, 1],
    [50, 320,  2, 1],
    [60, 480,  2, 1],
    [70, 600,  2, 2],
    [Infinity, 700, 2, 3],
  ],
};

// Rotlicht (§ 37 StVO, lfd. Nr. 132/133 BKatV)
const ROTLICHT = {
  einfach:     { bussgeld: 90,  punkte: 1, fahrverbot: 0, label: 'Einfacher Rotlichtverstoß (Ampel < 1 Sek. Rot)' },
  qualifiziert:{ bussgeld: 200, punkte: 2, fahrverbot: 1, label: 'Qualifizierter Rotlichtverstoß (≥ 1 Sek. Rot)' },
  gefaehrdung: { bussgeld: 320, punkte: 2, fahrverbot: 1, label: 'Mit Gefährdung anderer' },
  sachschaden: { bussgeld: 360, punkte: 2, fahrverbot: 1, label: 'Mit Sachschaden' },
};

// Handy / Mobiltelefon am Steuer (§ 23 StVO, lfd. Nr. 246 BKatV)
const HANDY = {
  pkw_motorrad: { bussgeld: 100, punkte: 1, fahrverbot: 0, label: 'Handy/Smartphone während der Fahrt (Pkw/Motorrad)' },
  lkw_bus:      { bussgeld: 100, punkte: 1, fahrverbot: 0, label: 'Handy/Smartphone während der Fahrt (Lkw/Bus)' },
  fussgaenger:  { bussgeld:  55, punkte: 0, fahrverbot: 0, label: 'Handy als Fußgänger (beim Überqueren der Fahrbahn)' },
};

// Abstand (§ 4 StVO) – vereinfacht nach Geschwindigkeit
// Format: [minGeschw, maxGeschw, maxAbstandBruch (als Dezimal des Tacho), bussgeld, punkte, fahrverbot]
const ABSTAND_TABELLE = [
  // Bei 80–100 km/h
  { minV: 80, maxV: 100, maxAbstand: 4/10, bussgeld: 75,  punkte: 1, fahrverbot: 0 },
  { minV: 80, maxV: 100, maxAbstand: 3/10, bussgeld: 100, punkte: 1, fahrverbot: 0 },
  { minV: 80, maxV: 100, maxAbstand: 2/10, bussgeld: 160, punkte: 1, fahrverbot: 1 },
  { minV: 80, maxV: 100, maxAbstand: 1/10, bussgeld: 200, punkte: 1, fahrverbot: 1 },
  // Bei 100–130 km/h
  { minV: 100, maxV: 130, maxAbstand: 5/10, bussgeld: 75,  punkte: 1, fahrverbot: 0 },
  { minV: 100, maxV: 130, maxAbstand: 4/10, bussgeld: 100, punkte: 1, fahrverbot: 0 },
  { minV: 100, maxV: 130, maxAbstand: 3/10, bussgeld: 160, punkte: 1, fahrverbot: 1 },
  { minV: 100, maxV: 130, maxAbstand: 2/10, bussgeld: 200, punkte: 1, fahrverbot: 1 },
  // Über 130 km/h
  { minV: 130, maxV: Infinity, maxAbstand: 5/10, bussgeld: 100, punkte: 1, fahrverbot: 0 },
  { minV: 130, maxV: Infinity, maxAbstand: 4/10, bussgeld: 160, punkte: 1, fahrverbot: 1 },
  { minV: 130, maxV: Infinity, maxAbstand: 3/10, bussgeld: 240, punkte: 2, fahrverbot: 2 },
  { minV: 130, maxV: Infinity, maxAbstand: 2/10, bussgeld: 320, punkte: 2, fahrverbot: 3 },
];

// Alkohol am Steuer (§ 24a StVG / § 316 StGB)
// Nur Ordnungswidrigkeitenbereich (< 1,6 ‰ Ersttäter)
const ALKOHOL = [
  // [minPromille, maxPromille, typ, bussgeld, punkte, fahrverbotMonate, label]
  [0.5, 1.09, 'owi',  500, 2, 1, 'Ersttäter 0,5–1,09 ‰ (§ 24a StVG)'],
  [0.5, 1.09, 'wdh', 1000, 2, 3, 'Wiederholungstäter 0,5–1,09 ‰'],
  [1.1, 1.59, 'owi', 1000, 2, 3, 'Ersttäter 1,1–1,59 ‰'],
  [1.1, 1.59, 'wdh', 2000, 2, 3, 'Wiederholungstäter 1,1–1,59 ‰'],
];

// Parkverstöße (§ 12/13 StVO, vereinfachte Auswahl)
const PARKEN = {
  halteverbot:          { bussgeld:  25, label: 'Im (eingeschränkten) Halteverbot' },
  halteverbot_behinderung: { bussgeld: 35, label: 'Im Halteverbot mit Behinderung' },
  halteverbot_gefaehrdung: { bussgeld: 60, label: 'Im Halteverbot mit Gefährdung' },
  gehweg:               { bussgeld:  55, label: 'Auf Gehweg / Fußgängerzone' },
  behindertenplatz:     { bussgeld:  55, label: 'Auf Behindertenstellplatz' },
  rettungsgasse:        { bussgeld: 240, label: 'Rettungsgasse blockiert', punkte: 2, fahrverbot: 1 },
  feuerwehrzufahrt:     { bussgeld:  55, label: 'Feuerwehrzufahrt blockiert' },
  kreuzung_10m:         { bussgeld:  35, label: 'Weniger als 10 m vor Kreuzung' },
  bushaltestelle:       { bussgeld:  55, label: 'An Bushaltestelle (Halteverbot)' },
};

export function berechneGeschwindigkeit({ ort, ueberschreitung }) {
  const tabelle = GESCHWINDIGKEIT[ort] || GESCHWINDIGKEIT.innerorts;
  for (const [max, bussgeld, punkte, fahrverbot] of tabelle) {
    if (ueberschreitung <= max) return { bussgeld, punkte, fahrverbot };
  }
  return { bussgeld: 0, punkte: 0, fahrverbot: 0 };
}

export function berechneRotlicht({ typ }) {
  return ROTLICHT[typ] || ROTLICHT.einfach;
}

export function berechneHandy({ typ }) {
  return HANDY[typ] || HANDY.pkw_motorrad;
}

export function berechneAbstand({ geschwindigkeit, abstandMeter }) {
  const abstandBruch = abstandMeter / geschwindigkeit;
  const zeile = ABSTAND_TABELLE
    .filter(r => geschwindigkeit >= r.minV && geschwindigkeit < r.maxV)
    .sort((a, b) => b.maxAbstand - a.maxAbstand) // größte Grenze zuerst
    .find(r => abstandBruch <= r.maxAbstand);
  if (!zeile) return null; // Abstand ausreichend
  return { bussgeld: zeile.bussgeld, punkte: zeile.punkte, fahrverbot: zeile.fahrverbot };
}

export function berechneAlkohol({ promille, wiederholung }) {
  const typ = wiederholung ? 'wdh' : 'owi';
  const eintrag = ALKOHOL.find(([min, max, t]) => promille >= min && promille <= max && t === typ);
  if (!eintrag) return null;
  return { bussgeld: eintrag[3], punkte: eintrag[4], fahrverbot: eintrag[5], label: eintrag[6] };
}

export function berechneParken({ typ }) {
  const eintrag = PARKEN[typ];
  if (!eintrag) return null;
  return {
    bussgeld: eintrag.bussgeld,
    punkte: eintrag.punkte || 0,
    fahrverbot: eintrag.fahrverbot || 0,
    label: eintrag.label,
  };
}
