// Berechnungsgrundlage: § 32a EStG 2026, BMAS SV-Beitragssätze 2026
const SV = {
  krankenversicherung: 0.073 + 0.011,  // 14,6% + Zusatzbeitrag 1,1%
  rentenversicherung: 0.093,
  arbeitslosenversicherung: 0.013,
  pflegeversicherung: 0.024,  // 2,4% (Kinderlose 2,7%)
  pflegeversicherungKinderlos: 0.027,
  kvBBG: 5712.50,  // 2026 West
  rvBBG: 7750,    // 2026 West
};

// Kirchensteuer: 8% in BY, BW, HE, NRW, RP, SL, SN, ST, TH; 9% in BE, BB, HB, HH, MV, NI, SH
const KIST = {
  by: 0.08, bw: 0.08, he: 0.08, nrw: 0.08, rp: 0.08, sl: 0.08, sn: 0.08, st: 0.08, th: 0.08
};

function einkommensteuerJahr(zvE) {
  if (zvE <= 12096) return 0;
  if (zvE <= 17005) {
    const y = (zvE - 12096) / 10000;
    return Math.round((979.18 * y + 1400) * y);
  }
  if (zvE <= 66760) {
    const z = (zvE - 17005) / 10000;
    return Math.round((192.59 * z + 2397) * z + 966.53);
  }
  if (zvE <= 277825) return Math.round(0.42 * zvE - 10911.92);
  return Math.round(0.45 * zvE - 19246.67);
}

const SK_FAKTOREN = {
  1: { freibetrag: 12096 },
  2: { freibetrag: 15900 },
  3: { freibetrag: 24192 },
  4: { freibetrag: 12096 },
  5: { freibetrag: 0 },
  6: { freibetrag: 0 },
};

export const STEUERKLASSEN = [1, 2, 3, 4, 5, 6];

export function berechneNettoGehalt({ bruttoMonat, steuerklasse, kirchensteuer, bundesland, kinderlos = false }) {
  const bruttoJahr = bruttoMonat * 12;
  const freibetrag = SK_FAKTOREN[steuerklasse]?.freibetrag ?? 12096;
  const kvBasis = Math.min(bruttoMonat, SV.kvBBG);
  const rvBasis = Math.min(bruttoMonat, SV.rvBBG);
  const kv = Math.round(kvBasis * SV.krankenversicherung * 100) / 100;
  const rv = Math.round(rvBasis * SV.rentenversicherung * 100) / 100;
  const av = Math.round(rvBasis * SV.arbeitslosenversicherung * 100) / 100;
  const pvSatz = kinderlos ? SV.pflegeversicherungKinderlos : SV.pflegeversicherung;
  const pv = Math.round(kvBasis * pvSatz * 100) / 100;
  const svGesamt = kv + rv + av + pv;
  const svJahr = svGesamt * 12;
  const zvE = Math.max(0, bruttoJahr - freibetrag - svJahr);
  const estJahr = einkommensteuerJahr(zvE);
  const lohnsteuerMonat = Math.round(estJahr / 12 * 100) / 100;
  let soliMonat = 0;
  if (estJahr > 18130) soliMonat = Math.round((estJahr * 0.055) / 12 * 100) / 100;
  let kistMonat = 0;
  if (kirchensteuer) {
    const satz = KIST[bundesland] ?? 0.09;
    kistMonat = Math.round(lohnsteuerMonat * satz * 100) / 100;
  }
  const abzuege = svGesamt + lohnsteuerMonat + soliMonat + kistMonat;
  const netto = Math.round((bruttoMonat - abzuege) * 100) / 100;
  return {
    netto, lohnsteuer: lohnsteuerMonat, soli: soliMonat, kirchensteuer: kistMonat,
    sozialversicherung: Math.round(svGesamt * 100) / 100,
    krankenversicherung: kv, rentenversicherung: rv,
    arbeitslosenversicherung: av, pflegeversicherung: pv,
  };
}
