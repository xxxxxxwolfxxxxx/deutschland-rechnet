function berechneLeasing({ neupreis, anzahlung, laufzeit, restwert, zins, km }) {
  const leasingbetrag = neupreis - restwert - anzahlung;
  const zinskosten = (neupreis + restwert) / 2 * (zins / 100) * (laufzeit / 12);
  const gesamtLeasing = leasingbetrag + zinskosten;
  const rate = gesamtLeasing / laufzeit;
  const gesamtkosten = anzahlung + (rate * laufzeit);
  const kilometers = km * (laufzeit / 12);
  const kostenProKm = gesamtLeasing / kilometers;
  
  return {
    rate: Math.round(rate * 100) / 100,
    gesamtLeasing: Math.round(gesamtLeasing * 100) / 100,
    gesamtKosten: Math.round(gesamtkosten * 100) / 100,
    zinskosten: Math.round(zinskosten * 100) / 100,
    kostenProKm: Math.round(kostenProKm * 1000) / 1000,
  };
}

export { berechneLeasing };
