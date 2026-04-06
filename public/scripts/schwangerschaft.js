function berechneSchwangerschaft({ letztePeriode, netto, arbeitgeberZuschuss }) {
  const lpDate = new Date(letztePeriode);
  const geburtstermin = new Date(lpDate);
  geburtstermin.setDate(geburtstermin.getDate() + 280);
  
  const jetzt = new Date();
  const tageSchwanger = Math.floor((jetzt - lpDate) / (1000 * 60 * 60 * 24));
  const sswochen = Math.floor(tageSchwanger / 7);
  const ssTage = tageSchwanger % 7;
  
  const mutterschaftsgeldTag = Math.min(13, netto / 30);
  const mutterschaftsgeldVorGeburt = mutterschaftsgeldTag * 42;
  const mutterschaftsgeldNachGeburt = mutterschaftsgeldTag * 56;
  
  let gesamt = mutterschaftsgeldVorGeburt + mutterschaftsgeldNachGeburt;
  if (arbeitgeberZuschuss) {
    const nettoTag = netto / 30;
    const arbeitgeberTag = nettoTag - mutterschaftsgeldTag;
    gesamt = gesamt + (arbeitgeberTag * 98);
  }
  
  return {
    geburtstermin,
    ssW: sswochen,
    ssWTage: ssTage,
    mutterschaftsgeldTag: Math.round(mutterschaftsgeldTag * 100) / 100,
    mutterschaftsgeldVorGeburt: Math.round(mutterschaftsgeldVorGeburt * 100) / 100,
    mutterschaftsgeldNachGeburt: Math.round(mutterschaftsgeldNachGeburt * 100) / 100,
    gesamt: Math.round(gesamt * 100) / 100,
  };
}

export { berechneSchwangerschaft };
