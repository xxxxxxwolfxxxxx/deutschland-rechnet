// Mietpreisbremse nach §§ 556d–556g BGB
// Gilt in Gebieten mit angespanntem Wohnungsmarkt (Landesrecht)
// Zulässige Miete = ortsübliche Vergleichsmiete + max. 10 %
//
// Bis September 2026 nahm dieses Modul für den Bestandsschutz
// Math.max(erlaubt, verlangteMiete) – damit war jede beliebige Miete zulässig,
// sobald das Häkchen gesetzt war: die verlangte Miete war ihre eigene
// Obergrenze. § 556e Abs. 1 Satz 1 BGB erlaubt aber nur "eine Miete bis zur
// Höhe der Vormiete". Deshalb braucht der Rechner die Vormiete als Zahl.

/** § 556d Abs. 1 BGB – zulässiger Zuschlag auf die ortsübliche Vergleichsmiete. */
export const ZUSCHLAG = 0.10;

/**
 * § 559 Abs. 3a Satz 1 BGB, über § 556e Abs. 2 Satz 1 anwendbar:
 * höchstens 3 €/m² in sechs Jahren, bei einer Ausgangsmiete unter 7 €/m²
 * höchstens 2 €/m². (Satz 3 kappt Maßnahmen, die zugleich § 555b Nr. 1 oder 1a
 * erfüllen, insoweit auf 0,50 €/m² – das hängt an der Art der Maßnahme und
 * lässt sich aus den Eingaben dieses Rechners nicht ableiten.)
 */
export const MODERNISIERUNG_KAPPUNG = 3;
export const MODERNISIERUNG_KAPPUNG_NIEDRIG = 2;
export const NIEDRIGMIETE_SCHWELLE = 7;

/** § 556g Abs. 2 Satz 3 BGB – Rückforderung nur bei Rüge in diesem Fenster. */
export const RUECKFORDERUNG_MONATE = 30;

/**
 * Zulässige Miete und Überschreitung.
 *
 * @param {object} p
 * @param {number} p.vergleichsmiete    ortsübliche Vergleichsmiete in €/m² kalt
 * @param {number} p.flaeche            Wohnfläche in m²
 * @param {number} p.aktuelleKaltmiete  verlangte Kaltmiete in €/m²
 * @param {number} [p.vormiete]         Vormiete in €/m² (§ 556e Abs. 1). 0 = keine
 *                                      oder unbekannt. Mietminderungen und
 *                                      Erhöhungen im letzten Jahr vor Ende des
 *                                      Vormietverhältnisses bleiben nach Satz 2
 *                                      außer Betracht – das muss der Nutzer
 *                                      selbst herausrechnen.
 * @param {number} [p.modernisierung]   Umlage in €/m²/Monat (§ 556e Abs. 2),
 *                                      nur für Maßnahmen in den letzten drei
 *                                      Jahren vor Mietbeginn.
 */
export function berechneMietpreisbremse({
  vergleichsmiete,
  flaeche,
  aktuelleKaltmiete,
  vormiete = 0,
  modernisierung = 0,
}) {
  const basisProQm = vergleichsmiete * (1 + ZUSCHLAG);

  // Bezugsgröße für die 7-€-Schwelle ist bei einer Neuvermietung die nach
  // § 556d zulässige Miete; eine "Miete vor der Mieterhöhung" gibt es nicht.
  const kappung = basisProQm < NIEDRIGMIETE_SCHWELLE
    ? MODERNISIERUNG_KAPPUNG_NIEDRIG
    : MODERNISIERUNG_KAPPUNG;
  const modernisierungAngesetzt = Math.min(Math.max(0, modernisierung), kappung);
  const modernisierungGekappt = modernisierung > kappung;

  const erlaubtProQm = basisProQm + modernisierungAngesetzt;

  // § 556e Abs. 1 Satz 1: Lag die Vormiete höher, darf sie verlangt werden –
  // sie, nicht mehr.
  const vormieteGreift = vormiete > erlaubtProQm;
  const effektivErlaubtProQm = vormieteGreift ? vormiete : erlaubtProQm;

  const zuviel = Math.max(0, aktuelleKaltmiete - effektivErlaubtProQm);
  const zuvielGesamt = zuviel * flaeche;

  const runde = (n) => Math.round(n * 100) / 100;

  return {
    basisProQm: runde(basisProQm),
    erlaubtProQm: runde(erlaubtProQm),
    erlaubtGesamt: runde(erlaubtProQm * flaeche),
    effektivErlaubtProQm: runde(effektivErlaubtProQm),
    effektivErlaubtGesamt: runde(effektivErlaubtProQm * flaeche),
    aktuelleGesamt: runde(aktuelleKaltmiete * flaeche),
    modernisierungAngesetzt: runde(modernisierungAngesetzt),
    modernisierungKappung: kappung,
    modernisierungGekappt,
    vormieteGreift,
    zuvielProQm: runde(zuviel),
    zuvielGesamt: runde(zuvielGesamt),
    istZuHoch: zuviel > 0,
    jahresErsparnis: runde(zuvielGesamt * 12),
    /** § 556g Abs. 2 Satz 3 BGB: volle Rückforderung nur bei Rüge binnen 30 Monaten. */
    rueckforderungMaximal: runde(zuvielGesamt * RUECKFORDERUNG_MONATE),
  };
}
