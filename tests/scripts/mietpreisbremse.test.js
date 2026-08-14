import { describe, it, expect } from 'vitest';
import { berechneMietpreisbremse } from '../../public/scripts/mietpreisbremse.js';

// Rechtsgrundlage sind §§ 556d bis 556g BGB. Bei Wiedervermietung in einem
// Gebiet mit angespanntem Wohnungsmarkt darf die Miete die ortsübliche
// Vergleichsmiete um höchstens 10 Prozent übersteigen (§ 556d Abs. 1 BGB).
// § 556e Abs. 1 BGB lässt eine höhere Vormiete weiterhin zu, § 556e Abs. 2
// BGB die Umlage einer Modernisierung.

describe('berechneMietpreisbremse – zulässige Miete', () => {
  it('erlaubt die Vergleichsmiete plus 10 Prozent (§ 556d Abs. 1 BGB)', () => {
    const r = berechneMietpreisbremse({ vergleichsmiete: 10, flaeche: 60, aktuelleKaltmiete: 12 });

    expect(r.erlaubtProQm).toBe(11);
    expect(r.erlaubtGesamt).toBe(660);
  });

  it('rechnet die zulässige Miete auf die Wohnfläche hoch', () => {
    const r = berechneMietpreisbremse({ vergleichsmiete: 8.5, flaeche: 72, aktuelleKaltmiete: 9 });

    expect(r.erlaubtProQm).toBe(9.35);
    expect(r.erlaubtGesamt).toBe(673.2);
  });
});

describe('berechneMietpreisbremse – Überschreitung', () => {
  it('weist die Überschreitung je Quadratmeter und insgesamt aus', () => {
    const r = berechneMietpreisbremse({ vergleichsmiete: 10, flaeche: 60, aktuelleKaltmiete: 12 });

    expect(r.zuvielProQm).toBe(1);
    expect(r.zuvielGesamt).toBe(60);
    expect(r.istZuHoch).toBe(true);
  });

  it('rechnet die Überschreitung auf ein Jahr hoch', () => {
    const r = berechneMietpreisbremse({ vergleichsmiete: 10, flaeche: 60, aktuelleKaltmiete: 12 });

    expect(r.jahresErsparnis).toBe(720);
  });

  it('meldet keine Überschreitung, wenn die Miete innerhalb der Grenze liegt', () => {
    const r = berechneMietpreisbremse({ vergleichsmiete: 10, flaeche: 60, aktuelleKaltmiete: 10.5 });

    expect(r.zuvielProQm).toBe(0);
    expect(r.zuvielGesamt).toBe(0);
    expect(r.istZuHoch).toBe(false);
    expect(r.jahresErsparnis).toBe(0);
  });

  it('meldet keine Überschreitung genau an der 10-Prozent-Grenze', () => {
    const r = berechneMietpreisbremse({ vergleichsmiete: 10, flaeche: 60, aktuelleKaltmiete: 11 });

    expect(r.istZuHoch).toBe(false);
    expect(r.zuvielProQm).toBe(0);
  });

  it('weist die aktuell verlangte Gesamtmiete aus', () => {
    const r = berechneMietpreisbremse({ vergleichsmiete: 10, flaeche: 60, aktuelleKaltmiete: 12 });

    expect(r.aktuelleGesamt).toBe(720);
  });
});

describe('berechneMietpreisbremse – Ausnahmen', () => {
  it('höhere Vormiete bleibt zulässig (§ 556e Abs. 1 BGB)', () => {
    const r = berechneMietpreisbremse({
      vergleichsmiete: 10,
      flaeche: 60,
      aktuelleKaltmiete: 12,
      vormieteHoeher: true,
    });

    expect(r.effektivErlaubtProQm).toBe(12);
    expect(r.zuvielProQm).toBe(0);
    expect(r.istZuHoch).toBe(false);
  });

  it('die 10-Prozent-Grenze bleibt bei höherer Vormiete nachrichtlich erhalten', () => {
    const r = berechneMietpreisbremse({
      vergleichsmiete: 10,
      flaeche: 60,
      aktuelleKaltmiete: 12,
      vormieteHoeher: true,
    });

    expect(r.erlaubtProQm).toBe(11);
  });

  it('Modernisierungsumlage erhöht die zulässige Miete (§ 556e Abs. 2 BGB)', () => {
    const r = berechneMietpreisbremse({
      vergleichsmiete: 10,
      flaeche: 60,
      aktuelleKaltmiete: 12,
      modernisierung: 2,
    });

    expect(r.erlaubtProQm).toBe(13);
    expect(r.istZuHoch).toBe(false);
  });

  it('ohne Angaben zu Vormiete und Modernisierung gelten die Standardwerte', () => {
    const mitDefaults = berechneMietpreisbremse({ vergleichsmiete: 9, flaeche: 50, aktuelleKaltmiete: 11 });
    const explizit = berechneMietpreisbremse({
      vergleichsmiete: 9,
      flaeche: 50,
      aktuelleKaltmiete: 11,
      vormieteHoeher: false,
      modernisierung: 0,
    });

    expect(mitDefaults).toEqual(explizit);
  });
});
