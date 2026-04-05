// Heizkosten-Berechnung nach Energieträger
// Richtwerte Heizenergiebedarf (co2online, Altbau ~150 kWh/m²)
export const RICHTWERTE = [
  { label: '50 m² (1 Person)',     flaeche: 50,  kwh: 7500  },
  { label: '70 m² (2 Personen)',   flaeche: 70,  kwh: 10500 },
  { label: '100 m² (3 Personen)',  flaeche: 100, kwh: 15000 },
  { label: '140 m² (4+ Personen)', flaeche: 140, kwh: 21000 },
];

// Standardpreise 2025 (ct/kWh)
export const TRAEGER = {
  gas:        { label: 'Erdgas',       preis: 10.0, einheit: 'kWh' },
  oel:        { label: 'Heizöl',       preis: 10.0, einheit: 'kWh' },
  fernwaerme: { label: 'Fernwärme',    preis: 12.5, einheit: 'kWh' },
  pellets:    { label: 'Holzpellets',  preis:  6.0, einheit: 'kWh' },
  waermepumpe:{ label: 'Wärmepumpe',   preis:  5.0, einheit: 'kWh' },
};

export function berechneHeizkosten({ verbrauchKwh, preisCent }) {
  const kosten = Math.round(verbrauchKwh * preisCent) / 100;
  const monat  = Math.round(kosten / 12 * 100) / 100;
  return { kosten, monat };
}
