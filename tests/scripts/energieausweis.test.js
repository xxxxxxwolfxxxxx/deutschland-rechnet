import { describe, it, expect } from 'vitest';
import {
  EMISSIONSFAKTOREN_G_JE_KWH,
  FERNWAERME_RUECKFALL,
  co2FaktorJeKwhEndenergie,
} from '../../public/scripts/energieausweis.js';

describe('Emissionsfaktoren nach Anlage 9 GModG (vormals GEG)', () => {
  it('kennt die Faktoren der fossilen Brennstoffe aus Nummer 3 der Anlage', () => {
    expect(EMISSIONSFAKTOREN_G_JE_KWH.heizoel).toBe(310);
    expect(EMISSIONSFAKTOREN_G_JE_KWH.erdgas).toBe(240);
    expect(EMISSIONSFAKTOREN_G_JE_KWH.fluessiggas).toBe(270);
  });

  it('kennt den netzbezogenen Strom mit 560 g je Kilowattstunde', () => {
    expect(EMISSIONSFAKTOREN_G_JE_KWH.stromNetzbezogen).toBe(560);
  });

  it('kennt die nach Erzeugung getrennten Fernwärme-Faktoren', () => {
    expect(EMISSIONSFAKTOREN_G_JE_KWH.fernwaermeKwkKohle).toBe(300);
    expect(EMISSIONSFAKTOREN_G_JE_KWH.fernwaermeKwkGasOel).toBe(180);
    expect(EMISSIONSFAKTOREN_G_JE_KWH.fernwaermeKwkErneuerbar).toBe(40);
    expect(EMISSIONSFAKTOREN_G_JE_KWH.fernwaermeHeizwerkKohle).toBe(400);
    expect(EMISSIONSFAKTOREN_G_JE_KWH.fernwaermeHeizwerkGasOel).toBe(300);
    expect(EMISSIONSFAKTOREN_G_JE_KWH.fernwaermeHeizwerkErneuerbar).toBe(60);
  });
});

describe('co2FaktorJeKwhEndenergie', () => {
  it('liefert Kilogramm je Kilowattstunde, nicht Gramm', () => {
    expect(co2FaktorJeKwhEndenergie('gas-brennwert')).toBeCloseTo(0.24, 5);
  });

  it('rechnet den Gas-Brennwertkessel mit dem Erdgas-Faktor', () => {
    expect(co2FaktorJeKwhEndenergie('gas-brennwert')).toBeCloseTo(0.24, 5);
  });

  it('rechnet den Öl-Niedertemperaturkessel mit dem Heizöl-Faktor', () => {
    expect(co2FaktorJeKwhEndenergie('oel-niedertemp')).toBeCloseTo(0.31, 5);
  });

  it('rechnet Wärmepumpe und Nachtspeicher mit dem netzbezogenen Strom', () => {
    // Die Endenergie ist bei beiden bereits Strom – die Jahresarbeitszahl
    // steckt im Endenergiebedarf und darf hier nicht ein zweites Mal wirken.
    expect(co2FaktorJeKwhEndenergie('waermepumpe')).toBeCloseTo(0.56, 5);
    expect(co2FaktorJeKwhEndenergie('nachtspeicher')).toBeCloseTo(0.56, 5);
  });

  it('gibt Wärmepumpe und Nachtspeicher denselben Faktor', () => {
    expect(co2FaktorJeKwhEndenergie('waermepumpe')).toBe(
      co2FaktorJeKwhEndenergie('nachtspeicher'),
    );
  });

  it('nutzt für Fernwärme ohne Angabe der Erzeugung den benannten Rückfallwert', () => {
    expect(co2FaktorJeKwhEndenergie('fernwaerme')).toBeCloseTo(
      EMISSIONSFAKTOREN_G_JE_KWH[FERNWAERME_RUECKFALL] / 1000,
      5,
    );
  });

  it('nimmt als Fernwärme-Rückfall die KWK aus gasförmigen und flüssigen Brennstoffen', () => {
    expect(FERNWAERME_RUECKFALL).toBe('fernwaermeKwkGasOel');
    expect(co2FaktorJeKwhEndenergie('fernwaerme')).toBeCloseTo(0.18, 5);
  });

  it('wirft bei unbekannter Heizungsart, statt einen Wert zu erfinden', () => {
    expect(() => co2FaktorJeKwhEndenergie('pelletkessel')).toThrow();
    expect(() => co2FaktorJeKwhEndenergie('')).toThrow();
    expect(() => co2FaktorJeKwhEndenergie(undefined)).toThrow();
  });
});

