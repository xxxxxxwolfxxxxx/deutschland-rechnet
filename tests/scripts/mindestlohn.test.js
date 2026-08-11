import { describe, it, expect } from 'vitest';
import {
  berechneMindestlohn,
  MINDESTLOHN,
  MINIJOB_GRENZE,
  geringfuegigkeitsgrenze,
  MINDESTLOHN_ENTWICKLUNG,
  MINDESTLOHN_STAND,
  mindestlohnAm,
} from '../../public/scripts/mindestlohn.js';

// Bis zum 11.08.2026 rechnete das Modul mit 12,82 € – dem Satz des Jahres 2025.
// Seit dem 01.01.2026 gilt 13,90 € (§ 1 Abs. 2 MiLoG in Verbindung mit der
// Verordnung vom 05.11.2025, BGBl. 2025 I Nr. 268).
describe('Mindestlohn', () => {
  it('beträgt 13,90 € je Zeitstunde', () => {
    expect(MINDESTLOHN).toBe(13.9);
  });

  it('40 Wochenstunden ergeben 2.409,33 € im Monat', () => {
    const r = berechneMindestlohn({ stundenProWoche: 40 });
    expect(r.stundenProMonat).toBeCloseTo(173.33, 1);
    expect(r.monat).toBe(2409.33);
  });

  it('das Jahresentgelt ist das Zwölffache des Monatsentgelts', () => {
    const r = berechneMindestlohn({ stundenProWoche: 30 });
    expect(r.jahr).toBeCloseTo(r.monat * 12, 2);
  });

  it('skaliert linear mit den Wochenstunden', () => {
    const zwanzig = berechneMindestlohn({ stundenProWoche: 20 }).monat;
    const vierzig = berechneMindestlohn({ stundenProWoche: 40 }).monat;
    // Beide Werte sind auf Cent gerundet, daher ein Cent Toleranz.
    expect(vierzig).toBeCloseTo(zwanzig * 2, 1);
  });

  it('behandelt fehlende Angaben wie null', () => {
    expect(berechneMindestlohn({}).monat).toBe(0);
    expect(berechneMindestlohn({ stundenProWoche: -5 }).monat).toBe(0);
  });
});

// § 8 Abs. 1a Satz 2 SGB IV: Mindestlohn mal 130, geteilt durch drei, auf
// volle Euro aufgerundet.
describe('Geringfügigkeitsgrenze', () => {
  it('liegt 2026 bei 603 €, nicht bei 556 €', () => {
    expect(MINIJOB_GRENZE).toBe(603);
  });

  it('rundet auf volle Euro auf', () => {
    // 13,90 × 130 / 3 = 602,33…
    expect(geringfuegigkeitsgrenze(13.9)).toBe(603);
    expect(geringfuegigkeitsgrenze(12.82)).toBe(556);
    expect(geringfuegigkeitsgrenze(12)).toBe(520);
  });

  it('weist aus, wie viele Stunden ein Minijob zulässt', () => {
    const r = berechneMindestlohn({ stundenProWoche: 10 });
    expect(r.monat).toBeLessThanOrEqual(MINIJOB_GRENZE);
    expect(berechneMindestlohn({ stundenProWoche: 11 }).monat).toBeGreaterThan(MINIJOB_GRENZE);
  });
});

describe('Entwicklung des Mindestlohns', () => {
  it('mindestlohnAm liefert den zum Stichtag geltenden Satz', () => {
    expect(mindestlohnAm('2026-08-11')).toBe(13.9);
    expect(mindestlohnAm('2025-12-31')).toBe(12.82);
    expect(mindestlohnAm('2027-01-01')).toBe(14.6);
  });

  it('MINDESTLOHN ist der zum Stand des Moduls geltende Satz', () => {
    expect(mindestlohnAm(MINDESTLOHN_STAND)).toBe(MINDESTLOHN);
  });

  it('ist chronologisch sortiert und steigt monoton', () => {
    for (let i = 1; i < MINDESTLOHN_ENTWICKLUNG.length; i++) {
      expect(MINDESTLOHN_ENTWICKLUNG[i].ab > MINDESTLOHN_ENTWICKLUNG[i - 1].ab).toBe(true);
      expect(MINDESTLOHN_ENTWICKLUNG[i].betrag).toBeGreaterThan(MINDESTLOHN_ENTWICKLUNG[i - 1].betrag);
    }
  });

  it('führt jeden Satz mit seiner Fundstelle', () => {
    for (const eintrag of MINDESTLOHN_ENTWICKLUNG) {
      expect(eintrag.fundstelle, `${eintrag.ab}`).toBeTruthy();
    }
  });

  it('kennt die bereits verkündete Erhöhung auf 14,60 € zum 01.01.2027', () => {
    const kuenftig = MINDESTLOHN_ENTWICKLUNG.filter((e) => e.ab > '2026-01-01');
    expect(kuenftig).toEqual([
      expect.objectContaining({ ab: '2027-01-01', betrag: 14.6 }),
    ]);
  });
});
