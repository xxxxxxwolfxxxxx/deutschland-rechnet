// Steuerliche Entfernungspauschale (Pendlerpauschale) § 9 EStG
// Ab 2022: 0,30 € für die ersten 20 km, 0,38 € ab dem 21. km
// Arbeitstage pro Jahr: ca. 220 (nach Abzug Urlaub/Feiertage)

export function berechnefahrtkosten({ entfernungKm, arbeitstageProJahr = 220, hinUndRueck = false }) {
  // Steuerliche Pendlerpauschale gilt nur für Hinfahrt (Entfernungskilometer)
  const km = entfernungKm;
  const erste20 = Math.min(km, 20) * 0.30;
  const ab21 = Math.max(0, km - 20) * 0.38;
  const pauschaleTaeglichEinfach = Math.round((erste20 + ab21) * 100) / 100;
  const jahresabzug = Math.round(pauschaleTaeglichEinfach * arbeitstageProJahr * 100) / 100;

  // Tatsächliche Kosten (Hin- und Rückfahrt)
  const tatsaechlichKmProTag = hinUndRueck ? km * 2 : km;
  return {
    pauschaleTaeglich: pauschaleTaeglichEinfach,
    jahresabzug,
    arbeitstageProJahr,
  };
}
