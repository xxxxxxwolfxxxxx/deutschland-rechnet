import { describe, it, expect } from 'vitest';
import {
  berechneKindergeld,
  KINDERGELD_MONAT,
  KINDERFREIBETRAG_JE_ELTERNTEIL,
  BEA_FREIBETRAG_JE_ELTERNTEIL,
} from '../../public/scripts/kindergeld.js';

// Bis zum 11.08.2026 stand hier 255 € – der Betrag des Jahres 2025.
// § 66 Abs. 1 EStG nennt seit dem 01.01.2026 259 Euro.
describe('Kindergeld', () => {
  it('beträgt 259 € je Kind und Monat (§ 66 Abs. 1 EStG)', () => {
    expect(KINDERGELD_MONAT).toBe(259);
  });

  it('1 Kind: 259 € monatlich, 3.108 € im Jahr', () => {
    const r = berechneKindergeld({ anzahlKinder: 1 });
    expect(r.monat).toBe(259);
    expect(r.jahr).toBe(3108);
  });

  it('zahlt für jedes Kind denselben Betrag – keine Staffelung', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      expect(berechneKindergeld({ anzahlKinder: n }).monat).toBe(n * 259);
    }
  });

  it('behandelt fehlende oder negative Angaben wie null', () => {
    expect(berechneKindergeld({ anzahlKinder: -2 }).monat).toBe(0);
    expect(berechneKindergeld({}).monat).toBe(0);
  });

  it('rechnet nur mit ganzen Kindern', () => {
    expect(berechneKindergeld({ anzahlKinder: 2.7 }).monat).toBe(518);
  });
});

// § 32 Abs. 6 Satz 1 EStG: 3.414 € sächliches Existenzminimum und 1.464 €
// Betreuungs-, Erziehungs- und Ausbildungsbedarf – je Elternteil. Satz 2
// verdoppelt beide Beträge bei Zusammenveranlagung.
describe('Freibeträge für Kinder', () => {
  it('Kinderfreibetrag 3.414 € je Elternteil, 6.828 € je Kind', () => {
    expect(KINDERFREIBETRAG_JE_ELTERNTEIL).toBe(3414);
    expect(KINDERFREIBETRAG_JE_ELTERNTEIL * 2).toBe(6828);
  });

  it('BEA-Freibetrag 1.464 € je Elternteil, 2.928 € je Kind', () => {
    expect(BEA_FREIBETRAG_JE_ELTERNTEIL).toBe(1464);
    expect(BEA_FREIBETRAG_JE_ELTERNTEIL * 2).toBe(2928);
  });

  it('weist die Freibeträge je Kind aus', () => {
    const r = berechneKindergeld({ anzahlKinder: 2 });
    expect(r.freibetragJeKind).toBe(9756);
    expect(r.freibetragGesamt).toBe(19512);
  });
});
