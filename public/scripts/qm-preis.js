const PREISE = {
  BAY: { kauf_wohnung: 7500, kauf_haus: 9500, miete: 18, name: 'München' },
  HH: { kauf_wohnung: 5500, kauf_haus: 7000, miete: 14, name: 'Hamburg' },
  BE: { kauf_wohnung: 4500, kauf_haus: 5500, miete: 13, name: 'Berlin' },
  F: { kauf_wohnung: 5000, kauf_haus: 6500, miete: 14, name: 'Frankfurt' },
  S: { kauf_wohnung: 4500, kauf_haus: 6000, miete: 13, name: 'Stuttgart' },
  K: { kauf_wohnung: 3800, kauf_haus: 5000, miete: 11, name: 'Köln' },
  D: { kauf_wohnung: 3500, kauf_haus: 4800, miete: 10, name: 'Düsseldorf' },
  DD: { kauf_wohnung: 3000, kauf_haus: 4000, miete: 9, name: 'Dresden' },
  MS: { kauf_wohnung: 2800, kauf_haus: 3800, miete: 9, name: 'Münster' },
  L: { kauf_wohnung: 2500, kauf_haus: 3500, miete: 8, name: 'Leipzig' },
  NRW: { kauf_wohnung: 2800, kauf_haus: 3800, miete: 9, name: 'NRW' },
  DE: { kauf_wohnung: 3000, kauf_haus: 4200, miete: 9, name: 'Deutschland' },
};

function berechneQmPreis({ region, flaeche, typ }) {
  const preise = PREISE[region] || PREISE.DE;
  const qmPreis = preise[typ] || 3000;
  const gesamtwert = typ === 'miete' ? qmPreis * flaeche : qmPreis * flaeche;
  
  return {
    qmPreis,
    gesamtwert: Math.round(gesamtwert * 100) / 100,
    regionName: preise.name,
  };
}

export { berechneQmPreis };
