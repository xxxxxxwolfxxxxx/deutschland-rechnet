// Photovoltaik-Rechner (Stand 2025)
// Einspeisevergütung: EEG 2023 – Module bis 10 kWp: 8,03 ct/kWh (Volleinspeisung)
//                    Überschusseinspeisung bis 10 kWp: 8,11 ct/kWh

const EINSPEISEVERGUETUNG_UNTER_10 = 0.0811; // ct/kWh Überschuss, Anlagen bis 10 kWp
const SONNENSTUNDEN_D_DURCHSCHNITT = 950;    // kWh/kWp/Jahr (Deutschland-Durchschnitt)
const DEGRADATION = 0.005;                   // 0,5% Leistungsverlust pro Jahr

export function berechnePhotovoltaik({
  leistungKwp,
  investition,
  strompreis,
  eigenverbrauchAnteil = 0.30,   // 30% Eigenverbrauch
  jahresertragFaktor = SONNENSTUNDEN_D_DURCHSCHNITT,
}) {
  const jahresertrag = leistungKwp * jahresertragFaktor;   // kWh/Jahr
  const eigenverbrauchKwh = jahresertrag * eigenverbrauchAnteil;
  const einspeisungKwh = jahresertrag * (1 - eigenverbrauchAnteil);

  const einsparungStrom = eigenverbrauchKwh * strompreis;
  const einspeiseerloese = einspeisungKwh * EINSPEISEVERGUETUNG_UNTER_10;
  const jahresertragEuro = Math.round((einsparungStrom + einspeiseerloese) * 100) / 100;

  // Amortisation unter Berücksichtigung von Degradation
  let kumuliert = 0;
  let amortJahre = null;
  for (let j = 1; j <= 30; j++) {
    const faktor = Math.pow(1 - DEGRADATION, j - 1);
    kumuliert += jahresertragEuro * faktor;
    if (kumuliert >= investition && amortJahre === null) amortJahre = j;
  }

  const rendite25j = Math.round(
    (Array.from({length:25}, (_, i) => jahresertragEuro * Math.pow(1 - DEGRADATION, i))
      .reduce((a,b) => a + b, 0) - investition) * 100
  ) / 100;

  return {
    jahresertragKwh: Math.round(jahresertrag),
    eigenverbrauchKwh: Math.round(eigenverbrauchKwh),
    einspeisungKwh: Math.round(einspeisungKwh),
    einsparungStrom: Math.round(einsparungStrom * 100) / 100,
    einspeiseerloese: Math.round(einspeiseerloese * 100) / 100,
    jahresertragEuro,
    amortJahre,
    rendite25j,
    einspeiseverguetung: EINSPEISEVERGUETUNG_UNTER_10,
  };
}
