// Nebenkostenrechner – typische Betriebskosten nach § 2 BetrKV (Stand 2025)
// Richtwerte: Betriebskostenspiegel des Deutschen Mieterbundes

const POSITIONEN = [
  { key: 'heizung',    label: 'Heizung & Warmwasser', einheitMin: 0.90, einheitMax: 1.50 },
  { key: 'wasser',     label: 'Wasser & Abwasser',    einheitMin: 0.25, einheitMax: 0.40 },
  { key: 'muell',      label: 'Müllentsorgung',        einheitMin: 0.10, einheitMax: 0.18 },
  { key: 'hausmeister',label: 'Hausmeister',           einheitMin: 0.14, einheitMax: 0.22 },
  { key: 'versicherung',label: 'Versicherungen',       einheitMin: 0.16, einheitMax: 0.24 },
  { key: 'aufzug',     label: 'Aufzug',                einheitMin: 0.00, einheitMax: 0.12 },
  { key: 'gartenpflege',label: 'Gartenpflege',         einheitMin: 0.04, einheitMax: 0.10 },
  { key: 'strom',      label: 'Allgemeinstrom',        einheitMin: 0.04, einheitMax: 0.08 },
  { key: 'reinigung',  label: 'Gebäudereinigung',      einheitMin: 0.05, einheitMax: 0.10 },
  { key: 'sonstiges',  label: 'Sonstiges',             einheitMin: 0.06, einheitMax: 0.12 },
];

export function berechneNebenkosten({ flaeche, hatAufzug = false, hatGarten = false }) {
  const positionen = POSITIONEN.map(p => {
    let einheitMin = p.einheitMin;
    let einheitMax = p.einheitMax;
    if (p.key === 'aufzug' && !hatAufzug)     { einheitMin = 0; einheitMax = 0; }
    if (p.key === 'gartenpflege' && !hatGarten){ einheitMin = 0; einheitMax = 0; }

    const mittelMin = flaeche * einheitMin;
    const mittelMax = flaeche * einheitMax;
    return {
      label: p.label,
      monatMin: Math.round(mittelMin / 12 * 100) / 100,
      monatMax: Math.round(mittelMax / 12 * 100) / 100,
    };
  }).filter(p => p.monatMax > 0);

  const gesamtMin = Math.round(positionen.reduce((s, p) => s + p.monatMin, 0) * 100) / 100;
  const gesamtMax = Math.round(positionen.reduce((s, p) => s + p.monatMax, 0) * 100) / 100;
  const gesamtMittel = Math.round((gesamtMin + gesamtMax) / 2 * 100) / 100;

  return { gesamtMin, gesamtMax, gesamtMittel, positionen };
}
