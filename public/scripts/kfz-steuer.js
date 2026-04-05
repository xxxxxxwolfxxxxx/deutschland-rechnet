// KraftStG: 2,00€/100ccm (Benzin), 9,50€/100ccm (Diesel) + CO2-Staffel
const SATZ = { benzin: 2.00, diesel: 9.50 };

const CO2_STAFFEL = [
  [95,  0],
  [115, 2],
  [135, 2.20],
  [155, 2.50],
  [175, 2.90],
  [195, 3.40],
  [Infinity, 4.00],
];

function co2Steuer(co2) {
  let steuer = 0;
  let prev = 0;
  for (const [grenze, satz] of CO2_STAFFEL) {
    if (co2 <= grenze) {
      steuer += (co2 - prev) * satz;
      break;
    }
    steuer += (grenze - prev) * satz;
    prev = grenze;
  }
  return Math.round(steuer * 100) / 100;
}

export function berechneKfzSteuer({ antrieb, hubraum, co2 }) {
  if (antrieb === 'elektro') return { steuerJahr: 0, steuerMonat: 0, hinweis: 'Steuerfrei bis 2030' };
  const satz = SATZ[antrieb] ?? SATZ.benzin;
  const hubraumSteuer = Math.ceil(hubraum / 100) * satz;
  const co2Anteil = co2Steuer(co2);
  const steuerJahr = Math.round((hubraumSteuer + co2Anteil) * 100) / 100;
  return { steuerJahr, steuerMonat: Math.round(steuerJahr / 12 * 100) / 100, hinweis: '' };
}
