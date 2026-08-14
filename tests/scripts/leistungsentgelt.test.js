import { describe, it, expect } from 'vitest';
import {
  SOZIALVERSICHERUNGSPAUSCHALE,
  TAGE_JE_MONAT,
  TAGE_JE_JAHR,
  leistungsentgeltJahr,
  leistungsentgeltMonat,
  leistungsentgeltTag,
} from '../../public/scripts/leistungsentgelt.js';
import { jahreslohnsteuer, solidaritaetszuschlagJahr } from '../../public/scripts/lohnsteuer.js';
import {
  PFLEGE_ARBEITNEHMER_GRUNDSATZ,
  pflegeArbeitnehmerSatz,
} from '../../public/scripts/sozialversicherung.js';

// Rechtsgrundlage ist § 153 SGB III, für die Umlegung auf Kalendertage
// § 154 SGB III. Das Modul ist die gemeinsame Grundlage von
// Arbeitslosengeld (§ 149 SGB III) und Kurzarbeitergeld (§ 106 SGB III).

describe('Rechengrößen', () => {
  it('Sozialversicherungspauschale 20 % (§ 153 Abs. 1 Satz 2 Nr. 1 SGB III)', () => {
    expect(SOZIALVERSICHERUNGSPAUSCHALE).toBe(0.2);
  });

  it('ein voller Kalendermonat zählt 30 Tage (§ 154 Satz 2 SGB III)', () => {
    expect(TAGE_JE_MONAT).toBe(30);
    expect(TAGE_JE_JAHR).toBe(365);
  });
});

describe('leistungsentgeltJahr (§ 153 Abs. 1 SGB III)', () => {
  it('zieht Pauschale, Lohnsteuer und Soli vom Bemessungsentgelt ab', () => {
    const bemessungsentgeltJahr = 48000;
    const steuerklasse = 1;

    const lohnsteuer = jahreslohnsteuer({
      jahresarbeitslohn: bemessungsentgeltJahr,
      steuerklasse,
      pflegesatz: PFLEGE_ARBEITNEHMER_GRUNDSATZ,
    });
    const soli = solidaritaetszuschlagJahr(lohnsteuer, steuerklasse);
    const erwartet = bemessungsentgeltJahr - bemessungsentgeltJahr * 0.2 - lohnsteuer - soli;

    expect(leistungsentgeltJahr({ bemessungsentgeltJahr, steuerklasse })).toBeCloseTo(erwartet, 6);
  });

  it('die Pauschale kennt keine Beitragsbemessungsgrenze', () => {
    // 200.000 Euro liegen weit über allen Beitragsbemessungsgrenzen. Die
    // Pauschale des § 153 Abs. 1 Satz 2 Nr. 1 SGB III bleibt trotzdem volle
    // 20 Prozent des Bemessungsentgelts.
    const bemessungsentgeltJahr = 200000;
    const steuerklasse = 1;

    const lohnsteuer = jahreslohnsteuer({
      jahresarbeitslohn: bemessungsentgeltJahr,
      steuerklasse,
      pflegesatz: PFLEGE_ARBEITNEHMER_GRUNDSATZ,
    });
    const soli = solidaritaetszuschlagJahr(lohnsteuer, steuerklasse);

    expect(leistungsentgeltJahr({ bemessungsentgeltJahr, steuerklasse })).toBeCloseTo(
      bemessungsentgeltJahr * 0.8 - lohnsteuer - soli,
      6,
    );
  });

  it('rechnet mit dem Pflege-Grundbeitragssatz, nicht mit dem Zuschlag für Kinderlose', () => {
    // § 153 Abs. 1 Satz 4 Nr. 3 SGB III verweist auf § 55 Abs. 1 Satz 1
    // SGB XI, also auf den Satz ohne den Zuschlag des § 55 Abs. 3 SGB XI.
    const bemessungsentgeltJahr = 48000;
    const steuerklasse = 1;
    const kinderlosenSatz = pflegeArbeitnehmerSatz({ kinder: 0 });

    expect(kinderlosenSatz).toBeGreaterThan(PFLEGE_ARBEITNEHMER_GRUNDSATZ);

    const mitZuschlag = jahreslohnsteuer({
      jahresarbeitslohn: bemessungsentgeltJahr,
      steuerklasse,
      pflegesatz: kinderlosenSatz,
    });
    const erwartetMitZuschlag =
      bemessungsentgeltJahr * 0.8 - mitZuschlag - solidaritaetszuschlagJahr(mitZuschlag, steuerklasse);

    expect(leistungsentgeltJahr({ bemessungsentgeltJahr, steuerklasse })).not.toBeCloseTo(
      erwartetMitZuschlag,
      2,
    );
  });

  it('Steuerklasse 5 ergibt ein niedrigeres Leistungsentgelt als Steuerklasse 3', () => {
    const drei = leistungsentgeltJahr({ bemessungsentgeltJahr: 48000, steuerklasse: 3 });
    const fuenf = leistungsentgeltJahr({ bemessungsentgeltJahr: 48000, steuerklasse: 5 });

    expect(fuenf).toBeLessThan(drei);
  });

  it('bleibt unterhalb des Grundfreibetrags bei 80 % des Bemessungsentgelts', () => {
    // Ohne Lohnsteuer bleibt allein die Pauschale von 20 Prozent.
    expect(leistungsentgeltJahr({ bemessungsentgeltJahr: 9000, steuerklasse: 1 })).toBeCloseTo(7200, 6);
  });

  it('gibt für ein Bemessungsentgelt von 0 auch 0 zurück', () => {
    expect(leistungsentgeltJahr({ bemessungsentgeltJahr: 0, steuerklasse: 1 })).toBe(0);
  });

  it('behandelt negative und fehlende Eingaben als 0', () => {
    expect(leistungsentgeltJahr({ bemessungsentgeltJahr: -5000, steuerklasse: 1 })).toBe(0);
    expect(leistungsentgeltJahr({ steuerklasse: 1 })).toBe(0);
    expect(leistungsentgeltJahr({ bemessungsentgeltJahr: NaN, steuerklasse: 1 })).toBe(0);
  });

  it('wird nie negativ', () => {
    for (const entgelt of [1000, 12000, 60000, 150000]) {
      expect(leistungsentgeltJahr({ bemessungsentgeltJahr: entgelt, steuerklasse: 6 })).toBeGreaterThanOrEqual(0);
    }
  });

  it('weist eine unbekannte Steuerklasse zurück', () => {
    expect(() => leistungsentgeltJahr({ bemessungsentgeltJahr: 48000, steuerklasse: 7 })).toThrow(
      /Unbekannte Steuerklasse/,
    );
    expect(() => leistungsentgeltJahr({ bemessungsentgeltJahr: 48000, steuerklasse: 0 })).toThrow();
    expect(() => leistungsentgeltJahr({ bemessungsentgeltJahr: 48000, steuerklasse: '1' })).toThrow();
  });

  it('prüft die Steuerklasse auch dann, wenn das Entgelt 0 ist', () => {
    expect(() => leistungsentgeltJahr({ bemessungsentgeltJahr: 0, steuerklasse: 9 })).toThrow();
  });
});

