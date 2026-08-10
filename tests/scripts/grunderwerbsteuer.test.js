import { describe, it, expect } from 'vitest';
import { berechneGrunderwerbsteuer, STEUERSAETZE, BUNDESLAENDER } from '../../public/scripts/grunderwerbsteuer.js';

describe('berechneGrunderwerbsteuer', () => {
  it('Bayern: 3,5% auf 300.000 € = 10.500 €', () => {
    const r = berechneGrunderwerbsteuer({ kaufpreis: 300000, bundesland: 'by' });
    expect(r.steuer).toBe(10500);
    expect(r.satz).toBe(3.5);
  });
  it('NRW: 6,5% auf 400.000 € = 26.000 €', () => {
    const r = berechneGrunderwerbsteuer({ kaufpreis: 400000, bundesland: 'nw' });
    expect(r.steuer).toBe(26000);
  });
  it('STEUERSAETZE enthält alle 16 Bundesländer', () => {
    expect(Object.keys(STEUERSAETZE).length).toBe(16);
  });
});

describe('Aktualität der Steuersätze', () => {
  // Diese beiden Sätze standen bis 10.08.2026 falsch in der Tabelle und haben
  // im Rechner zu Abweichungen von mehreren tausend Euro geführt. Die Tests
  // halten die Werte fest, damit sie nicht unbemerkt zurückfallen.
  it('Thüringen: 5,0% seit 01.01.2024 (vorher 6,5%)', () => {
    expect(STEUERSAETZE.th).toBe(5.0);
    const r = berechneGrunderwerbsteuer({ kaufpreis: 400000, bundesland: 'th' });
    expect(r.steuer).toBe(20000);
  });
  it('Bremen: 5,5% seit 01.07.2025 (vorher 5,0%)', () => {
    expect(STEUERSAETZE.hb).toBe(5.5);
    const r = berechneGrunderwerbsteuer({ kaufpreis: 400000, bundesland: 'hb' });
    expect(r.steuer).toBe(22000);
  });
});

describe('BUNDESLAENDER-Metadaten', () => {
  it('enthält für jedes Land Name, Satz und Gültigkeitsdatum', () => {
    const eintraege = Object.values(BUNDESLAENDER);
    expect(eintraege).toHaveLength(16);
    for (const land of eintraege) {
      expect(land.name).toBeTruthy();
      expect(typeof land.satz).toBe('number');
      expect(land.gueltigSeit).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('STEUERSAETZE ist aus BUNDESLAENDER abgeleitet – kein zweiter Datensatz', () => {
    for (const [kuerzel, land] of Object.entries(BUNDESLAENDER)) {
      expect(STEUERSAETZE[kuerzel]).toBe(land.satz);
    }
  });

  it('Spannweite reicht von 3,5% (Bayern) bis 6,5%', () => {
    const saetze = Object.values(BUNDESLAENDER).map(l => l.satz);
    expect(Math.min(...saetze)).toBe(3.5);
    expect(Math.max(...saetze)).toBe(6.5);
    expect(BUNDESLAENDER.by.satz).toBe(3.5);
  });
});
