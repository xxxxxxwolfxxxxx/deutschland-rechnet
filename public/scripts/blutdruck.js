// Einordnung eines Blutdruckwerts nach der ESH-Leitlinie
//
// Quellen (abgerufen am 18.09.2026):
// - 2023 ESH Guidelines for the management of arterial hypertension
//   (Journal of Hypertension 2023;41:1874–2071), Tabelle der
//   Blutdruckkategorien: optimal, normal, hoch-normal, Hypertonie Grad 1–3.
// - Deutsche Hochdruckliga, Patienteninformation zu den Blutdruckwerten.
//
// ENTSCHEIDEND ist die Regel, an der die frühere Fassung dieses Rechners
// scheiterte: Fallen oberer und unterer Wert in verschiedene Kategorien, gilt
// die HÖHERE der beiden. Das Seitenskript verknüpfte die Grenzen bis September
// 2026 mit ODER und meldete für 145/85 „hoch-normal“ – der obere Wert steht
// dort längst in Grad 1.
//
// Die Werte gelten für die Messung in der Arztpraxis und für Erwachsene. Für
// die Selbstmessung zu Hause liegen die Grenzen niedriger (Hypertonie ab
// 135/85). Die Einordnung ersetzt keine ärztliche Abklärung.

export const ESH_STUFEN = [
  { name: 'optimal', systolischAb: 0, diastolischAb: 0 },
  { name: 'normal', systolischAb: 120, diastolischAb: 80 },
  { name: 'hoch-normal', systolischAb: 130, diastolischAb: 85 },
  { name: 'Hypertonie Grad 1', systolischAb: 140, diastolischAb: 90 },
  { name: 'Hypertonie Grad 2', systolischAb: 160, diastolischAb: 100 },
  { name: 'Hypertonie Grad 3', systolischAb: 180, diastolischAb: 110 },
];

/** Grenze, ab der in der Praxis von Hypertonie gesprochen wird. */
export const HYPERTONIE_AB = { systolisch: 140, diastolisch: 90 };

/** Dieselbe Grenze für die Selbstmessung zu Hause. */
export const HYPERTONIE_AB_HEIM = { systolisch: 135, diastolisch: 85 };

function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) ? n : 0;
}

/** Index der höchsten Stufe, deren Grenze der Wert erreicht. */
function stufeVon(wert, feld) {
  let stufe = 0;
  ESH_STUFEN.forEach((s, i) => {
    if (wert >= s[feld]) stufe = i;
  });
  return stufe;
}

/**
 * Einordnung eines in der Praxis gemessenen Werts.
 *
 * @param {object} e
 * @param {number} e.systolisch oberer Wert in mmHg
 * @param {number} e.diastolisch unterer Wert in mmHg
 * @returns {{stufe:number,name:string,treiber:string,isoliert:string,hypertonie:boolean}}
 */
export function klassifiziereBlutdruck({ systolisch, diastolisch }) {
  const sys = zahl(systolisch);
  const dia = zahl(diastolisch);
  const stufeSys = stufeVon(sys, 'systolischAb');
  const stufeDia = stufeVon(dia, 'diastolischAb');
  const stufe = Math.max(stufeSys, stufeDia);

  const treiber =
    stufeSys > stufeDia ? 'oberer Wert' : stufeDia > stufeSys ? 'unterer Wert' : 'beide';

  // § der Leitlinie: Ein Wert allein über der Grenze ist eine isolierte Form.
  let isoliert = '';
  if (sys >= HYPERTONIE_AB.systolisch && dia < HYPERTONIE_AB.diastolisch) {
    isoliert = 'isoliert systolisch';
  } else if (sys < HYPERTONIE_AB.systolisch && dia >= HYPERTONIE_AB.diastolisch) {
    isoliert = 'isoliert diastolisch';
  }

  return {
    stufe,
    name: ESH_STUFEN[stufe].name,
    treiber,
    isoliert,
    hypertonie: stufe >= 3,
  };
}
