// Düsseldorfer Tabelle 2026 – Einkommensgruppen (Nettoeinkommen bis …)
const TABELLE = [
  [1900,  [480,  551,  645,  693]],
  [2300,  [504,  579,  677,  728]],
  [2700,  [534,  614,  718,  772]],
  [3100,  [564,  648,  759,  816]],
  [3700,  [602,  692,  810,  870]],
  [4300,  [643,  739,  865,  930]],
  [4900,  [684,  787,  921,  990]],
  [5500,  [726,  835,  978, 1052]],
  [6400,  [790,  909, 1064, 1145]],
  [7500,  [857,  986, 1154, 1241]],
  [Infinity, [927, 1067, 1249, 1343]],
];

function getAltersstufe(alter) {
  if (alter <= 5)  return 0;
  if (alter <= 11) return 1;
  if (alter <= 17) return 2;
  return 3;
}

export function berechneUnterhalt({ alterKind, nettoEinkommen }) {
  const stufe = getAltersstufe(alterKind);
  let gruppenIndex = 0;
  let unterhalt = 0;
  for (let i = 0; i < TABELLE.length; i++) {
    const [grenze, betraege] = TABELLE[i];
    if (nettoEinkommen <= grenze) {
      gruppenIndex = i;
      unterhalt = betraege[stufe];
      break;
    }
  }
  return { unterhalt, einkommensgruppe: gruppenIndex + 1, altersstufe: stufe + 1 };
}
