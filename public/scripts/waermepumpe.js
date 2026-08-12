// Wärmepumpe gegen Gasheizung: Betriebskosten, Amortisation und CO2-Bilanz.
//
// Die beiden Emissionsfaktoren stammen aus unterschiedlichen Quellen und sind
// deshalb nicht symmetrisch:
//   Erdgas – gesetzlicher Standardwert der EBeV 2030 Anlage 2 Teil 4, bezogen
//            auf die abgerechnete Brennwert-Kilowattstunde. Wiederverwendet
//            aus `heizkosten.js`, damit beide Rechner denselben Wert nutzen.
//   Strom  – gemessener Jahresdurchschnitt des Umweltbundesamtes, siehe
//            `emissionsfaktoren.js`.
//
// Gerechnet und ausgewiesen wird durchgehend in Kilogramm CO2 pro Jahr.

import { emissionsfaktor } from './heizkosten.js';
import { STROMMIX_KG_JE_KWH } from './emissionsfaktoren.js';

const CO2_GAS_KG_JE_KWH = emissionsfaktor('gas');

function berechneWärmepumpe({ verbrauch, gaskosten, stromkosten, wpJahrescope, investition, förderung }) {
  const gasKosten = verbrauch * (gaskosten / 100);
  const wpStrom = verbrauch / wpJahrescope;
  const wpKosten = wpStrom * (stromkosten / 100);
  const ersparnis = gasKosten - wpKosten;
  const investitionNetto = investition * (1 - förderung / 100);
  const amortisation = ersparnis > 0 ? investitionNetto / ersparnis : Infinity;

  // Kilogramm CO2 pro Jahr. Bei niedriger Jahresarbeitszahl kann das Ergebnis
  // negativ werden – dann emittiert die Wärmepumpe mehr als die Gasheizung.
  const co2GasKg = verbrauch * CO2_GAS_KG_JE_KWH;
  const co2WpKg = wpStrom * STROMMIX_KG_JE_KWH;
  const co2EinsparungKg = Math.round(co2GasKg - co2WpKg);

  return {
    gasKosten: Math.round(gasKosten * 100) / 100,
    wpKosten: Math.round(wpKosten * 100) / 100,
    ersparnis: Math.round(ersparnis * 100) / 100,
    investitionNetto: Math.round(investitionNetto * 100) / 100,
    amortisation: amortisation === Infinity ? 'N/A' : Math.round(amortisation * 10) / 10,
    co2EinsparungKg,
  };
}

export { berechneWärmepumpe, CO2_GAS_KG_JE_KWH };
