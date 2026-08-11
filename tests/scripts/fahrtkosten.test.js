import { describe, it, expect } from 'vitest';
import {
  berechnefahrtkosten,
  ENTFERNUNGSPAUSCHALE_JE_KM,
  ENTFERNUNGSPAUSCHALE_HOECHSTBETRAG,
} from '../../public/scripts/fahrtkosten.js';

// Bis zum 11.08.2026 rechnete das Modul mit der Staffelung 0,30 € für die
// ersten 20 km und 0,38 € ab dem 21. Diese Staffelung steht seit 2026 nicht
// mehr in § 9 Abs. 1 Satz 3 Nr. 4 EStG – es gilt ein einheitlicher Satz von
// 0,38 € ab dem ersten Kilometer.
describe('Entfernungspauschale', () => {
  it('beträgt 0,38 € je vollem Entfernungskilometer', () => {
    expect(ENTFERNUNGSPAUSCHALE_JE_KM).toBe(0.38);
  });

  it('Höchstbetrag 4.500 € im Kalenderjahr', () => {
    expect(ENTFERNUNGSPAUSCHALE_HOECHSTBETRAG).toBe(4500);
  });

  it('20 km ergeben 7,60 € am Tag, nicht 6,00 €', () => {
    expect(berechnefahrtkosten({ entfernungKm: 20 }).pauschaleTaeglich).toBe(7.6);
  });

  it('30 km ergeben 11,40 € am Tag, nicht 9,80 €', () => {
    expect(berechnefahrtkosten({ entfernungKm: 30 }).pauschaleTaeglich).toBe(11.4);
  });

  it('kennt keinen Knick bei 20 Kilometern', () => {
    const je = (km) => berechnefahrtkosten({ entfernungKm: km }).pauschaleTaeglich / km;
    expect(je(10)).toBeCloseTo(je(40), 6);
  });

  it('rechnet nur volle Kilometer', () => {
    expect(berechnefahrtkosten({ entfernungKm: 20.9 }).pauschaleTaeglich).toBe(7.6);
  });

  it('Jahresabzug ist täglicher Betrag mal Arbeitstage', () => {
    const r = berechnefahrtkosten({ entfernungKm: 20, arbeitstageProJahr: 220 });
    expect(r.jahresabzug).toBeCloseTo(7.6 * 220, 2);
  });

  it('deckelt ohne eigenen Pkw bei 4.500 €', () => {
    const r = berechnefahrtkosten({ entfernungKm: 100, arbeitstageProJahr: 220, eigenerPkw: false });
    expect(r.jahresabzug).toBe(ENTFERNUNGSPAUSCHALE_HOECHSTBETRAG);
    expect(r.gedeckelt).toBe(true);
    expect(r.jahresabzugVorDeckelung).toBeGreaterThan(ENTFERNUNGSPAUSCHALE_HOECHSTBETRAG);
  });

  it('deckelt mit eigenem Pkw nicht', () => {
    const r = berechnefahrtkosten({ entfernungKm: 100, arbeitstageProJahr: 220, eigenerPkw: true });
    expect(r.jahresabzug).toBeGreaterThan(ENTFERNUNGSPAUSCHALE_HOECHSTBETRAG);
    expect(r.gedeckelt).toBe(false);
  });

  it('kommt mit 0 km zurecht', () => {
    expect(berechnefahrtkosten({ entfernungKm: 0 }).jahresabzug).toBe(0);
  });
});
