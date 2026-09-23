// Spritkosten-Berechnung
export function berechneSpritkosten({ streckeKm, verbrauchL100, preisEuroL }) {
  const liter = streckeKm * verbrauchL100 / 100;
  const kosten = Math.round(liter * preisEuroL * 100) / 100;
  const kostenPro100km = Math.round(verbrauchL100 * preisEuroL * 100) / 100;
  // Bewusst ungerundet: Die Seite zeigt diesen Wert mit drei Nachkommastellen.
  // Vorher wurde hier auf zwei gerundet, womit die dritte Stelle immer 0 war und
  // "pro km" mal 100 nicht mehr zu "pro 100 km" passte (0,130 gegen 13,13).
  const kostenProKm = preisEuroL * verbrauchL100 / 100;
  return { liter: Math.round(liter * 100) / 100, kosten, kostenPro100km, kostenProKm };
}
