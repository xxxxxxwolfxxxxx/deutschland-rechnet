import { describe, it, expect } from 'vitest';
import {
  STROMMIX_JAHR,
  STROMMIX_GRAMM_JE_KWH,
  STROMMIX_KG_JE_KWH,
  STROMMIX_HISTORIE,
  STROMMIX_QUELLE,
} from '../../public/scripts/emissionsfaktoren.js';

// Umweltbundesamt, "CO2-Emissionen pro Kilowattstunde Strom 2025 nur leicht
// gesunken", veröffentlicht am 23.03.2026, abgerufen am 12.08.2026.
describe('Strommix-Emissionsfaktor des Umweltbundesamtes', () => {
  it('rechnet mit dem UBA-Wert für 2025', () => {
    expect(STROMMIX_JAHR).toBe(2025);
    expect(STROMMIX_GRAMM_JE_KWH).toBe(344);
  });

  it('weist denselben Wert in Kilogramm je Kilowattstunde aus', () => {
    expect(STROMMIX_KG_JE_KWH).toBeCloseTo(0.344, 6);
    expect(STROMMIX_KG_JE_KWH).toBeCloseTo(STROMMIX_GRAMM_JE_KWH / 1000, 9);
  });

  it('kennt die Vorjahreswerte des UBA', () => {
    expect(STROMMIX_HISTORIE[2023]).toBe(379);
    expect(STROMMIX_HISTORIE[2024]).toBe(353);
    expect(STROMMIX_HISTORIE[2025]).toBe(344);
  });

  it('führt das aktuelle Jahr auch in der Historie', () => {
    expect(STROMMIX_HISTORIE[STROMMIX_JAHR]).toBe(STROMMIX_GRAMM_JE_KWH);
  });

  it('nennt Quelle und Abrufdatum, damit der Wert nachziehbar bleibt', () => {
    expect(STROMMIX_QUELLE).toMatch(/Umweltbundesamt/);
    expect(STROMMIX_QUELLE).toMatch(/12\.08\.2026/);
  });

  it('liegt nicht mehr bei den überholten 400 bis 500 Gramm', () => {
    // Ältere Module im Repo rechneten mit 0,40 bis 0,50 kg/kWh. Das war der
    // Stand der 2010er Jahre und überschätzt die Emissionen um rund ein Drittel.
    expect(STROMMIX_KG_JE_KWH).toBeLessThan(0.4);
  });
});
