import { describe, it, expect } from 'vitest';
import {
  KOMBINATIONEN,
  jahressteuerEhegatten,
  faktor,
  vergleicheKombinationen,
} from '../../public/scripts/steuerklassenwahl.js';
import { jahreslohnsteuer } from '../../public/scripts/lohnsteuer.js';

const paar = { bruttoJahrA: 50000, bruttoJahrB: 25000, kinder: 1 };

// Bis zum 11.08.2026 rechnete der Steuerklassen-Optimierer das Einkommen mit
// Faktoren von 0,78 / 0,68 / 0,58 je Steuerklasse hoch und wies die Differenz
// als jährliche Steuerersparnis aus. Die Faktoren stehen in keinem Gesetz, und
// eine Ersparnis dieser Art gibt es nicht: Die Jahressteuer ist von der
// Steuerklasse unabhängig.
describe('jahressteuerEhegatten', () => {
  it('ist unabhängig von der Steuerklassen-Kombination', () => {
    const { jahressteuer, kombinationen } = vergleicheKombinationen(paar);
    expect(kombinationen).toHaveLength(KOMBINATIONEN.length);
    expect(jahressteuer.gesamt).toBeGreaterThan(0);
  });

  it('hängt nur von der Summe der Einkommen ab, nicht von ihrer Verteilung', () => {
    const gleich = jahressteuerEhegatten({ bruttoJahrA: 37500, bruttoJahrB: 37500, kinder: 1 });
    const ungleich = jahressteuerEhegatten({ bruttoJahrA: 50000, bruttoJahrB: 25000, kinder: 1 });
    // Kleine Abweichung bleibt, weil die Vorsorgepauschale je Partner an den
    // Beitragsbemessungsgrenzen gedeckelt wird – hier liegen beide darunter.
    expect(gleich.einkommensteuer).toBe(ungleich.einkommensteuer);
  });

  it('wendet den Splittingtarif an, nicht den Grundtarif', () => {
    const gemeinsam = jahressteuerEhegatten({ bruttoJahrA: 80000, bruttoJahrB: 0, kinder: 1 });
    const allein = jahreslohnsteuer({ jahresarbeitslohn: 80000, steuerklasse: 4, kinder: 1 });
    expect(gemeinsam.einkommensteuer).toBeLessThan(allein);
  });

  it('nutzt für den Solidaritätszuschlag die Freigrenze der Zusammenveranlagung', () => {
    const mittel = jahressteuerEhegatten({ bruttoJahrA: 75000, bruttoJahrB: 75000, kinder: 1 });
    expect(mittel.einkommensteuer).toBeGreaterThan(20350);
    expect(mittel.einkommensteuer).toBeLessThan(40700);
    expect(mittel.soli).toBe(0);
  });
});

describe('faktor nach § 39f EStG', () => {
  it('ist bei ungleichen Einkommen kleiner als 1 und damit anwendbar', () => {
    const f = faktor(paar);
    expect(f.wert).toBeLessThan(1);
    expect(f.wert).toBeGreaterThan(0.8);
    expect(f.anwendbar).toBe(true);
  });

  it('hat genau drei Nachkommastellen und wird abgeschnitten, nicht gerundet', () => {
    const f = faktor(paar);
    expect(Number.isInteger(f.wert * 1000)).toBe(true);
    const roh = jahressteuerEhegatten(paar).einkommensteuer /
      (jahreslohnsteuer({ jahresarbeitslohn: 50000, steuerklasse: 4, kinder: 1 }) +
       jahreslohnsteuer({ jahresarbeitslohn: 25000, steuerklasse: 4, kinder: 1 }));
    expect(f.wert).toBeLessThanOrEqual(roh);
    expect(roh - f.wert).toBeLessThan(0.001);
  });

  it('ist nicht anwendbar, wenn gar keine Lohnsteuer anfällt', () => {
    expect(faktor({ bruttoJahrA: 5000, bruttoJahrB: 0, kinder: 1 }).anwendbar).toBe(false);
  });
});

describe('vergleicheKombinationen', () => {
  it('III/V behält weniger ein als IV/IV und führt zur Nachzahlung', () => {
    const nach = kombiNach(paar);
    expect(nach['III/V'].abzugJahr).toBeLessThan(nach['IV/IV'].abzugJahr);
    expect(nach['III/V'].differenz).toBeLessThan(0);
  });

  it('IV/IV mit Faktor trifft die Jahressteuer nahezu genau', () => {
    const nach = kombiNach(paar);
    expect(Math.abs(nach['IV/IV-Faktor'].differenz)).toBeLessThan(60);
  });

  it('IV/IV mit Faktor liegt zwischen IV/IV und III/V', () => {
    const nach = kombiNach(paar);
    expect(nach['IV/IV-Faktor'].abzugJahr).toBeLessThanOrEqual(nach['IV/IV'].abzugJahr);
    expect(nach['IV/IV-Faktor'].abzugJahr).toBeGreaterThan(nach['III/V'].abzugJahr);
  });

  it('V/III ist bei ungleichen Einkommen ungünstiger als III/V', () => {
    const nach = kombiNach(paar);
    expect(nach['V/III'].abzugJahr).toBeGreaterThan(nach['III/V'].abzugJahr);
  });

  it('markiert das Faktorverfahren bei gleichen Einkommen als nicht anwendbar', () => {
    const { kombinationen } = vergleicheKombinationen({ bruttoJahrA: 40000, bruttoJahrB: 40000, kinder: 1 });
    expect(kombinationen.find(k => k.faktorverfahren).anwendbar).toBe(false);
  });

  it('bei gleichen Einkommen trifft IV/IV die Jahressteuer', () => {
    const nach = kombiNach({ bruttoJahrA: 40000, bruttoJahrB: 40000, kinder: 1 });
    expect(Math.abs(nach['IV/IV'].differenz)).toBeLessThan(5);
  });

  it('weist Erstattung positiv und Nachzahlung negativ aus', () => {
    const nach = kombiNach(paar);
    expect(nach['IV/IV'].differenz).toBeGreaterThan(0);
    expect(nach['III/V'].differenz).toBeLessThan(0);
  });

  it('Abzug und Differenz passen zur Jahressteuer', () => {
    const { jahressteuer, kombinationen } = vergleicheKombinationen(paar);
    for (const k of kombinationen) {
      expect(k.abzugJahr - jahressteuer.gesamt, k.id).toBeCloseTo(k.differenz, 2);
      expect(k.abzugMonat, k.id).toBeCloseTo(k.abzugJahr / 12, 2);
    }
  });

  it('kommt mit einem Alleinverdiener zurecht', () => {
    const nach = kombiNach({ bruttoJahrA: 60000, bruttoJahrB: 0, kinder: 1 });
    expect(nach['III/V'].partnerB.lohnsteuerJahr).toBe(0);
    expect(nach['III/V'].abzugJahr).toBeGreaterThan(0);
  });

  it('kommt mit zwei Nullen zurecht', () => {
    for (const k of vergleicheKombinationen({ bruttoJahrA: 0, bruttoJahrB: 0 }).kombinationen) {
      expect(k.abzugJahr, k.id).toBe(0);
      expect(k.differenz, k.id).toBe(0);
    }
  });
});

function kombiNach(eingabe) {
  return Object.fromEntries(vergleicheKombinationen(eingabe).kombinationen.map(k => [k.id, k]));
}
