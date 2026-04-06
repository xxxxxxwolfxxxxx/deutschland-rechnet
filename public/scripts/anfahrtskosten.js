const VERBRAUCH = { small: 6, compact: 7, large: 9, van: 12 };
const PAUSCHALE_PRO_KM = 0.30;

function berechneAnfahrtskosten({ km, fahrzeug, spritpreis, fahrten }) {
  const verbrauch = VERBRAUCH[fahrzeug] || 7;
  const gesamtKm = km * 2 * fahrten;
  const spritkosten = (gesamtKm / 100) * verbrauch * spritpreis;
  const pauschale = gesamtKm * PAUSCHALE_PRO_KM;
  const gesamtkosten = spritkosten;
  
  return {
    gesamtkosten: Math.round(gesamtkosten * 100) / 100,
    gesamtKm,
    spritkosten: Math.round(spritkosten * 100) / 100,
    pauschale: Math.round(pauschale * 100) / 100,
    verbrauch,
  };
}

export { berechneAnfahrtskosten };
