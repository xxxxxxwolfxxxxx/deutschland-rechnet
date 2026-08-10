import { describe, it, expect } from 'vitest';
import { einkommensteuer, GRUNDFREIBETRAG, TARIF_STAND } from '../../public/scripts/einkommensteuer.js';

// Referenz: § 32a Abs. 1 EStG in der ab Veranlagungszeitraum 2026 geltenden Fassung
// (gesetze-im-internet.de/estg/__32a.html).

describe('Grundfreibetrag', () => {
  it('beträgt 12.348 € (VZ 2026)', () => {
    expect(GRUNDFREIBETRAG).toBe(12348);
  });

  it('bis einschließlich Grundfreibetrag fällt keine Steuer an', () => {
    expect(einkommensteuer(0)).toBe(0);
    expect(einkommensteuer(12348)).toBe(0);
  });

  it('oberhalb des Grundfreibetrags fällt Steuer an', () => {
    expect(einkommensteuer(12400)).toBeGreaterThan(0);
  });
});

describe('Tarifzonen nach § 32a Abs. 1 EStG', () => {
  it('zweite Zone: zvE 15.000 € ergibt 435 €', () => {
    expect(einkommensteuer(15000)).toBe(435);
  });

  it('dritte Zone: zvE 30.000 € ergibt 4.217 €', () => {
    expect(einkommensteuer(30000)).toBe(4217);
  });

  it('vierte Zone (42 %): zvE 100.000 € ergibt 30.864 €', () => {
    expect(einkommensteuer(100000)).toBe(30864);
  });

  it('fünfte Zone (45 %): zvE 300.000 € ergibt 115.529 €', () => {
    expect(einkommensteuer(300000)).toBe(115529);
  });
});

describe('Tarifverlauf', () => {
  // Der Tarif des § 32a EStG ist stetig. Springt die Steuer an einer
  // Zonengrenze, stimmen die Konstanten nicht mit dem Gesetz überein.
  const grenzen = [12348, 17799, 69878, 277825];

  it.each(grenzen)('ist an der Zonengrenze %i € stetig', (grenze) => {
    const davor = einkommensteuer(grenze);
    const danach = einkommensteuer(grenze + 1);
    expect(danach - davor).toBeLessThanOrEqual(1);
    expect(danach).toBeGreaterThanOrEqual(davor);
  });

  it('steigt monoton', () => {
    let vorher = -1;
    for (let zvE = 0; zvE <= 300000; zvE += 250) {
      const steuer = einkommensteuer(zvE);
      expect(steuer).toBeGreaterThanOrEqual(vorher);
      vorher = steuer;
    }
  });

  it('überschreitet nie den Spitzensteuersatz von 45 %', () => {
    for (const zvE of [20000, 50000, 100000, 500000, 1000000]) {
      expect(einkommensteuer(zvE)).toBeLessThan(zvE * 0.45);
    }
  });

  it('rundet auf volle Euro ab (§ 32a Abs. 1 Satz 2 EStG)', () => {
    for (const zvE of [15000, 30000, 100000, 300000]) {
      expect(Number.isInteger(einkommensteuer(zvE))).toBe(true);
    }
  });
});

describe('Robustheit', () => {
  it('behandelt negative Einkommen als 0', () => {
    expect(einkommensteuer(-5000)).toBe(0);
  });

  it('gibt den Rechtsstand als Datum an', () => {
    expect(TARIF_STAND).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
