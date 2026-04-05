// Mietpreisbremse nach §§ 556d–556g BGB
// Gilt in Gebieten mit angespanntem Wohnungsmarkt (Landesrecht)
// Zulässige Miete = ortsübliche Vergleichsmiete + max. 10%

export function berechneMietpreisbremse({
  vergleichsmiete,      // ortsübliche Vergleichsmiete in €/m² kalt
  flaeche,              // Wohnfläche in m²
  aktuelleKaltmiete,    // aktuell verlangte Kaltmiete in €/m²
  vormieteHoeher = false,  // War Vormiete bereits höher? (Bestandsschutz)
  modernisierung = 0,      // Modernisierungsumlage €/m²/Monat (§ 559 BGB)
}) {
  const erlaubtProQm = vergleichsmiete * 1.10 + modernisierung;
  const erlaubtGesamt = erlaubtProQm * flaeche;

  // Vormiete-Bestandsschutz: zulässig bleibt höchste bisherige Miete
  const effektivErlaubtProQm = vormieteHoeher
    ? Math.max(erlaubtProQm, aktuelleKaltmiete)
    : erlaubtProQm;

  const ueberschreitung = aktuelleKaltmiete - effektivErlaubtProQm;
  const ueberschreitungGesamt = ueberschreitung * flaeche;

  const zuviel = Math.max(0, ueberschreitung);
  const zuvielGesamt = Math.max(0, ueberschreitungGesamt);

  return {
    erlaubtProQm: Math.round(erlaubtProQm * 100) / 100,
    erlaubtGesamt: Math.round(erlaubtGesamt * 100) / 100,
    effektivErlaubtProQm: Math.round(effektivErlaubtProQm * 100) / 100,
    aktuelleGesamt: Math.round(aktuelleKaltmiete * flaeche * 100) / 100,
    zuvielProQm: Math.round(zuviel * 100) / 100,
    zuvielGesamt: Math.round(zuvielGesamt * 100) / 100,
    istZuHoch: zuviel > 0 && !vormieteHoeher,
    jahresErsparnis: Math.round(zuvielGesamt * 12 * 100) / 100,
  };
}
