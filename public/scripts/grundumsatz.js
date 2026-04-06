function berechneGrundumsatz({ gewicht, groesse, alter, geschlecht }) {
  let grundumsatz;
  if (geschlecht === 'm') {
    grundumsatz = 88.362 + (13.397 * gewicht) + (4.799 * groesse) - (5.677 * alter);
  } else {
    grundumsatz = 447.593 + (9.247 * gewicht) + (3.098 * groesse) - (4.330 * alter);
  }
  return {
    grundumsatz: Math.round(grundumsatz),
  };
}

export { berechneGrundumsatz };
