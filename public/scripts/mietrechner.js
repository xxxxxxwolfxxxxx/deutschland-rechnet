const HEIZKOSTEN_PRO_QM = {
  pre1978: { gas: 15, oil: 17, district: 14, heatpump: 12, other: 14 },
  '1978_2002': { gas: 12, oil: 13, district: 11, heatpump: 9, other: 11 },
  post2002: { gas: 9, oil: 10, district: 8, heatpump: 7, other: 9 },
};

const BETRIEBSKOSTEN_PRO_QM = {
  pre1978: 3.50,
  '1978_2002': 3.00,
  post2002: 2.50,
};

const WARMWASSER_KOSTEN_PRO_PERSON = 15;

function berechneMietrechner({ kaltmiete, flaeche, personen, baujahr, heizung, warmwasser }) {
  const heizkostenProQm = HEIZKOSTEN_PRO_QM[baujahr]?.[heizung] || 12;
  const heizkosten = flaeche * heizkostenProQm / 12;
  const betriebskosten = flaeche * (BETRIEBSKOSTEN_PRO_QM[baujahr] || 3) / 12;
  const warmwasserKosten = warmwasser === 'ja' ? personen * WARMWASSER_KOSTEN_PRO_PERSON : 0;
  const nebenkosten = heizkosten + betriebskosten + warmwasserKosten;
  const warmmiete = kaltmiete + nebenkosten;
  
  return {
    warmmiete: Math.round(warmmiete * 100) / 100,
    nebenkosten: Math.round(nebenkosten * 100) / 100,
    heizkosten: Math.round(heizkosten * 100) / 100,
    betriebskosten: Math.round(betriebskosten * 100) / 100,
    warmwasserKosten: Math.round(warmwasserKosten * 100) / 100,
  };
}

export { berechneMietrechner };
