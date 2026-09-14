import { describe, it, expect } from 'vitest';
import { gebuehrGKG, gebuehrFamGKG, anwaltsverguetungAusSaetzen } from '../../public/scripts/gebuehrentabellen.js';
import { berechneProzesskosten, vergleicheMitBeitrag } from '../../public/scripts/prozesskosten.js';

describe('gebuehrGKG – § 34 Abs. 1 GKG', () => {
  // § 34 GKG und § 28 FamGKG nennen dieselbe Staffel; die Stützwerte der
  // FamGKG-Tabelle prüft scheidungskosten.test.js vollständig.
  it.each([500, 2000, 3000, 13000, 50000, 200000, 500000, 750000])('gleich der FamGKG-Staffel bei %i €', (wert) => {
    expect(gebuehrGKG(wert)).toBe(gebuehrFamGKG(wert));
  });

  it('Stützwerte', () => {
    expect(gebuehrGKG(5000)).toBe(170.5);
    expect(gebuehrGKG(10000)).toBe(283);
  });
});

describe('anwaltsverguetungAusSaetzen', () => {
  it('1,3 + 1,2 bei 5.000 €', () => {
    const v = anwaltsverguetungAusSaetzen(5000, [1.3, 1.2]);

    expect(v.gebuehren).toBe(886.25);
    expect(v.pauschale).toBe(20);
    expect(v.netto).toBe(906.25);
    expect(v.umsatzsteuer).toBe(172.19);
    expect(v.brutto).toBe(1078.44);
  });
});

describe('berechneProzesskosten – 5.000 € Streitwert', () => {
  const r = berechneProzesskosten(5000);

  it('verloren: 3,0 Gerichtsgebühren und beide Anwälte (§ 91 ZPO)', () => {
    expect(r.verloren.gericht).toBe(511.5);
    expect(r.verloren.eigenerAnwalt).toBe(1078.44);
    expect(r.verloren.gegnerAnwalt).toBe(1078.44);
    expect(r.verloren.gesamt).toBe(2668.38);
  });

  it('Vergleich: halbe ermäßigte Gerichtsgebühr und eigener Anwalt mit Einigungsgebühr (§§ 98, 92 ZPO)', () => {
    expect(r.vergleich.gericht).toBe(85.25);
    expect(r.vergleich.eigenerAnwalt).toBe(1500.29);
    expect(r.vergleich.gegnerAnwalt).toBe(0);
    expect(r.vergleich.gesamt).toBe(1585.54);
  });

  it('gewonnen: der Gegner erstattet', () => {
    expect(r.gewonnen.gesamt).toBe(0);
  });

  it('das Risiko wächst langsamer als der Streitwert', () => {
    const klein = berechneProzesskosten(5000).verloren.gesamt / 5000;
    const gross = berechneProzesskosten(50000).verloren.gesamt / 50000;
    expect(gross).toBeLessThan(klein);
  });
});

describe('vergleicheMitBeitrag', () => {
  it('rechnet Erstattung, Beiträge und Jahresbeiträge je Fall', () => {
    const v = vergleicheMitBeitrag({ kosten: 2668.38, beitragJahr: 300, selbstbeteiligung: 150, jahre: 5 });

    expect(v.erstattung).toBe(2518.38);
    expect(v.beitraege).toBe(1500);
    expect(v.saldo).toBe(1018.38);
    expect(v.jahresbeitraegeJeFall).toBe(8.4);
  });

  it('ohne Beitrag keine Quote', () => {
    expect(vergleicheMitBeitrag({ kosten: 1000, beitragJahr: 0 }).jahresbeitraegeJeFall).toBeNull();
  });
});
