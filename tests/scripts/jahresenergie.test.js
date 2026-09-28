import { describe, it, expect } from 'vitest';
import {
  berechneJahresenergie,
  effizienzklasse,
  nutzflaecheAusWohnflaeche,
  EFFIZIENZKLASSEN,
  HEIZENERGIETRAEGER,
  HEIZWERT_HEIZOEL_EL_KWH_JE_LITER,
  HEIZWERT_ERDGAS_H_KWH_JE_M3,
  HEIZWERT_ERDGAS_L_KWH_JE_M3,
  ZUSCHLAG_DEZENTRALES_WARMWASSER,
} from '../../public/scripts/jahresenergie.js';

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

describe('§ 9 Abs. 3 HeizkostenV – Heizwerte Hi', () => {
  it('kennt Heizöl EL, Erdgas H und Erdgas L', () => {
    expect(HEIZWERT_HEIZOEL_EL_KWH_JE_LITER).toBe(10);
    expect(HEIZWERT_ERDGAS_H_KWH_JE_M3).toBe(10);
    expect(HEIZWERT_ERDGAS_L_KWH_JE_M3).toBe(9);
  });

  it('rechnet Heizöl für den Kennwert mit dem Heizwert der HeizkostenV um', () => {
    expect(HEIZENERGIETRAEGER.heizoel.kwhJeEinheit()).toBe(HEIZWERT_HEIZOEL_EL_KWH_JE_LITER);
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

  it('kennzeichnet den Gas-Kennwert als brennwertbezogen, Heizöl nicht', () => {
    const gas = berechneJahresenergie({ strom: {}, heizung: { traeger: 'gas', menge: 12000 }, wohnflaeche: 100 });
    const oel = berechneJahresenergie({ strom: {}, heizung: { traeger: 'heizoel', menge: 1200 }, wohnflaeche: 100 });
    expect(gas.kennwert.brennwertbezogen).toBe(true);
    expect(oel.kennwert.brennwertbezogen).toBe(false);
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

  it('rechnet Heizöl aus Litern mit 10 kWh je Liter in Kilowattstunden um', () => {
    const r = berechneJahresenergie({ strom: {}, heizung: { traeger: 'heizoel', menge: 2000, preisCentJeEinheit: 105 }, wohnflaeche: 150 });
    expect(r.heizung.kwh).toBe(20000); // 2.000 l × 10 kWh/l
    expect(r.heizung.kosten).toBe(2100);
    expect(r.heizung.einheit).toBe('Liter');
    expect(r.kennwert.kwhJeQm).toBe(111); // 20.000 ÷ 180
  });

  it('lässt Wasser und Kennwert ohne Angaben weg', () => {
    const r = berechneJahresenergie({ strom: { kwh: 2000, preisCent: 37 }, heizung: { traeger: 'gas', menge: 0 } });
    expect(r.wasser).toBeNull();
    expect(r.kennwert).toBeNull();
    expect(r.gesamt).toBe(740);
  });
});
