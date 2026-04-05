// Rentenpunkte (Entgeltpunkte) nach § 70 SGB VI
// Durchschnittsentgelt 2025: 45.358 € (vorläufig)
const DURCHSCHNITTSENTGELT_2025 = 45358;
const RENTENWERT_WEST_2025 = 39.32; // € pro Entgeltpunkt (aktueller Rentenwert ab Juli 2024)

export function berechneRentenpunkte({ bruttoJahr, jahre = 1 }) {
  const entgeltpunkte = Math.round(bruttoJahr / DURCHSCHNITTSENTGELT_2025 * 100) / 100;
  const entgeltpunkteGesamt = Math.round(entgeltpunkte * jahre * 100) / 100;
  const monatsrente = Math.round(entgeltpunkteGesamt * RENTENWERT_WEST_2025 * 100) / 100;
  return {
    entgeltpunkte,
    entgeltpunkteGesamt,
    monatsrente,
    rentenwert: RENTENWERT_WEST_2025,
    durchschnittsentgelt: DURCHSCHNITTSENTGELT_2025,
  };
}
