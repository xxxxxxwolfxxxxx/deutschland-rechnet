// Renten-Schnellrechner 2025
// Formel: Monatsrente = Entgeltpunkte × Zugangsfaktor × Rentenartfaktor × aktueller Rentenwert
// Aktueller Rentenwert West 2025: 39,32 € (ab 1.7.2025: voraussichtlich ~41,00 €)
// Aktueller Rentenwert Ost 2025: 39,32 € (Angleichung abgeschlossen seit 2024)

const RENTENWERT = 39.32; // € pro Entgeltpunkt (West = Ost ab 2024)
const RENTENEINTRITT_REGELALT = 67; // Regelaltersrente ab Jg. 1964+

export function berechneRente({
  geburtsjahrgang,
  rentenbeginn,       // geplantes Renteneintrittsjahr
  entgeltpunkte,      // gesammelte Entgeltpunkte (aus Rentenauskunft)
  bruttoMonat,        // aktuelles Bruttogehalt für zukünftige Punkte
  versicherungsjahre, // bereits versicherte Jahre
}) {
  const alter = rentenbeginn - geburtsjahrgang;

  // Zugangsfaktor: pro Monat Frührentner -0,003, pro Monat später +0,005
  const monateVorzeitig = Math.max(0, (RENTENEINTRITT_REGELALT - alter) * 12);
  const monateNachzeitig = Math.max(0, (alter - RENTENEINTRITT_REGELALT) * 12);
  const zugangsfaktor = Math.round(
    (1 - monateVorzeitig * 0.003 + monateNachzeitig * 0.005) * 10000
  ) / 10000;

  // Zukünftige Entgeltpunkte bis Renteneintritt (grobe Schätzung)
  // Durchschnittsentgelt 2025: ~45.358 €/Jahr → 1 EP = 45.358 € Brutto
  const DURCHSCHNITTSENTGELT = 45358;
  const restjahre = Math.max(0, rentenbeginn - new Date().getFullYear());
  const epProJahr = (bruttoMonat * 12) / DURCHSCHNITTSENTGELT;
  const zukuenftigeEP = Math.round(restjahre * epProJahr * 100) / 100;

  const gesamtEP = Math.round((entgeltpunkte + zukuenftigeEP) * 100) / 100;

  // Monatsrente brutto
  const renteMonat = Math.round(gesamtEP * zugangsfaktor * 1.0 * RENTENWERT * 100) / 100;

  // Abzüge: KV 7,3% + 0,9% Zusatz + PV 2,35% (Rentner zahlen vollen Satz)
  const kvAnteil = renteMonat * 0.082;
  const pvAnteil = renteMonat * 0.0235;
  const renteNetto = Math.round((renteMonat - kvAnteil - pvAnteil) * 100) / 100;

  // Rentenlücke
  const letzterNettoMonat = bruttoMonat * 0.70; // vereinfacht 70% Nettoquote
  const rentenluecke = Math.max(0, Math.round((letzterNettoMonat - renteNetto) * 100) / 100);

  return {
    gesamtEP,
    entgeltpunkte,
    zukuenftigeEP,
    zugangsfaktor,
    monateVorzeitig,
    renteMonat,
    renteNetto,
    letzterNettoMonat: Math.round(letzterNettoMonat * 100) / 100,
    rentenluecke,
    rentenwert: RENTENWERT,
    alter,
  };
}
