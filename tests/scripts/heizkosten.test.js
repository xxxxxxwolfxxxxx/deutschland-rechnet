import { describe, it, expect } from 'vitest';
import {
  BRENNSTOFFE,
  CO2_FESTPREIS_EURO_JE_TONNE,
  CO2_PREISKORRIDOR_2026,
  CO2_PREIS_AKTUELL,
  UMSATZSTEUERSATZ,
  MIETERANTEIL_STUFEN,
  emissionsfaktor,
  kwhJeLiterHeizoel,
  co2Preisbestandteil,
  waermepreisWaermepumpe,
  waermepreisCent,
  abgerechneteKwh,
  mieteranteilCo2Kosten,
  berechneHeizkosten,
} from '../../public/scripts/heizkosten.js';

describe('CO2-Preis nach § 10 Abs. 2 BEHG', () => {
  it('kennt die Festpreise der Einführungsphase 2021 bis 2025', () => {
    expect(CO2_FESTPREIS_EURO_JE_TONNE[2021]).toBe(25);
    expect(CO2_FESTPREIS_EURO_JE_TONNE[2022]).toBe(30);
    expect(CO2_FESTPREIS_EURO_JE_TONNE[2023]).toBe(30);
    expect(CO2_FESTPREIS_EURO_JE_TONNE[2024]).toBe(45);
    expect(CO2_FESTPREIS_EURO_JE_TONNE[2025]).toBe(55);
  });
  it('hat für 2025 keinen Preis über 55 Euro und endet dort', () => {
    expect(CO2_FESTPREIS_EURO_JE_TONNE[2026]).toBeUndefined();
  });
  it('kennt den Preiskorridor 2026 von 55 bis 65 Euro', () => {
    expect(CO2_PREISKORRIDOR_2026).toEqual({ min: 55, max: 65 });
  });
  it('rechnet mit dem Mindestpreis des Korridors', () => {
    expect(CO2_PREIS_AKTUELL).toBe(CO2_PREISKORRIDOR_2026.min);
  });
});

describe('emissionsfaktor nach EBeV 2030 Anlage 2 Teil 4', () => {
  it('rechnet für Erdgas mit dem gesetzlichen Umrechnungsfaktor 3,2508 GJ/MWh', () => {
    // 3,2508 GJ/MWh × 0,0558 t CO2/GJ = 0,18140 t/MWh = 0,18140 kg/kWh
    expect(emissionsfaktor('gas')).toBeCloseTo(0.1814, 4);
  });
  it('liefert für Erdgas nicht den rein heizwertbezogenen Wert', () => {
    // 0,0558 × 3,6 = 0,20088 wäre der Wert je kWh Heizwert – Gas wird aber
    // in Brennwert-kWh abgerechnet, deshalb der kleinere Umrechnungsfaktor.
    expect(emissionsfaktor('gas')).toBeLessThan(0.0558 * 3.6);
  });
  it('rechnet für Heizöl EL mit 0,074 t CO2/GJ', () => {
    expect(emissionsfaktor('heizoel')).toBeCloseTo(0.2664, 4);
  });
  it('rechnet für Flüssiggas mit 0,0655 t CO2/GJ', () => {
    expect(emissionsfaktor('fluessiggas')).toBeCloseTo(0.2358, 4);
  });
  it('gibt für Brennstoffe ohne BEHG-Pflicht 0 zurück', () => {
    expect(emissionsfaktor('pellets')).toBe(0);
    expect(emissionsfaktor('waermepumpe')).toBe(0);
  });
  it('kennt den Energiegehalt eines Liters Heizöl', () => {
    // 1.000 l = 0,845 t × 42,8 GJ/t = 36,166 GJ = 10.046 kWh
    expect(kwhJeLiterHeizoel()).toBeCloseTo(10.046, 3);
  });
});

