const GRUNDFREIBETRAG = 11604;
const WERBUNGSPAUSCHALE = 1230;
const VORSORGEPAUSCHALE = 0.09;

function berechneEinkommensteuer(zuVersteuern) {
  if (zuVersteuern <= 0) return 0;
  let eSt = 0;
  const y = zuVersteuern / 10000;
  if (y <= 17.009) {
    eSt = (922.98 * y + 1400) * y;
  } else if (y <= 66.760) {
    eSt = (181.19 * y + 2397) * y + 1025.38;
  } else if (y <= 277.825) {
    eSt = (0.42 * zuVersteuern - 10602.13);
  } else {
    eSt = 0.45 * zuVersteuern - 16599.53;
  }
  return Math.max(0, Math.round(eSt));
}

function berechneSteuernachzahlung({ brutto, stklasse, stklasse2 = '0', werbung = 1000, sonder = 2000, kinder = 0 }) {
  const kirchensteuer = stklasse !== 'V' && stklasse !== 'VI' ? 0.08 : 0;
  const kirchensteuer2 = stklasse2 !== '0' && stklasse2 !== 'V' && stklasse2 !== 'VI' ? 0.08 : 0;
  
  let arbeitslostenPauschale = Math.min(werbung, WERBUNGSPAUSCHALE);
  let abzuege = arbeitslostenPauschale + sonder + GRUNDFREIBETRAG;
  
  const brutto2 = stklasse2 !== '0' ? brutto * 0.5 : 0;
  const bruttoPartner = stklasse2 !== '0' ? brutto * 0.5 : 0;
  
  const zuVersteuern = Math.max(0, brutto - abzuege);
  const jahresSteuer = berechneEinkommensteuer(zuVersteuern) * (1 + kirchensteuer);
  
  const zuVersteuern2 = stklasse2 !== '0' ? Math.max(0, bruttoPartner - (GRUNDFREIBETRAG + WERBUNGSPAUSCHALE + sonder/2)) : 0;
  const jahresSteuer2 = stklasse2 !== '0' ? berechneEinkommensteuer(zuVersteuern2) * (1 + kirchensteuer2) : 0;
  
  const gesamteSteuer = jahresSteuer + jahresSteuer2;
  
  const stklFaktor = { I: 0.68, II: 0.72, III: 0.78, IV: 0.68, V: 0.58, VI: 0.55 };
  const faktor = stklFaktor[stklasse] || 0.68;
  const faktor2 = stklasse2 !== '0' ? (stklFaktor[stklasse2] || 0.68) : 0;
  
  const voraussichtlicheAbgaben = brutto * (0.2 + VORSORGEPAUSCHALE) + (brutto2 * (0.2 + VORSORGEPAUSCHALE));
  const freibetraege = GRUNDFREIBETRAG + arbeitslostenPauschale + sonder;
  
  const nachzahlung = gesamteSteuer;
  
  return {
    nachzahlung: Math.round(nachzahlung * 100) / 100,
    jahresSteuer: Math.round(gesamteSteuer * 100) / 100,
    abgaben: Math.round(voraussichtlicheAbgaben * 100) / 100,
    freibetraege: Math.round(freibetraege * 100) / 100,
    pauschbetrag: Math.round(arbeitslostenPauschale * 100) / 100,
  };
}

export { berechneSteuernachzahlung };
