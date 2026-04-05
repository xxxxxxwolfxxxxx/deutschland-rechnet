// Wohngeld-Rechner 2025 nach Wohngeldgesetz (WoGG)
// Formel nach § 19 WoGG: W = M - (a + b·M + c·Y) · Y
// Koeffizienten nach WoGG 2023 Anlage 1, Mietstufe III

// Koeffizienten a, b, c je nach Haushaltsgröße (Mietstufe III)
const KOEFFIZIENTEN = {
  1: [0.000006, 0.0000699, 0.0001051],
  2: [0.000005, 0.0000603, 0.0000907],
  3: [0.000005, 0.0000522, 0.0000785],
  4: [0.000004, 0.0000455, 0.0000684],
  5: [0.000004, 0.0000400, 0.0000600],
};

// Maximale berücksichtigungsfähige Miete 2025 (€/Monat, Mietstufe III)
const MAX_MIETE = {
  1: 571, 2: 693, 3: 834, 4: 975, 5: 1116,
};

// Mietstufen-Korrekturfaktoren
const MIETSTUFEN_FAKTOR = { 1: 0.82, 2: 0.91, 3: 1.00, 4: 1.09, 5: 1.18, 6: 1.27 };

export function berechneWohngeld({ haushaltGroesse, bruttoMonat, kaltmiete, mietstufe = 3 }) {
  const n = Math.min(5, Math.max(1, haushaltGroesse));
  const mFaktor = MIETSTUFEN_FAKTOR[mietstufe] ?? 1.00;
  const maxMiete = MAX_MIETE[n] * mFaktor;

  // Monatliches Haushaltseinkommen nach WoGG (pauschal ~26% Abzug)
  const Y = bruttoMonat * 0.74;

  const M = Math.min(kaltmiete, maxMiete);
  const [a, b, c] = KOEFFIZIENTEN[n];
  const wohngeld = Math.max(0, M - (a + b * M + c * Y) * Y);
  const wohngeldRund = Math.round(wohngeld * 100) / 100;

  return {
    wohngeld: wohngeldRund,
    wohngeldJahr: Math.round(wohngeldRund * 12 * 100) / 100,
    nettoMonat: Math.round(Y * 100) / 100,
    M: Math.round(M * 100) / 100,
    maxMiete: Math.round(maxMiete * 100) / 100,
    keinAnspruch: wohngeldRund < 1,
    grund: wohngeldRund < 1 ? 'Kein Anspruch nach Berechnung' : null,
    mietstufe,
  };
}
