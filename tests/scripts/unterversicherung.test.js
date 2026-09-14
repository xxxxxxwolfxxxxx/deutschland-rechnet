import { describe, it, expect } from 'vitest';
import { berechneEntschaedigung } from '../../public/scripts/unterversicherung.js';

// § 75 VVG: Leistung nach dem Verhältnis von Versicherungssumme zu Versicherungswert.

describe('berechneEntschaedigung', () => {
  it('kürzt im Verhältnis Summe zu Wert und zieht dann den Selbstbehalt ab', () => {
    const r = berechneEntschaedigung({ schaden: 50000, versicherungssumme: 300000, versicherungswert: 400000, selbstbehalt: 500 });

    expect(r.unterversichert).toBe(true);
    expect(r.quoteProzent).toBe(75);
    expect(r.kuerzung).toBe(12500);
    expect(r.leistung).toBe(37000);
    expect(r.eigenanteil).toBe(13000);
    expect(r.noetigeSumme).toBe(400000);
  });

  it('mit Unterversicherungsverzicht keine Kürzung', () => {
    const r = berechneEntschaedigung({ schaden: 50000, versicherungssumme: 300000, versicherungswert: 400000, selbstbehalt: 500, unterversicherungsverzicht: true });

    expect(r.quoteProzent).toBe(100);
    expect(r.leistung).toBe(49500);
  });

  it('ausreichende Summe: keine Kürzung', () => {
    const r = berechneEntschaedigung({ schaden: 20000, versicherungssumme: 400000, versicherungswert: 380000 });

    expect(r.unterversichert).toBe(false);
    expect(r.leistung).toBe(20000);
  });

  it('nie mehr als die Versicherungssumme', () => {
    const r = berechneEntschaedigung({ schaden: 500000, versicherungssumme: 300000, versicherungswert: 300000 });
    expect(r.leistung).toBe(300000);
  });

  it('der Selbstbehalt macht kleine Schäden zu null', () => {
    expect(berechneEntschaedigung({ schaden: 400, versicherungssumme: 1, versicherungswert: 0, selbstbehalt: 500 }).leistung).toBe(0);
  });

  it('leere Eingaben', () => {
    expect(berechneEntschaedigung({}).leistung).toBe(0);
  });
});