describe('Abgrenzung zu den BEHG-Faktoren aus heizkosten.js', () => {
  it('liegt für Erdgas über dem brennwertbezogenen BEHG-Faktor', async () => {
    const { emissionsfaktor } = await import('../../public/scripts/heizkosten.js');
    // 0,240 kg/kWh (Anlage 9, heizwertbezogene Endenergie) gegen 0,1814 kg/kWh
    // (EBeV 2030, abgerechnete Brennwert-Kilowattstunde). Verschiedene
    // Bezugsgrößen, verschiedene Zwecke – die Werte dürfen nicht gleich sein.
    expect(co2FaktorJeKwhEndenergie('gas-brennwert')).toBeGreaterThan(
      emissionsfaktor('gas'),
    );
  });

  it('liegt für Heizöl über dem BEHG-Faktor', async () => {
    const { emissionsfaktor } = await import('../../public/scripts/heizkosten.js');
    expect(co2FaktorJeKwhEndenergie('oel-niedertemp')).toBeGreaterThan(
      emissionsfaktor('heizoel'),
    );
  });
});

// Nachtrag 28.09.2026: Primärenergiefaktor nach Anlage 4 GModG (nicht
// erneuerbarer Anteil) und Effizienzklasse nach Anlage 10 zu § 86 GModG.
// Beide Funktionen standen vorher gar nicht als Modul zur Verfügung, nur
// inline im <script> der Rechnerseite - mit einem flachen Faktor 1,4 für
// alle Energieträger (statt 1,1 Gas/Öl, 1,8 Strom) und ohne die Klasse H.
describe('primaerenergiefaktor nach Anlage 4 GModG', () => {
  it('rechnet fossile Brennstoffe mit 1,1', async () => {
    const { primaerenergiefaktor } = await import('../../public/scripts/energieausweis.js');
    expect(primaerenergiefaktor('gas-brennwert')).toBeCloseTo(1.1, 5);
    expect(primaerenergiefaktor('oel-niedertemp')).toBeCloseTo(1.1, 5);
  });

  it('rechnet netzbezogenen Strom mit 1,8', async () => {
    const { primaerenergiefaktor } = await import('../../public/scripts/energieausweis.js');
    expect(primaerenergiefaktor('waermepumpe')).toBeCloseTo(1.8, 5);
    expect(primaerenergiefaktor('nachtspeicher')).toBeCloseTo(1.8, 5);
  });

  it('wirft bei unbekannter Heizungsart', async () => {
    const { primaerenergiefaktor } = await import('../../public/scripts/energieausweis.js');
    expect(() => primaerenergiefaktor('holzpellets')).toThrow();
  });
});

describe('effizienzklasse nach Anlage 10 zu § 86 GModG', () => {
  it('kennt alle neun Klassen A+ bis H', async () => {
    const { effizienzklasse, ANLAGE10_GRENZEN } = await import('../../public/scripts/energieausweis.js');
    expect(ANLAGE10_GRENZEN).toEqual([30, 50, 75, 100, 130, 160, 200, 250]);
    expect(effizienzklasse(30)).toBe('A+');
    expect(effizienzklasse(50)).toBe('A');
    expect(effizienzklasse(75)).toBe('B');
    expect(effizienzklasse(100)).toBe('C');
    expect(effizienzklasse(130)).toBe('D');
    expect(effizienzklasse(160)).toBe('E');
    expect(effizienzklasse(200)).toBe('F');
    expect(effizienzklasse(250)).toBe('G');
  });

  it('vergibt oberhalb von 250 die Klasse H, nicht G', async () => {
    const { effizienzklasse } = await import('../../public/scripts/energieausweis.js');
    expect(effizienzklasse(251)).toBe('H');
    expect(effizienzklasse(450)).toBe('H');
  });

  it('trifft die Grenzen exakt (Grenzwert selbst gehört zur besseren Klasse)', async () => {
    const { effizienzklasse } = await import('../../public/scripts/energieausweis.js');
    expect(effizienzklasse(29.9)).toBe('A+');
    expect(effizienzklasse(30.1)).toBe('A');
  });
});
