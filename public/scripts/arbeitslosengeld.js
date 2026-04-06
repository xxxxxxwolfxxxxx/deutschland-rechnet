const STEUER_KLASSEN_FAKTOR = {
  I: 0.68,
  II: 0.72,
  III: 0.78,
  IV: 0.68,
  V: 0.58,
  VI: 0.55,
};

const KV_BEITRAG = 0.145;
const RV_BEITRAG = 0.186;
const AV_BEITRAG = 0.02;
const PV_BEITRAG = 0.024;

function berechneALG({ brutto, stklasse, bundesland, arbeitszeit = 100, hatKind = false }) {
  const faktorALG = arbeitszeit / 100;
  const jahresBrutto = Math.round(brutto * 12);
  
  const faktorNetto = STEUER_KLASSEN_FAKTOR[stklasse] || 0.68;
  
  const kv = brutto * KV_BEITRAG * faktorALG;
  const rv = brutto * RV_BEITRAG * faktorALG;
  const av = brutto * AV_BEITRAG * faktorALG;
  const pflege = brutto * PV_BEITRAG * faktorALG;
  
  const abgaben = kv + rv + av + pflege;
  const netto = (brutto - abgaben) * faktorNetto * faktorALG;
  
  const bemessungsentgelt = netto;
  const satz = hatKind ? 0.67 : 0.60;
  const alg = Math.round(bemessungsentgelt * satz * 100) / 100;
  
  return {
    alg: Math.round(alg * 100) / 100,
    netto: Math.round(netto * 100) / 100,
    bemessungsentgelt: Math.round(bemessungsentgelt * 100) / 100,
    satz,
    jahresBrutto: Math.round(brutto * 12 * 100) / 100,
  };
}

export { berechneALG };
