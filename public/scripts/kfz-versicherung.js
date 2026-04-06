const TYP_FAKTOR = {
  small: 0.8,
  compact: 1.0,
  mid: 1.3,
  large: 1.8,
  suv: 1.5,
  ev: 0.9,
};

const SF_FAKTOR = {
  '0': 2.5,
  '1/2': 1.8,
  '1': 1.4,
  '2': 1.2,
  '3': 1.0,
  '4': 0.9,
  '5': 0.8,
  '6+': 0.5,
};

const REGION_FAKTOR = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.4, 5: 1.6 };

const VERSICHERUNG_FAKTOR = {
 haftpflicht: 1.0,
 teilkasko: 1.5,
 vollkasko: 2.5,
};

function berechneKfzVersicherung({ typ, sf, region, versicherung, alter }) {
  const basis = 400;
  const typFaktor = TYP_FAKTOR[typ] || 1.0;
  const sfFaktor = SF_FAKTOR[sf] || 1.0;
  const regionFaktor = REGION_FAKTOR[region] || 1.0;
  const versFaktor = VERSICHERUNG_FAKTOR[versicherung] || 1.0;
  const alterFaktor = alter < 25 ? 1.8 : (alter < 35 ? 1.1 : 1.0);
  
  const haftpflicht = basis * typFaktor * sfFaktor * regionFaktor * 0.6;
  const kasko = versicherung !== 'haftpflicht' 
    ? basis * typFaktor * sfFaktor * regionFaktor * (versicherung === 'vollkasko' ? 1.4 : 0.4)
    : 0;
  const beitrag = haftpflicht * alterFaktor + kasko * alterFaktor;
  
  return {
    beitrag: Math.round(beitrag * 100) / 100,
    haftpflicht: Math.round(haftpflicht * 100) / 100,
    kasko: Math.round(kasko * 100) / 100,
  };
}

export { berechneKfzVersicherung };
