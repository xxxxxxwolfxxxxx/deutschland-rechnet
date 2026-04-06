const STEUER_KLASSEN_FAKTOR = {
  I: 0.68, II: 0.72, III: 0.78, IV: 0.68, V: 0.58, VI: 0.55,
};

function berechneGehaltserhoehung({ brutto, erhoehung, typ, stklasse }) {
  const faktorNetto = STEUER_KLASSEN_FAKTOR[stklasse] || 0.68;
  
  let bruttoGewinn;
  if (typ === 'prozent') {
    bruttoGewinn = brutto * (erhoehung / 100);
  } else {
    bruttoGewinn = erhoehung;
  }
  
  const neuesBrutto = brutto + bruttoGewinn;
  
  const netto = brutto * faktorNetto;
  const neuesNetto = neuesBrutto * faktorNetto;
  
  const nettoGewinn = neuesNetto - netto;
  
  const faktorNeuesNetto = STEUER_KLASSEN_FAKTOR[stklasse] || 0.68;
  const abgaben = bruttoGewinn * (1 - faktorNeuesNetto);
  
  return {
    bruttoGewinn: Math.round(bruttoGewinn * 100) / 100,
    nettoGewinn: Math.round(nettoGewinn * 100) / 100,
    abgaben: Math.round(abgaben * 100) / 100,
    neuesBrutto: Math.round(neuesBrutto * 100) / 100,
    neuesNetto: Math.round(neuesNetto * 100) / 100,
  };
}

export { berechneGehaltserhoehung };
