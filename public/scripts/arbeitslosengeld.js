// Berechnungsgrundlage: SGB III 2026

const SV = {
  krankenversicherung: 0.146,
  rentenversicherung: 0.186,
  arbeitslosenversicherung: 0.026,
  pflegeversicherung: 0.024,
  pflegeversicherungKinderlos: 0.027,
  kvBBG: 5712.50,
  rvBBG: 7750,
};

// Leistungssätze nach § 129 SGB III
const LEISTUNGSSATZ = {
  ohneKind: 0.60,
  mitKind: 0.67,
};

// Steuerklassen-Faktoren für pauschaliertes Netto (vereinfacht)
const SK_FAKTOREN = {
  1: 0.68,  // I
  2: 0.72,  // II - mit Kind
  3: 0.78,  // III
  4: 0.68,  // IV
  5: 0.58,  // V
  6: 0.55,  // VI
};

export function berechneALG({ bruttoMonat, steuerklasse, bundesland, arbeitszeit = 100, hatKind = false, kinderlos = false }) {
  const faktorALG = arbeitszeit / 100;
  const brutto = bruttoMonat * faktorALG;
  
  // SV-Anteile berechnen (nur Arbeitnehmeranteil)
  const kvBasis = Math.min(brutto, SV.kvBBG);
  const rvBasis = Math.min(brutto, SV.rvBBG);
  const kv = Math.round(kvBasis * SV.krankenversicherung * 100) / 100;
  const rv = Math.round(rvBasis * SV.rentenversicherung * 100) / 100;
  const av = Math.round(brutto * SV.arbeitslosenversicherung * 100) / 100;
  const pvSatz = kinderlos ? SV.pflegeversicherungKinderlos : SV.pflegeversicherung;
  const pv = Math.round(brutto * pvSatz * 100) / 100;
  
  const svGesamt = kv + rv + av + pv;
  
  // Bemessungsentgelt = Brutto - SV-Anteile (Arbeitnehmer)
  const bemessungsentgelt = Math.round((brutto - svGesamt) * 100) / 100;
  
  // ALG = Bemessungsentgelt × Leistungssatz (60% oder 67% mit Kind)
  const satz = hatKind ? LEISTUNGSSATZ.mitKind : LEISTUNGSSATZ.ohneKind;
  const alg = Math.round(bemessungsentgelt * satz * 100) / 100;
  
  return {
    alg: alg,
    bemessungsentgelt: bemessungsentgelt,
    satz: satz * 100,
    brutto: brutto,
    svGesamt: svGesamt,
    kv: kv,
    rv: rv,
    av: av,
    pv: pv,
  };
}

export { LEISTUNGSSATZ, SK_FAKTOREN };