// Kurzarbeitergeld-Rechner nach § 95 ff. SGB III (Stand 2025)
// Satz: 60% (ohne Kind), 67% (mit Kind) des pauschalierten Nettolohnausfalls

// Leistungssatz-Tabelle SGB III (vereinfacht – pauschaliertes Netto)
// In der Praxis verwendet die BA amtliche Tabellen; wir approximieren mit:
// pauschNetto ≈ brutto × nettofaktor (abhängig von Steuerklasse)

const NETTOANTEIL = {
  I: 0.698,
  II: 0.698,
  III: 0.778,
  IV: 0.698,
  V: 0.610,
  VI: 0.570,
};

export function berechneKurzarbeitergeld({
  bruttoMonat,
  steuerklasse = 'I',
  hatKind = false,
  ausfallProzent = 100,   // % des Entgelts, das wegfällt
}) {
  const ausfallAnteil = Math.min(100, Math.max(0, ausfallProzent)) / 100;
  const nettofaktor = NETTOANTEIL[steuerklasse] ?? NETTOANTEIL['I'];

  // Sollentgelt (was ohne Kurzarbeit gezahlt worden wäre)
  const sollBrutto = bruttoMonat;
  const sollNetto = sollBrutto * nettofaktor;

  // Istentgelt (was tatsächlich gezahlt wird)
  const istBrutto = bruttoMonat * (1 - ausfallAnteil);
  const istNetto = istBrutto * nettofaktor;

  // Nettolohnausfall
  const nettolohnausfall = sollNetto - istNetto;

  // Leistungssatz
  const leistungssatz = hatKind ? 0.67 : 0.60;
  const kug = nettolohnausfall * leistungssatz;

  const gesamtNetto = istNetto + kug;

  return {
    sollNetto: Math.round(sollNetto * 100) / 100,
    istNetto: Math.round(istNetto * 100) / 100,
    nettolohnausfall: Math.round(nettolohnausfall * 100) / 100,
    kug: Math.round(kug * 100) / 100,
    gesamtNetto: Math.round(gesamtNetto * 100) / 100,
    leistungssatz,
    ausfallProzent,
    verlust: Math.round((sollNetto - gesamtNetto) * 100) / 100,
  };
}
