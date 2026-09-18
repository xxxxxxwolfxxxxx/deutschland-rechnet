import { describe, it, expect } from 'vitest';
import { klassifiziereBlutdruck, ESH_STUFEN } from '../../public/scripts/blutdruck.js';

describe('klassifiziereBlutdruck – die höhere der beiden Kategorien zählt', () => {
  it('stuft nach dem oberen Wert ein, wenn dieser höher liegt', () => {
    // Der frühere Rechner meldete hier "hoch-normal", weil er die Werte mit
    // ODER verknüpfte: 145 ist Grad 1, 85 nur hoch-normal.
    const r = klassifiziereBlutdruck({ systolisch: 145, diastolisch: 85 });
    expect(r.name).toBe('Hypertonie Grad 1');
    expect(r.treiber).toBe('oberer Wert');
  });

  it('stuft nach dem unteren Wert ein, wenn dieser höher liegt', () => {
    const r = klassifiziereBlutdruck({ systolisch: 128, diastolisch: 94 });
    expect(r.name).toBe('Hypertonie Grad 1');
    expect(r.treiber).toBe('unterer Wert');
  });

  it('nennt beide, wenn sie dieselbe Stufe tragen', () => {
    expect(klassifiziereBlutdruck({ systolisch: 150, diastolisch: 95 }).treiber).toBe('beide');
  });

  it('kennt die Grenzen der ESH-Tabelle', () => {
    expect(klassifiziereBlutdruck({ systolisch: 119, diastolisch: 79 }).name).toBe('optimal');
    expect(klassifiziereBlutdruck({ systolisch: 120, diastolisch: 79 }).name).toBe('normal');
    expect(klassifiziereBlutdruck({ systolisch: 139, diastolisch: 89 }).name).toBe('hoch-normal');
    expect(klassifiziereBlutdruck({ systolisch: 140, diastolisch: 90 }).name).toBe('Hypertonie Grad 1');
    expect(klassifiziereBlutdruck({ systolisch: 160, diastolisch: 100 }).name).toBe('Hypertonie Grad 2');
    expect(klassifiziereBlutdruck({ systolisch: 180, diastolisch: 110 }).name).toBe('Hypertonie Grad 3');
  });

  it('weist die isolierte systolische Hypertonie aus', () => {
    expect(klassifiziereBlutdruck({ systolisch: 185, diastolisch: 88 }).isoliert).toBe('isoliert systolisch');
    expect(klassifiziereBlutdruck({ systolisch: 128, diastolisch: 94 }).isoliert).toBe('isoliert diastolisch');
    expect(klassifiziereBlutdruck({ systolisch: 150, diastolisch: 95 }).isoliert).toBe('');
  });

  it('hat sechs aufsteigende Stufen', () => {
    expect(ESH_STUFEN).toHaveLength(6);
    for (let i = 1; i < ESH_STUFEN.length; i += 1) {
      expect(ESH_STUFEN[i].systolischAb).toBeGreaterThan(ESH_STUFEN[i - 1].systolischAb);
      expect(ESH_STUFEN[i].diastolischAb).toBeGreaterThan(ESH_STUFEN[i - 1].diastolischAb);
    }
  });
});
