import { describe, it, expect } from 'vitest';
import { berechneQmPreis } from '../../public/scripts/qm-preis.js';

// Nachschlagemodul für Quadratmeterpreise. Die Tabelle enthält gerundete
// Marktwerte je Stadt beziehungsweise Region – keine amtlichen Werte, sondern
// Orientierungsgrößen. Getestet wird die Auswahllogik, nicht die Marktlage.

describe('berechneQmPreis – Nachschlagen', () => {
  it('liefert den Kaufpreis je Quadratmeter für Wohnungen', () => {
    const r = berechneQmPreis({ region: 'BE', flaeche: 70, typ: 'kauf_wohnung' });

    expect(r.qmPreis).toBe(4500);
    expect(r.gesamtwert).toBe(315000);
    expect(r.regionName).toBe('Berlin');
  });

  it('liefert den Kaufpreis je Quadratmeter für Häuser', () => {
    const r = berechneQmPreis({ region: 'L', flaeche: 140, typ: 'kauf_haus' });

    expect(r.qmPreis).toBe(3500);
    expect(r.gesamtwert).toBe(490000);
    expect(r.regionName).toBe('Leipzig');
  });

  it('liefert die Monatsmiete für Mietobjekte', () => {
    const r = berechneQmPreis({ region: 'HH', flaeche: 65, typ: 'miete' });

    expect(r.qmPreis).toBe(14);
    expect(r.gesamtwert).toBe(910);
    expect(r.regionName).toBe('Hamburg');
  });
});

describe('berechneQmPreis – Rückfallwerte', () => {
  it('unbekannte Region fällt auf den Bundesdurchschnitt zurück', () => {
    const unbekannt = berechneQmPreis({ region: 'XX', flaeche: 80, typ: 'kauf_wohnung' });
    const bund = berechneQmPreis({ region: 'DE', flaeche: 80, typ: 'kauf_wohnung' });

    expect(unbekannt).toEqual(bund);
    expect(unbekannt.regionName).toBe('Deutschland');
  });

  it('unbekannter Objekttyp rechnet mit 3000 €/m²', () => {
    const r = berechneQmPreis({ region: 'BE', flaeche: 50, typ: 'erbbaurecht' });

    expect(r.qmPreis).toBe(3000);
    expect(r.gesamtwert).toBe(150000);
  });
});

describe('berechneQmPreis – Plausibilität der Tabelle', () => {
  it('Häuser kosten je Quadratmeter mehr als Wohnungen', () => {
    for (const region of ['BAY', 'HH', 'BE', 'F', 'S', 'K', 'D', 'DD', 'MS', 'L', 'NRW', 'DE']) {
      const wohnung = berechneQmPreis({ region, flaeche: 1, typ: 'kauf_wohnung' });
      const haus = berechneQmPreis({ region, flaeche: 1, typ: 'kauf_haus' });

      expect(haus.qmPreis).toBeGreaterThan(wohnung.qmPreis);
    }
  });

  it('München ist die teuerste, Leipzig die günstigste Stadt der Tabelle', () => {
    const muenchen = berechneQmPreis({ region: 'BAY', flaeche: 1, typ: 'kauf_wohnung' }).qmPreis;
    const leipzig = berechneQmPreis({ region: 'L', flaeche: 1, typ: 'kauf_wohnung' }).qmPreis;

    for (const region of ['HH', 'BE', 'F', 'S', 'K', 'D', 'DD', 'MS', 'NRW', 'DE']) {
      const preis = berechneQmPreis({ region, flaeche: 1, typ: 'kauf_wohnung' }).qmPreis;
      expect(preis).toBeLessThan(muenchen);
      expect(preis).toBeGreaterThanOrEqual(leipzig);
    }
  });

  it('skaliert linear mit der Fläche', () => {
    const klein = berechneQmPreis({ region: 'K', flaeche: 40, typ: 'miete' });
    const gross = berechneQmPreis({ region: 'K', flaeche: 120, typ: 'miete' });

    expect(gross.gesamtwert).toBe(klein.gesamtwert * 3);
  });
});
