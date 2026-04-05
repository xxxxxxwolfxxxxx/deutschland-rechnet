// Stand 2025
export const STEUERSAETZE = {
  bw: 5.0, by: 3.5, be: 6.0, bb: 6.5, hb: 5.0, hh: 5.5,
  he: 6.0, mv: 6.0, ni: 5.0, nw: 6.5, rp: 5.0, sl: 6.5,
  sn: 5.5, st: 5.0, sh: 6.5, th: 6.5,
};

export function berechneGrunderwerbsteuer({ kaufpreis, bundesland }) {
  const satz = STEUERSAETZE[bundesland] ?? 5.0;
  const steuer = Math.round(kaufpreis * satz / 100);
  return { steuer, satz };
}