describe('co2Preisbestandteil', () => {
  it('weist den Preisbestandteil inklusive Umsatzsteuer aus (§ 3 Abs. 3 CO2KostAufG)', () => {
    const r = co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'gas' });
    expect(r.emissionenKg).toBeCloseTo(2720.9, 1);
    // 2,7209 t × 55 € = 149,65 € netto, × 1,19 = 178,08 € brutto
    expect(r.kostenNetto).toBeCloseTo(149.65, 2);
    expect(r.kosten).toBeCloseTo(178.08, 2);
  });
  it('rechnet den Bestandteil auch je Kilowattstunde aus', () => {
    const r = co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'gas' });
    expect(r.centProKwh).toBeCloseTo(1.1872, 4);
  });
  it('liefert für Heizöl einen höheren Bestandteil als für Gas', () => {
    const gas = co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'gas' });
    const oel = co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'heizoel' });
    expect(oel.centProKwh).toBeGreaterThan(gas.centProKwh);
    expect(oel.centProKwh).toBeCloseTo(1.7436, 4);
  });
  it('liefert für Pellets und Wärmepumpe keinen Bestandteil', () => {
    expect(co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'pellets' }).kosten).toBe(0);
    expect(co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'waermepumpe' }).kosten).toBe(0);
  });
  it('rechnet mit dem Höchstpreis des Korridors, wenn er übergeben wird', () => {
    const min = co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'gas' });
    const max = co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'gas', preisJeTonne: 65 });
    expect(max.kosten / min.kosten).toBeCloseTo(65 / 55, 3);
  });
  it('kann die Umsatzsteuer abschalten', () => {
    const r = co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'gas', mitUmsatzsteuer: false });
    expect(r.kosten).toBeCloseTo(r.kostenNetto, 6);
    expect(UMSATZSTEUERSATZ).toBe(0.19);
  });
  it('beziffert den Anstieg gegenüber 2021 kleiner als den Bestandteil selbst', () => {
    const jetzt = co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'gas' });
    const start = co2Preisbestandteil({ verbrauchKwh: 15000, brennstoff: 'gas', preisJeTonne: CO2_FESTPREIS_EURO_JE_TONNE[2021] });
    expect(jetzt.kosten - start.kosten).toBeLessThan(jetzt.kosten);
    expect(jetzt.kosten - start.kosten).toBeCloseTo(97.14, 2);
  });
});

describe('waermepreisWaermepumpe', () => {
  it('teilt den Strompreis durch die Jahresarbeitszahl', () => {
    expect(waermepreisWaermepumpe({ strompreisCent: 28, jaz: 3.5 })).toBeCloseTo(8, 6);
  });
  it('liegt bei realistischen Werten deutlich über 5 ct/kWh', () => {
    const preis = waermepreisWaermepumpe({ strompreisCent: BRENNSTOFFE.waermepumpe.arbeitspreisCent, jaz: BRENNSTOFFE.waermepumpe.jaz });
    expect(preis).toBeGreaterThan(6);
  });
  it('verlangt eine Jahresarbeitszahl größer null', () => {
    expect(() => waermepreisWaermepumpe({ strompreisCent: 28, jaz: 0 })).toThrow();
  });
});

describe('Brennstoff-Annahmen', () => {
  it('führt für jeden Brennstoff Arbeitspreis, Nutzungsgrad und Grundpreis', () => {
    for (const [key, b] of Object.entries(BRENNSTOFFE)) {
      expect(b.label, key).toBeTruthy();
      expect(b.arbeitspreisCent, key).toBeGreaterThan(0);
      expect(b.nutzungsgrad, key).toBeGreaterThan(0);
      expect(b.grundpreisJahr, key).toBeGreaterThanOrEqual(0);
    }
  });
  it('nutzt bei der Wärmepumpe die Jahresarbeitszahl als Nutzungsgrad', () => {
    const wp = BRENNSTOFFE.waermepumpe;
    expect(wp.nutzungsgrad).toBe(wp.jaz);
    expect(wp.nutzungsgrad).toBeGreaterThan(1);
  });
  it('setzt bei Verbrennungsheizungen einen Nutzungsgrad unter eins an', () => {
    expect(BRENNSTOFFE.gas.nutzungsgrad).toBeLessThan(1);
    expect(BRENNSTOFFE.heizoel.nutzungsgrad).toBeLessThan(1);
    expect(BRENNSTOFFE.pellets.nutzungsgrad).toBeLessThan(1);
  });
  it('macht die Wärmepumpe erst über den Wärmepreis vergleichbar', () => {
    const wp = BRENNSTOFFE.waermepumpe;
    const gas = BRENNSTOFFE.gas;
    // Roher Arbeitspreisvergleich: Strom teurer als Gas.
    expect(wp.arbeitspreisCent).toBeGreaterThan(gas.arbeitspreisCent);
    // Je Kilowattstunde Wärme kehrt sich das um.
    expect(waermepreisCent(wp)).toBeLessThan(waermepreisCent(gas));
    expect(waermepreisCent(wp)).toBeCloseTo(waermepreisWaermepumpe({ strompreisCent: wp.arbeitspreisCent, jaz: wp.jaz }), 6);
  });
});

