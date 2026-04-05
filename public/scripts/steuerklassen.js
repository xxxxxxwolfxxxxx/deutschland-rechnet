// Steuerklassen-Vergleich 2025 – vereinfachte Lohnsteuerberechnung
// Grundlage: Einkommensteuergesetz, Lohnsteuertabellen 2025
// Vereinfachtes Modell (ohne Kinderfreibetrag, ohne Kirchensteuer)

const GRUNDFREIBETRAG = 12084;   // § 32a EStG 2025
const SOLIDARITAETSZUSCHLAG_SCHWELLE = 18130; // Freigrenze Solo 2025

// Sozialversicherung 2025 (Arbeitnehmer-Anteil)
const SV = {
  krankenversicherung: 0.073 + 0.009, // 7,3% + ø 0,9% Zusatzbeitrag
  pflegeversicherung:  0.01800,        // 1,8% (ohne Kinder = 2,3%)
  rentenversicherung:  0.093,          // 9,3%
  arbeitslosenversicherung: 0.013,     // 1,3%
};
const SV_GESAMT = Object.values(SV).reduce((a,b) => a+b, 0);
const KV_BBG_MONAT = 5512.50;    // Beitragsbemessungsgrenze KV/PV 2025
const RV_BBG_MONAT = 8050.00;    // Beitragsbemessungsgrenze RV/AV 2025 (West)

// Kinderfreibetrag und Sondersituation pro Steuerklasse
const SK_KINDER = { I:0, II:0.5, III:1, IV:0, V:0, VI:0 };
const SK_DOPPELT = { I:false, II:false, III:true, IV:false, V:false, VI:false };

function lohnsteuerJahr(zvE) {
  if (zvE <= GRUNDFREIBETRAG) return 0;
  const y = (zvE - GRUNDFREIBETRAG) / 10000;
  let st;
  if (zvE <= 17443) {
    const z = (zvE - 12084) / 10000;
    st = (979.18 * z + 1400) * z;
  } else if (zvE <= 66761) {
    const z = (zvE - 17443) / 10000;
    st = (192.59 * z + 2397) * z + 966.53;
  } else if (zvE <= 277825) {
    st = 0.42 * zvE - 10602.13;
  } else {
    st = 0.45 * zvE - 18936.88;
  }
  return Math.max(0, Math.round(st * 100) / 100);
}

function solidaritaetszuschlag(lst) {
  if (lst <= SOLIDARITAETSZUSCHLAG_SCHWELLE) return 0;
  return Math.round(lst * 0.055 * 100) / 100;
}

export function berechneAlleKlassen(bruttoJahr) {
  const bruttoMonat = bruttoJahr / 12;

  return ['I','II','III','IV','V','VI'].map(klasse => {
    // Jahres-zvE vereinfacht (SK III: doppelter Grundfreibetrag)
    const freibetrag = SK_DOPPELT[klasse] ? GRUNDFREIBETRAG * 2 : GRUNDFREIBETRAG;
    // SK V/VI: kein eigener Grundfreibetrag
    const zvE = klasse === 'V' || klasse === 'VI'
      ? bruttoJahr
      : Math.max(0, bruttoJahr - freibetrag);

    let lst;
    if (klasse === 'V') {
      lst = lohnsteuerJahr(bruttoJahr) * 1.25;
    } else if (klasse === 'VI') {
      lst = lohnsteuerJahr(bruttoJahr) * 1.40;
    } else if (klasse === 'III') {
      lst = lohnsteuerJahr(Math.max(0, bruttoJahr - GRUNDFREIBETRAG * 2));
    } else {
      lst = lohnsteuerJahr(Math.max(0, bruttoJahr - GRUNDFREIBETRAG));
    }
    lst = Math.max(0, Math.round(lst * 100) / 100);

    const soli = solidaritaetszuschlag(lst);

    // SV-Beiträge (monatlich gedeckelt)
    const kvBasis = Math.min(bruttoMonat, KV_BBG_MONAT);
    const rvBasis = Math.min(bruttoMonat, RV_BBG_MONAT);
    const svMonat =
      kvBasis * (SV.krankenversicherung + SV.pflegeversicherung) +
      rvBasis * (SV.rentenversicherung + SV.arbeitslosenversicherung);
    const svJahr = Math.round(svMonat * 12 * 100) / 100;

    const nettoJahr = Math.round((bruttoJahr - lst - soli - svJahr) * 100) / 100;
    const nettoMonat = Math.round(nettoJahr / 12 * 100) / 100;

    return {
      klasse,
      bruttoMonat: Math.round(bruttoMonat * 100) / 100,
      lstMonat: Math.round(lst / 12 * 100) / 100,
      soliMonat: Math.round(soli / 12 * 100) / 100,
      svMonat: Math.round(svMonat * 100) / 100,
      nettoMonat,
    };
  });
}
