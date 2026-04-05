// Wohngeld-Rechner 2025 nach Wohngeldgesetz (WoGG)
// Reform 2023/2025 – vereinfachtes Modell (Tabellenwerte)
// Formel: W = M - (a + b·M + c·Y) · Y
// Koeffizienten nach WoGG Anlage 1, Mietstufe III (Bundesschnitt)

const KOEFFIZIENTEN = {
  // [a, b, c] je nach Haushaltsgröße
  1: [0.0004, 0.8, 0.0015],
  2: [0.0003, 0.8, 0.0015],
  3: [0.0003, 0.7, 0.0013],
  4: [0.0002, 0.7, 0.0013],
  5: [0.0002, 0.6, 0.0012],
};

// Maximale berücksichtigungsfähige Miete 2025 (€/Monat, Mietstufe III)
const MAX_MIETE = {
  1: 571, 2: 693, 3: 834, 4: 975, 5: 1116,
};
// Einkommensgrenze (bei Überschreitung: kein Wohngeld)
const EINKOMMENSGRENZE = {
  1: 1710, 2: 2340, 3: 2910, 4: 3480, 5: 4060,
};

export function berechneWohngeld({ haushaltGroesse, bruttoMonat, kaltmiete, mietstufe = 3 }) {
  const n = Math.min(5, Math.max(1, haushaltGroesse));
  const mietkorr = mietstufe <= 2 ? 0.90 : mietstufe >= 5 ? 1.20 : mietstufe === 4 ? 1.10 : 1.00;
  const maxMiete = MAX_MIETE[n] * mietkorr;
  const einkommensgrenzeKorr = EINKOMMENSGRENZE[n];

  const M = Math.min(kaltmiete, maxMiete);
  const Y = bruttoMonat * 0.72; // vereinfachtes Jahreseinkommen / 12

  if (Y > einkommensgrenzeKorr) {
    return { wohngeld: 0, Y, M, maxMiete, keinAnspruch: true, grund: 'Einkommen zu hoch' };
  }

  const [a, b, c] = KOEFFIZIENTEN[n];
  const wohngeld = Math.max(0, M - (a + b * M + c * Y) * Y);
  const wohngeldRund = Math.round(wohngeld * 100) / 100;

  return {
    wohngeld: wohngeldRund,
    wohngeldJahr: Math.round(wohngeldRund * 12 * 100) / 100,
    Y: Math.round(Y * 100) / 100,
    M: Math.round(M * 100) / 100,
    maxMiete: Math.round(maxMiete * 100) / 100,
    keinAnspruch: wohngeldRund < 1,
    grund: wohngeldRund < 1 ? 'Kein Anspruch nach Berechnung' : null,
    mietstufe,
  };
}
