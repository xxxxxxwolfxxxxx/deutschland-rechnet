import { describe, it, expect } from 'vitest';
import { berechneMietrendite } from '../../public/scripts/mietrendite.js';

// Mietrendite auf die Gesamtinvestition: Kaufpreis plus Grunderwerbsteuer,
// Notar, Grundbuch und Maklerprovision aus immokauf-nebenkosten.js. Bis
// September 2026 rechnete die Seite beide Renditen auf den Kaufpreis.

const BASIS = { kaufpreis: 300000, kaltmieteJahr: 14400, nebenkosten: 1500, instandhaltung: 1000, bundesland: 'NW' };

describe('berechneMietrendite – Beispiel der Seite', () => {
  it('bezieht die Kaufnebenkosten ein: 33.429,45 € in NRW mit Makler', () => {
    const r = berechneMietrendite(BASIS);
    expect(r.kaufnebenkosten).toBe(33429.45);
    expect(r.gesamtinvestition).toBe(333429.45);
    expect(r.nebenkostenAufschluesselung.grunderwerbsteuer).toBe(19500);
    expect(r.nebenkostenAufschluesselung.makler).toBe(10710);
  });

  it('Nettorendite 3,57 % statt 3,97 % auf den Kaufpreis', () => {
    const r = berechneMietrendite(BASIS);
    expect(r.bruttorenditeAufKaufpreis).toBe(4.8);
    expect(r.bruttorendite).toBe(4.319);
    expect(r.nettorendite).toBe(3.569);
    expect(r.nettorenditeAufKaufpreis).toBe(3.967);
    expect(r.nettoMiete).toBe(11900);
  });

  it('Kaufpreisfaktor auf den Preis und auf das eingesetzte Kapital', () => {
    const r = berechneMietrendite(BASIS);
    expect(r.kaufpreisfaktor).toBe(20.833);
    expect(r.faktorAufGesamtinvestition).toBe(23.155);
  });
});

describe('berechneMietrendite – Varianten', () => {
  it('ohne Makler entfallen 10.710 €', () => {
    expect(berechneMietrendite({ ...BASIS, mitMakler: false }).kaufnebenkosten).toBe(22719.45);
  });

  it('Bayern mit 3,5 % Grunderwerbsteuer', () => {
    expect(berechneMietrendite({ ...BASIS, bundesland: 'BY' }).kaufnebenkosten).toBe(24429.45);
  });

  it('ohne Nebenkosten rechnet sie wie frueher auf den Kaufpreis', () => {
    const r = berechneMietrendite({ ...BASIS, kaufnebenkostenBeruecksichtigen: false });
    expect(r.gesamtinvestition).toBe(300000);
    expect(r.nettorendite).toBe(3.967);
  });

  it('ohne Kaufpreis und Miete keine Division durch null', () => {
    const r = berechneMietrendite({ kaufpreis: 0, kaltmieteJahr: 0 });
    expect(r.nettorendite).toBe(0);
    expect(r.kaufpreisfaktor).toBe(0);
  });
});
