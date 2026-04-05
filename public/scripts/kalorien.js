// Mifflin-St-Jeor-Formel
export function berechneKalorienbedarf({ geschlecht, alter, gewicht, groesse, aktivitaet }) {
  let bmr;
  if (geschlecht === 'm') {
    bmr = 10 * gewicht + 6.25 * groesse - 5 * alter + 5;
  } else {
    bmr = 10 * gewicht + 6.25 * groesse - 5 * alter - 161;
  }
  bmr = Math.round(bmr);
  const tdee = Math.round(bmr * aktivitaet);
  return { bmr, tdee };
}
