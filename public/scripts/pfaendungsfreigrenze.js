// Pfändungsfreigrenze nach § 850c ZPO (Stand: 1. Juli 2024 – 30. Juni 2025)
// Tabelle gültig ab 1.7.2024 (Bekanntmachung vom 28.5.2024, BGBl. 2024 I Nr. 166)

// Nettoeinkommen-Stufen und zugehörige pfändbare Beträge (0 Unterhaltspfl.)
// Format: [nettoAb, pfaendbar]
const TABELLE_0 = [
  [1491.75, 0],
  [1500, 8.25], [1510, 18.25], [1520, 28.25], [1530, 38.25], [1540, 48.25],
  [1550, 58.25], [1560, 68.25], [1570, 78.25], [1580, 88.25], [1590, 98.25],
  [1600, 108.25],[1620, 127.59],[1640, 146.93],[1660, 166.27],[1680, 185.61],
  [1700, 204.95],[1720, 224.29],[1740, 243.63],[1760, 262.97],[1780, 282.31],
  [1800, 301.65],[1830, 329.16],[1860, 356.67],[1890, 384.18],[1920, 411.69],
  [1950, 439.20],[1980, 466.71],[2010, 494.22],[2040, 521.73],[2070, 549.24],
  [2100, 576.75],[2150, 617.43],[2200, 658.11],[2250, 698.79],[2300, 739.47],
  [2350, 780.15],[2400, 820.83],[2450, 861.51],[2500, 902.19],[2550, 942.87],
  [2600, 983.55],[2700,1064.91],[2800,1146.27],[2900,1227.63],[3000,1308.99],
  [3100,1390.35],[3200,1471.71],[3300,1553.07],[3400,1634.43],[3500,1715.79],
  [3600,1797.15],[3700,1878.51],[3800,1959.87],[3900,2041.23],[4000,2122.59],
  [4100,2203.95],[4200,2285.31],[4300,2366.67],[4400,2448.03],
];

// Erhöhung der Freigrenze pro Unterhaltspflichtigem (monatlich)
const ERHÖHUNG_PRO_PERSON = [0, 560.77, 312.86, 312.86, 312.86, 312.86];

export function berechnePfaendungsfreigrenze({ nettoMonat, unterhaltspflichtige = 0 }) {
  const anzahl = Math.min(5, Math.max(0, unterhaltspflichtige));

  // Freigrenze berechnen
  let freigrenze = 1491.75;
  for (let i = 0; i < anzahl; i++) {
    freigrenze += ERHÖHUNG_PRO_PERSON[i + 1] ?? 312.86;
  }
  freigrenze = Math.round(freigrenze * 100) / 100;

  if (nettoMonat <= freigrenze) {
    return {
      freigrenze,
      pfaendbar: 0,
      unpfaendbar: nettoMonat,
      nettoMonat,
    };
  }

  // Pfändbaren Betrag aus Tabelle interpolieren (0 Unterhaltspfl. als Basis)
  // Bei Unterhaltspflichtigen: Freigrenze erhöht sich, pfändbarer Rest linear
  const differenz = nettoMonat - freigrenze;

  // Vereinfachte lineare Berechnung des pfändbaren Anteils
  // Über 4.451,05 € ist alles über dieser Grenze voll pfändbar
  const VOLLPFAENDBAR = 4451.05 + (freigrenze - 1491.75);
  let pfaendbar;
  if (nettoMonat >= VOLLPFAENDBAR) {
    pfaendbar = nettoMonat - freigrenze;
  } else {
    // Anteiliger Pfändungsanteil (ca. 50% des Mehrbetrags über Freigrenze im Mittelbereich)
    const spanne = VOLLPFAENDBAR - freigrenze;
    const anteil = differenz / spanne;
    pfaendbar = Math.round(differenz * anteil * 100) / 100;
  }

  pfaendbar = Math.round(Math.max(0, pfaendbar) * 100) / 100;
  const unpfaendbar = Math.round((nettoMonat - pfaendbar) * 100) / 100;

  return { freigrenze, pfaendbar, unpfaendbar, nettoMonat };
}
