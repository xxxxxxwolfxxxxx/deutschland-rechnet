import { describe, it, expect } from 'vitest';
import {
  EMISSIONSFAKTOREN_G_JE_KWH,
  FERNWAERME_RUECKFALL,
  HEIZWERT_HEIZOEL_EL_KWH_JE_LITER,
  ABRECHNUNGSJAHRE,
  VERBRAUCH_TRAEGER,
  co2FaktorJeKwhEndenergie,
  verbrauchskennwert,
  ausweisPflicht,
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
    expect(co2FaktorJeKwhEndenergie('gas')).toBeCloseTo(0.24, 5);
  });

  it('rechnet Heizöl mit dem Heizöl-Faktor', () => {
    expect(co2FaktorJeKwhEndenergie('heizoel')).toBeCloseTo(0.31, 5);
  });

  it('rechnet Strom für Wärmepumpe und Nachtspeicher mit dem netzbezogenen Faktor', () => {
    // Die Endenergie ist bereits Strom – die Jahresarbeitszahl steckt im
    // Verbrauch und darf hier nicht ein zweites Mal wirken.
    expect(co2FaktorJeKwhEndenergie('strom')).toBeCloseTo(0.56, 5);
  });

  it('nimmt als Fernwärme-Rückfall die KWK aus gasförmigen und flüssigen Brennstoffen', () => {
    expect(FERNWAERME_RUECKFALL).toBe('fernwaermeKwkGasOel');
    expect(co2FaktorJeKwhEndenergie('fernwaerme')).toBeCloseTo(0.18, 5);
  });

  it('wirft bei unbekanntem Energieträger, statt einen Wert zu erfinden', () => {
    expect(() => co2FaktorJeKwhEndenergie('pellets')).toThrow();
    expect(() => co2FaktorJeKwhEndenergie('')).toThrow();
    expect(() => co2FaktorJeKwhEndenergie(undefined)).toThrow();
  });
});

describe('Abgrenzung zu den BEHG-Faktoren aus heizkosten.js', () => {
  it('liegt für Erdgas über dem brennwertbezogenen BEHG-Faktor', async () => {
    const { emissionsfaktor } = await import('../../public/scripts/heizkosten.js');
    // 0,240 kg/kWh (Anlage 9) gegen 0,1814 kg/kWh (EBeV 2030, abgerechnete
    // Brennwert-Kilowattstunde). Verschiedene Bezugsgrößen und Zwecke.
    expect(co2FaktorJeKwhEndenergie('gas')).toBeGreaterThan(emissionsfaktor('gas'));
  });

  it('liegt für Heizöl über dem BEHG-Faktor', async () => {
    const { emissionsfaktor } = await import('../../public/scripts/heizkosten.js');
    expect(co2FaktorJeKwhEndenergie('heizoel')).toBeGreaterThan(emissionsfaktor('heizoel'));
  });
});

describe('Energieträger des Verbrauchsausweises', () => {
  it('rechnet Heizöl EL mit dem Heizwert aus § 9 Abs. 3 HeizkostenV', () => {
    expect(HEIZWERT_HEIZOEL_EL_KWH_JE_LITER).toBe(10);
    expect(VERBRAUCH_TRAEGER.heizoel.einheit).toBe('Liter');
    expect(VERBRAUCH_TRAEGER.heizoel.kwhJeEinheit).toBe(10);
  });

  it('kennzeichnet nur Erdgas als brennwertbezogen abgerechnet', () => {
    const brennwert = Object.entries(VERBRAUCH_TRAEGER)
      .filter(([, t]) => t.brennwertbezogen)
      .map(([k]) => k);
    expect(brennwert).toEqual(['gas']);
  });

  it('hat für jeden Energieträger einen Emissionsfaktor', () => {
    for (const traeger of Object.keys(VERBRAUCH_TRAEGER)) {
      expect(co2FaktorJeKwhEndenergie(traeger)).toBeGreaterThan(0);
    }
  });
});

