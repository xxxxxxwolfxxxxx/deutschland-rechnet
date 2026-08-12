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