describe('leistungsentgeltMonat', () => {
  it('ist der zwölfte Teil des Jahresbetrags', () => {
    const jahr = leistungsentgeltJahr({ bemessungsentgeltJahr: 4000 * 12, steuerklasse: 1 });

    expect(leistungsentgeltMonat({ bemessungsentgeltMonat: 4000, steuerklasse: 1 })).toBeCloseTo(jahr / 12, 6);
  });

  it('behandelt negative Eingaben als 0', () => {
    expect(leistungsentgeltMonat({ bemessungsentgeltMonat: -100, steuerklasse: 1 })).toBe(0);
  });
});

describe('leistungsentgeltTag (§ 153 i. V. m. § 154 SGB III)', () => {
  it('legt den Jahresbetrag auf 365 Kalendertage um', () => {
    const jahr = leistungsentgeltJahr({ bemessungsentgeltJahr: 120 * TAGE_JE_JAHR, steuerklasse: 1 });

    expect(leistungsentgeltTag({ bemessungsentgeltTag: 120, steuerklasse: 1 })).toBeCloseTo(
      jahr / TAGE_JE_JAHR,
      6,
    );
  });

  it('liegt wegen Lohnsteuer und Pauschale deutlich unter dem Bemessungsentgelt', () => {
    const tag = leistungsentgeltTag({ bemessungsentgeltTag: 150, steuerklasse: 1 });

    expect(tag).toBeGreaterThan(0);
    expect(tag).toBeLessThan(150 * 0.8);
  });

  it('behandelt negative Eingaben als 0', () => {
    expect(leistungsentgeltTag({ bemessungsentgeltTag: -1, steuerklasse: 1 })).toBe(0);
  });
});