describe('abgerechneteKwh', () => {
  it('verlangt bei Verbrennung mehr Brennstoff als Wärmebedarf', () => {
    expect(abgerechneteKwh({ waermebedarfKwh: 15000, nutzungsgrad: 0.95 })).toBeCloseTo(15789.47, 2);
  });
  it('verlangt bei der Wärmepumpe nur einen Bruchteil an Strom', () => {
    expect(abgerechneteKwh({ waermebedarfKwh: 15000, nutzungsgrad: 3.5 })).toBeCloseTo(4285.71, 2);
  });
  it('weist einen Nutzungsgrad von null zurück', () => {
    expect(() => abgerechneteKwh({ waermebedarfKwh: 15000, nutzungsgrad: 0 })).toThrow();
  });
});

describe('mieteranteilCo2Kosten nach der Anlage zum CO2KostAufG', () => {
  it('lässt den Mieter unter 12 kg/m²/a alles tragen', () => {
    expect(mieteranteilCo2Kosten(5).mieter).toBe(1);
    expect(mieteranteilCo2Kosten(11.9).vermieter).toBe(0);
  });
  it('trifft die Stufengrenzen exakt', () => {
    expect(mieteranteilCo2Kosten(12).mieter).toBeCloseTo(0.9, 6);
    expect(mieteranteilCo2Kosten(16.9).mieter).toBeCloseTo(0.9, 6);
    expect(mieteranteilCo2Kosten(17).mieter).toBeCloseTo(0.8, 6);
    expect(mieteranteilCo2Kosten(37).mieter).toBeCloseTo(0.4, 6);
  });
  it('deckelt den Mieteranteil ab 52 kg/m²/a bei 5 Prozent', () => {
    expect(mieteranteilCo2Kosten(52).mieter).toBeCloseTo(0.05, 6);
    expect(mieteranteilCo2Kosten(120).vermieter).toBeCloseTo(0.95, 6);
  });
  it('hat zehn Stufen, deren Anteile sich stets zu eins ergänzen', () => {
    expect(MIETERANTEIL_STUFEN).toHaveLength(10);
    for (const stufe of MIETERANTEIL_STUFEN) {
      expect(stufe.mieter + stufe.vermieter).toBeCloseTo(1, 6);
    }
  });
});

describe('berechneHeizkosten', () => {
  it('berechnet Jahreskosten korrekt', () => {
    const r = berechneHeizkosten({ verbrauchKwh: 10000, preisCent: 10 });
    expect(r.kosten).toBe(1000);
  });
  it('berechnet Monatskosten korrekt', () => {
    const r = berechneHeizkosten({ verbrauchKwh: 12000, preisCent: 10 });
    expect(r.monat).toBe(100);
  });
  it('rundet auf Cent', () => {
    const r = berechneHeizkosten({ verbrauchKwh: 1000, preisCent: 9.9 });
    expect(r.kosten).toBe(99);
  });
  it('addiert den Grundpreis auf die Arbeitskosten', () => {
    const r = berechneHeizkosten({ verbrauchKwh: 15000, preisCent: 11, grundpreisJahr: 180 });
    expect(r.arbeitskosten).toBe(1650);
    expect(r.grundpreis).toBe(180);
    expect(r.kosten).toBe(1830);
  });
  it('weist den CO2-Preis als Bestandteil aus, nicht als Zuschlag', () => {
    const r = berechneHeizkosten({ verbrauchKwh: 15000, preisCent: 11, brennstoff: 'gas' });
    expect(r.kosten).toBe(1650);
    expect(r.co2Anteil.kosten).toBeCloseTo(178.08, 2);
    expect(r.co2Anteil.kosten).toBeLessThan(r.kosten);
  });
  it('summiert Monats- und Jahreskosten widerspruchsfrei', () => {
    const r = berechneHeizkosten({ verbrauchKwh: 15000, preisCent: 10.7, grundpreisJahr: 180 });
    expect(Math.round(r.monat * 12 * 100) / 100).toBeCloseTo(r.kosten, 1);
  });
});
