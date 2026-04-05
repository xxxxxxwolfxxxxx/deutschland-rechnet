// Annuitätendarlehen
export function berechneKredit({ betrag, zinssatz, laufzeitJahre }) {
  const n = laufzeitJahre * 12;
  const r = zinssatz / 100 / 12;
  let monatsrate;
  if (r === 0) {
    monatsrate = betrag / n;
  } else {
    monatsrate = betrag * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
  monatsrate = Math.round(monatsrate * 100) / 100;
  const gesamtkosten = Math.round(monatsrate * n * 100) / 100;
  const gesamtzinsen = Math.round((gesamtkosten - betrag) * 100) / 100;
  return { monatsrate, gesamtkosten, gesamtzinsen };
}