describe('verbrauchskennwert – § 82 Abs. 2 und 4 GModG', () => {
  const basis = { traeger: 'gas', jahresmengen: [14000, 13000, 12000], wohnflaeche: 100 };

  it('mittelt drei Abrechnungsjahre (Bekanntmachung vom 29.03.2021, Nr. 2)', () => {
    expect(ABRECHNUNGSJAHRE).toBe(3);
    const r = verbrauchskennwert(basis);
    expect(r.jahre).toBe(3);
    expect(r.vollstaendig).toBe(true);
    expect(r.mittelKwh).toBe(13000);
    expect(r.nutzflaeche).toBe(120);
    expect(r.flaecheGeschaetzt).toBe(true);
    expect(r.kwhJeQm).toBe(108); // 13.000 ÷ 120 = 108,3
    expect(r.klasse).toBe('D');
  });

  it('setzt bei höchstens zwei Wohneinheiten mit beheiztem Keller das 1,35-Fache an', () => {
    const r = verbrauchskennwert({ ...basis, mitBeheiztemKeller: true });
    expect(r.nutzflaeche).toBe(135);
    expect(r.kwhJeQm).toBe(96); // 13.000 ÷ 135 = 96,3
    expect(r.klasse).toBe('C');
  });

  it('nimmt eine bekannte Gebäudenutzfläche statt der Pauschale', () => {
    const r = verbrauchskennwert({ ...basis, gebaeudenutzflaeche: 130, mitBeheiztemKeller: true });
    expect(r.nutzflaeche).toBe(130);
    expect(r.flaecheGeschaetzt).toBe(false);
    expect(r.kwhJeQm).toBe(100);
    expect(r.klasse).toBe('C');
  });

  it('schlägt bei dezentralem Warmwasser 20 kWh/m² auf, beim CO₂ aber nicht', () => {
    const zentral = verbrauchskennwert({ ...basis, gebaeudenutzflaeche: 130 });
    const dezentral = verbrauchskennwert({ ...basis, gebaeudenutzflaeche: 130, dezentralesWarmwasser: true });
    expect(dezentral.kwhJeQm).toBe(zentral.kwhJeQm + 20);
    expect(dezentral.klasse).toBe('D');
    expect(dezentral.co2KgJeQm).toBe(zentral.co2KgJeQm);
  });

  it('rechnet CO₂ nach Anlage 9 aus dem Heizverbrauch je m²', () => {
    const r = verbrauchskennwert({ ...basis, gebaeudenutzflaeche: 130 });
    expect(r.co2KgJeQm).toBe(24); // 100 kWh/m² × 0,24 kg/kWh
  });

  it('rechnet Heizöl aus Litern mit 10 kWh je Liter um', () => {
    const r = verbrauchskennwert({ traeger: 'heizoel', jahresmengen: [2600, 2400, 2500], gebaeudenutzflaeche: 200 });
    expect(r.mittelKwh).toBe(25000);
    expect(r.kwhJeQm).toBe(125);
    expect(r.klasse).toBe('D');
    expect(r.brennwertbezogen).toBe(false);
  });

  it('meldet, wenn weniger als drei Jahre eingetragen sind', () => {
    const r = verbrauchskennwert({ ...basis, jahresmengen: [13000, '', 0] });
    expect(r.jahre).toBe(1);
    expect(r.vollstaendig).toBe(false);
    expect(r.mittelKwh).toBe(13000);
  });

  it('ordnet über 250 kWh/m² in Klasse H ein', () => {
    const r = verbrauchskennwert({ traeger: 'gas', jahresmengen: [30200], gebaeudenutzflaeche: 120 });
    expect(r.kwhJeQm).toBe(252);
    expect(r.klasse).toBe('H');
  });

  it('liefert null ohne Verbrauch oder ohne Fläche', () => {
    expect(verbrauchskennwert({ traeger: 'gas', jahresmengen: [], wohnflaeche: 100 })).toBeNull();
    expect(verbrauchskennwert({ traeger: 'gas', jahresmengen: [12000] })).toBeNull();
  });

  it('wirft bei unbekanntem Energieträger', () => {
    expect(() => verbrauchskennwert({ ...basis, traeger: 'pellets' })).toThrow();
  });
});

describe('ausweisPflicht – § 80 Abs. 3 Satz 2 und 3 GModG', () => {
  it('verlangt den Bedarfsausweis bei unter fünf Wohnungen und Bauantrag vor dem 1.11.1977', () => {
    expect(ausweisPflicht({ wohnungen: 1, bauantragVor1977: true, waermeschutz1977: 'nein' }).art).toBe('bedarf');
    expect(ausweisPflicht({ wohnungen: 4, bauantragVor1977: true, waermeschutz1977: 'nein' }).art).toBe('bedarf');
  });

  it('bleibt beim Bedarfsausweis, solange das Niveau der WSchVO 1977 nicht belegt ist', () => {
    expect(ausweisPflicht({ wohnungen: 2, bauantragVor1977: true, waermeschutz1977: 'unbekannt' }).art).toBe('bedarf');
  });

  it('lässt beide Ausweisarten zu, wenn das Gebäude das Niveau der WSchVO 1977 erreicht (Satz 3)', () => {
    expect(ausweisPflicht({ wohnungen: 2, bauantragVor1977: true, waermeschutz1977: 'ja' }).art).toBe('wahl');
  });

  it('lässt beide Ausweisarten zu ab fünf Wohnungen oder bei späterem Bauantrag', () => {
    expect(ausweisPflicht({ wohnungen: 5, bauantragVor1977: true, waermeschutz1977: 'nein' }).art).toBe('wahl');
    expect(ausweisPflicht({ wohnungen: 1, bauantragVor1977: false, waermeschutz1977: 'nein' }).art).toBe('wahl');
  });

  it('begründet jedes Ergebnis mit der Norm', () => {
    expect(ausweisPflicht({ wohnungen: 1, bauantragVor1977: true, waermeschutz1977: 'nein' }).grund).toMatch(/§ 80 Abs\. 3 Satz 2/);
    expect(ausweisPflicht({ wohnungen: 1, bauantragVor1977: true, waermeschutz1977: 'ja' }).grund).toMatch(/Satz 3/);
  });

  it('liefert null ohne gültige Wohnungszahl', () => {
    expect(ausweisPflicht({ wohnungen: 0, bauantragVor1977: true, waermeschutz1977: 'nein' })).toBeNull();
    expect(ausweisPflicht({ wohnungen: 1.5, bauantragVor1977: true, waermeschutz1977: 'nein' })).toBeNull();
  });
});
