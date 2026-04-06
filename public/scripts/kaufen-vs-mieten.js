function vergleicheKaufenMieten({ kaufpreis, miete, eigenkapital, zins, laufzeit, mietsteigerung, wertsteigerung }) {
  const darlehen = kaufpreis - eigenkapital;
  const zinsMonat = zins / 100 / 12;
  const tilgungMonat = 0.02 / 12; // 2% standard tilgung
  const rate = darlehen * (zinsMonat + tilgungMonat);
  
  // Kaufen: Gesamtkosten = Summe aller Raten + Eigenkapital - Immobilienwert am Ende
  let restschuld = darlehen;
  let gezahltKaufen = 0;
  for (let jahr = 0; jahr < laufzeit; jahr++) {
    for (let monat = 0; monat < 12; monat++) {
      const zinsAnteil = restschuld * zinsMonat;
      const tilgungAnteil = rate - zinsAnteil;
      restschuld -= tilgungAnteil;
      if (restschuld < 0) restschuld = 0;
      gezahltKaufen += rate;
    }
  }
  
  const immobilienwert = kaufpreis * Math.pow(1 + wertsteigerung / 100, laufzeit);
  const kostenKaufen = gezahltKaufen + eigenkapital - immobilienwert;
  
  // Mieten: Gesamtmiete mit Mietsteigerung
  let gesamtmiete = 0;
  let aktuelleMiete = miete;
  for (let jahr = 0; jahr < laufzeit; jahr++) {
    gesamtmiete += aktuelleMiete * 12;
    aktuelleMiete *= (1 + mietsteigerung / 100);
  }
  
  // Eigenkapital-Rendite (angenommene 4% Rendite als Alternative)
  const eigenkapitalRendite = eigenkapital * (Math.pow(1.04, laufzeit) - 1);
  const kostenMieten = gesamtmiete - eigenkapitalRendite;
  
  const differenz = kostenMieten - kostenKaufen;
  
  return {
    kostenKaufen,
    kostenMieten,
    differenz,
    kaufenGuemstiger: kostenKaufen < kostenMieten,
    immobilienwert,
    gesamtmiete,
    restschuld
  };
}

export { vergleicheKaufenMieten };
