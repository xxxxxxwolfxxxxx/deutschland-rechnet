const CO2_GAS = 0.2;
const CO2_STROM = 0.4;

function berechneWärmepumpe({ verbrauch, gaskosten, stromkosten, wpJahrescope, investition, förderung }) {
  const gasKosten = verbrauch * (gaskosten / 100);
  const wpStrom = verbrauch / wpJahrescope;
  const wpKosten = wpStrom * (stromkosten / 100);
  const ersparnis = gasKosten - wpKosten;
  const investitionNetto = investition * (1 - förderung / 100);
  const amortisation = ersparnis > 0 ? investitionNetto / ersparnis : Infinity;
  const co2Gas = verbrauch * CO2_GAS / 1000;
  const co2Wp = wpStrom * CO2_STROM / 1000;
  const co2Einsparung = Math.round((co2Gas - co2Wp) * 10) / 10;
  
  return {
    gasKosten: Math.round(gasKosten * 100) / 100,
    wpKosten: Math.round(wpKosten * 100) / 100,
    ersparnis: Math.round(ersparnis * 100) / 100,
    investitionNetto: Math.round(investitionNetto * 100) / 100,
    amortisation: amortisation === Infinity ? 'N/A' : Math.round(amortisation * 10) / 10,
    co2Einsparung,
  };
}

export { berechneWärmepumpe };
