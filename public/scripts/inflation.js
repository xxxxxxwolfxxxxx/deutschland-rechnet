// Inflationsrechner: Kaufkraftverlust durch Inflation
export function berechneInflation({ betrag, inflationsrateProzent, jahre }) {
  const rate = inflationsrateProzent / 100;
  const kaufkraftHeute = Math.round(betrag / Math.pow(1 + rate, jahre) * 100) / 100;
  const verlust = Math.round((betrag - kaufkraftHeute) * 100) / 100;
  const verlustProzent = Math.round((verlust / betrag) * 1000) / 10;
  // Für wie viel müsste man heute kaufen, damit es damals X € wert war?
  const nominalHeute = Math.round(betrag * Math.pow(1 + rate, jahre) * 100) / 100;
  return { kaufkraftHeute, verlust, verlustProzent, nominalHeute };
}
