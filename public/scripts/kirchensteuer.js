// Kirchensteuer-Rechner 2025
// Sätze: 9% der Lohnsteuer (BY, BW: 8%)
// Kappungsregelung: max 2,75–4% des zvE (je nach Bundesland)

const KI_SAETZE = {
  'BW':  { satz: 0.08, kappung: 0.025, name: 'Baden-Württemberg' },
  'BY':  { satz: 0.08, kappung: 0.025, name: 'Bayern' },
  'BE':  { satz: 0.09, kappung: 0.030, name: 'Berlin' },
  'BB':  { satz: 0.09, kappung: 0.030, name: 'Brandenburg' },
  'HB':  { satz: 0.09, kappung: 0.030, name: 'Bremen' },
  'HH':  { satz: 0.09, kappung: 0.030, name: 'Hamburg' },
  'HE':  { satz: 0.09, kappung: 0.030, name: 'Hessen' },
  'MV':  { satz: 0.09, kappung: 0.030, name: 'Mecklenburg-Vorpommern' },
  'NI':  { satz: 0.09, kappung: 0.030, name: 'Niedersachsen' },
  'NW':  { satz: 0.09, kappung: 0.030, name: 'Nordrhein-Westfalen' },
  'RP':  { satz: 0.09, kappung: 0.030, name: 'Rheinland-Pfalz' },
  'SL':  { satz: 0.09, kappung: 0.030, name: 'Saarland' },
  'SN':  { satz: 0.09, kappung: 0.030, name: 'Sachsen' },
  'ST':  { satz: 0.09, kappung: 0.030, name: 'Sachsen-Anhalt' },
  'SH':  { satz: 0.09, kappung: 0.030, name: 'Schleswig-Holstein' },
  'TH':  { satz: 0.09, kappung: 0.030, name: 'Thüringen' },
};

// Vereinfachte Lohnsteuerberechnung (wie in steuerklassen.js)
function lohnsteuerJahr(bruttoJahr) {
  const GRUNDFREIBETRAG = 12084;
  const zvE = Math.max(0, bruttoJahr - GRUNDFREIBETRAG);
  if (zvE <= 0) return 0;
  let st;
  if (bruttoJahr <= 17443) {
    const z = zvE / 10000;
    st = (979.18 * z + 1400) * z;
  } else if (bruttoJahr <= 66761) {
    const z = (bruttoJahr - 17443) / 10000;
    st = (192.59 * z + 2397) * z + 966.53;
  } else if (bruttoJahr <= 277825) {
    st = 0.42 * bruttoJahr - 10602.13;
  } else {
    st = 0.45 * bruttoJahr - 18936.88;
  }
  return Math.max(0, Math.round(st * 100) / 100);
}

export function berechneKirchensteuer({ bruttoJahr, bundesland = 'NW', konfession = 'rk' }) {
  if (konfession === 'keine') {
    return { kirchensteuerJahr: 0, kirchensteuerMonat: 0, konfession, bundesland };
  }

  const bl = KI_SAETZE[bundesland] ?? KI_SAETZE['NW'];
  const lst = lohnsteuerJahr(bruttoJahr);
  const kirchensteuerRoh = lst * bl.satz;

  // Kappung: max bl.kappung% des Bruttoeinkommens
  const kappungsBetrag = bruttoJahr * bl.kappung;
  const kirchensteuerJahr = Math.round(Math.min(kirchensteuerRoh, kappungsBetrag) * 100) / 100;
  const kirchensteuerMonat = Math.round(kirchensteuerJahr / 12 * 100) / 100;
  const gekappt = kirchensteuerRoh > kappungsBetrag;

  return {
    kirchensteuerJahr,
    kirchensteuerMonat,
    lohnsteuerJahr: Math.round(lst * 100) / 100,
    satz: bl.satz,
    gekappt,
    bundeslandName: bl.name,
    konfession,
  };
}

export { KI_SAETZE };
