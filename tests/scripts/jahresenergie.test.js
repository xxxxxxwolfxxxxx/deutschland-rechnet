import { describe, it, expect } from 'vitest';
import {
  berechneJahresenergie,
  effizienzklasse,
  nutzflaecheAusWohnflaeche,
  EFFIZIENZKLASSEN,
  ZUSCHLAG_DEZENTRALES_WARMWASSER,
} from '../../public/scripts/jahresenergie.js';
import { kwhJeLiterHeizoel } from '../../public/scripts/heizkosten.js';

describe('Anlage 10 GModG – Effizienzklassen', () => {
  it('führt neun Klassen bis H', () => {
    expect(EFFIZIENZKLASSEN.map((k) => k.klasse)).toEqual(['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  });

  it('ordnet an den Grenzen nach „kleiner oder gleich“ ein', () => {
    expect(effizienzklasse(30)).toBe('A+');
    expect(effizienzklasse(31)).toBe('A');
    expect(effizienzklasse(100)).toBe('C');
    expect(effizienzklasse(250)).toBe('G');
    expect(effizienzklasse(251)).toBe('H');
  });
});

describe('§ 82 Abs. 2 GModG – Nutzfläche und Warmwasserzuschlag', () => {
  it('setzt die Nutzfläche mit dem 1,2- oder 1,35-Fachen der Wohnfläche an', () => {
    expect(nutzflaecheAusWohnflaeche(100)).toBe(120);
    expect(nutzflaecheAusWohnflaeche(100, true)).toBe(135);
  });

  it('schlägt bei dezentralem Warmwasser 20 kWh/m² auf', () => {
    const basis = { strom: { kwh: 0 }, heizung: { traeger: 'gas', menge: 12000, preisCentJeEinheit: 11 }, wohnflaeche: 100 };
    const zentral = berechneJahresenergie(basis);
    const dezentral = berechneJahresenergie({ ...basis, dezentralesWarmwasser: true });
    expect(zentral.kennwert.kwhJeQm).toBe(100); // 12.000 ÷ 120
    expect(dezentral.kennwert.kwhJeQm).toBe(100 + ZUSCHLAG_DEZENTRALES_WARMWASSER);
    expect(zentral.kennwert.klasse).toBe('C');
    expect(dezentral.kennwert.klasse).toBe('D');
  });
});

describe('berechneJahresenergie – Kosten aus der Abrechnung', () => {
  it('rechnet Strom, Heizung und Wasser mit Grundpreisen', () => {
    const r = berechneJahresenergie({
      strom: { kwh: 3500, preisCent: 37, grundpreisJahr: 150 },
      heizung: { traeger: 'gas', menge: 15000, preisCentJeEinheit: 11, grundpreisJahr: 180 },
      wasser: { m3: 90, preisJeM3: 4.5, grundpreisJahr: 60 },
      wohnflaeche: 110,
    });
    expect(r.strom.kosten).toBe(1445);
    expect(r.heizung.kosten).toBe(1830);
    expect(r.wasser.kosten).toBe(465);
    expect(r.gesamt).toBe(3740);
    expect(r.monat).toBe(311.67);
  });

  it('rechnet Heizöl aus Litern in Kilowattstunden um', () => {
    const r = berechneJahresenergie({ strom: {}, heizung: { traeger: 'heizoel', menge: 2000, preisCentJeEinheit: 105 }, wohnflaeche: 150 });
    expect(r.heizung.kwh).toBe(Math.round(2000 * kwhJeLiterHeizoel()));
    expect(r.heizung.kwh).toBe(20092); // 2.000 l × 10,046 kWh/l
    expect(r.heizung.kosten).toBe(2100);
    expect(r.heizung.einheit).toBe('Liter');
  });

  it('lässt Wasser und Kennwert ohne Angaben weg', () => {
    const r = berechneJahresenergie({ strom: { kwh: 2000, preisCent: 37 }, heizung: { traeger: 'gas', menge: 0 } });
    expect(r.wasser).toBeNull();
    expect(r.kennwert).toBeNull();
    expect(r.gesamt).toBe(740);
  });
});
