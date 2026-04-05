// Spritkosten-Berechnung
export function berechneSpritkosten({ streckeKm, verbrauchL100, preisEuroL }) {
  const liter = streckeKm * verbrauchL100 / 100;
  const kosten = Math.round(liter * preisEuroL * 100) / 100;
  const kostenPro100km = Math.round(verbrauchL100 * preisEuroL * 100) / 100;
  const kostenProKm = Math.round(preisEuroL * verbrauchL100 / 100 * 100) / 100;
  return { liter: Math.round(liter * 100) / 100, kosten, kostenPro100km, kostenProKm };
}
