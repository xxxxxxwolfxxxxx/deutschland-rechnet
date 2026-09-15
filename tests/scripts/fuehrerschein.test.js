import { describe, it, expect } from 'vitest';
import {
  berechneFuehrerschein,
  pruefgebuehren,
  anzahlSonderfahrten,
  SONDERFAHRTEN_B,
  GEBUEHREN,
} from '../../public/scripts/fuehrerschein.js';

const basis = {
  grundbetrag: 400,
  uebungsstunden: 20,
  preisUebungsstunde: 65,
  preisSonderfahrt: 80,
  vorstellungTheorie: 50,
  vorstellungPraxis: 180,
  sonstiges: 100,
};

describe('Anlage 4 FahrschAusbO – besondere Ausbildungsfahrten Klasse B', () => {
  it('schreibt 5 Überland-, 4 Autobahn- und 3 Nachtfahrten vor', () => {
    expect(SONDERFAHRTEN_B).toEqual({ ueberland: 5, autobahn: 4, dunkelheit: 3 });
    expect(anzahlSonderfahrten()).toBe(12);
  });

  it('zählt die Sonderfahrten zusätzlich zu den Übungsstunden', () => {
    const r = berechneFuehrerschein(basis);
    expect(r.fahrstundenGesamt).toBe(32);
    expect(r.posten.sonderfahrten).toBe(960);
    expect(r.posten.uebungsstunden).toBe(1300);
  });
});

describe('GebOSt – amtliche Gebühren', () => {
  it('übernimmt die Sätze der Anlage', () => {
    expect(GEBUEHREN).toEqual({ erteilung: 35.7, theorie: 11.1, theorieAmPc: 9.9, praxisB: 109.1 });
  });

  it('rechnet die Umsatzsteuer nur auf die Prüfungen, nicht auf die Erteilung', () => {
    const mit = pruefgebuehren();
    expect(mit.theorie).toBe(24.99); // 21,00 × 1,19
    expect(mit.praxis).toBe(129.83); // 109,10 × 1,19
    expect(mit.erteilung).toBe(35.7);
    const ohne = pruefgebuehren({ mitUmsatzsteuer: false });
    expect(ohne.theorie).toBe(21);
    expect(ohne.praxis).toBe(109.1);
  });

  it('erhebt jede Wiederholung erneut', () => {
    const r = pruefgebuehren({ versuchePraxis: 2 });
    expect(r.praxis).toBe(259.66);
  });
});

describe('berechneFuehrerschein – Gesamtkosten', () => {
  it('summiert Fahrschule, amtliche Gebühren und Sonstiges', () => {
    const r = berechneFuehrerschein(basis);
    // 400 + 1.300 + 960 + 230 = 2.890 Fahrschule
    expect(r.fahrschule).toBe(2890);
    // 24,99 + 129,83 + 35,70
    expect(r.posten.amtlich).toBe(190.52);
    expect(r.gesamt).toBe(3180.52);
  });

  it('verlangt bei einer zweiten praktischen Prüfung auch die Vorstellung erneut', () => {
    const r = berechneFuehrerschein({ ...basis, versuchePraxis: 2 });
    expect(r.gesamt - berechneFuehrerschein(basis).gesamt).toBeCloseTo(180 + 129.83, 2);
  });

  it('behandelt leere Felder als null', () => {
    const r = berechneFuehrerschein({ grundbetrag: '', uebungsstunden: -3 });
    expect(r.fahrschule).toBe(0);
    expect(r.gesamt).toBe(190.52);
  });
});
