import { describe, it, expect } from 'vitest';
import {
  gebuehrFamGKG,
  gebuehrRVG,
  verfahrenswert,
  anwaltsverguetung,
  berechneScheidungskosten,
} from '../../public/scripts/scheidungskosten.js';

// Stützwerte aus Anlage 2 FamGKG und Anlage 2 RVG (Fassung BGBl. 2025 I Nr. 109),
// https://www.gesetze-im-internet.de/famgkg/anlage_2.html und
// https://www.gesetze-im-internet.de/rvg/anlage_2.html, abgerufen am 14.09.2026.
const ANLAGE_2_FAMGKG = [
  [500, 40], [1000, 61], [1500, 82], [2000, 103], [3000, 125.5], [4000, 148],
  [5000, 170.5], [6000, 193], [7000, 215.5], [8000, 238], [9000, 260.5],
  [10000, 283], [13000, 313.5], [16000, 344], [19000, 374.5], [22000, 405],
  [25000, 435.5], [30000, 476], [35000, 516.5], [40000, 557], [45000, 597.5],
  [50000, 638], [65000, 778], [80000, 918], [95000, 1058], [110000, 1198],
  [125000, 1338], [140000, 1478], [155000, 1618], [170000, 1758],
  [185000, 1898], [200000, 2038], [230000, 2248], [260000, 2458],
  [290000, 2668], [320000, 2878], [350000, 3088], [380000, 3298],
  [410000, 3508], [440000, 3718], [470000, 3928], [500000, 4138],
];

const ANLAGE_2_RVG = [
  [500, 51.5], [2000, 176], [3000, 235.5], [9000, 592.5], [10000, 652],
  [13000, 707], [25000, 927], [50000, 1357], [65000, 1456.5],
  [200000, 2352], [230000, 2492], [500000, 3752],
];

describe('gebuehrFamGKG – § 28 Abs. 1 FamGKG', () => {
  it.each(ANLAGE_2_FAMGKG)('Verfahrenswert bis %i € → %d €', (wert, gebuehr) => {
    expect(gebuehrFamGKG(wert)).toBe(gebuehr);
  });

  it('der erste Euro über einer Stufe löst die nächste Stufe aus', () => {
    expect(gebuehrFamGKG(3001)).toBe(148);
    expect(gebuehrFamGKG(13001)).toBe(344);
  });

  it('über 500.000 € je angefangene 50.000 € weitere 210 €', () => {
    expect(gebuehrFamGKG(550000)).toBe(4348);
    expect(gebuehrFamGKG(550001)).toBe(4558);
  });
});

describe('gebuehrRVG – § 13 Abs. 1 RVG', () => {
  it.each(ANLAGE_2_RVG)('Gegenstandswert bis %i € → %d €', (wert, gebuehr) => {
    expect(gebuehrRVG(wert)).toBe(gebuehr);
  });

  it('über 500.000 € je angefangene 50.000 € weitere 175 €', () => {
    expect(gebuehrRVG(550000)).toBe(3927);
  });
});

describe('verfahrenswert – §§ 43, 44, 50 FamGKG', () => {
  it('Ehesache: Nettoeinkommen beider aus drei Monaten', () => {
    expect(verfahrenswert({ nettoMonat: 4000 }).ehesache).toBe(12000);
  });

  it('Mindestwert 3.000 € auch ohne Einkommen', () => {
    expect(verfahrenswert({ nettoMonat: 0 }).ehesache).toBe(3000);
    expect(verfahrenswert({ nettoMonat: 800 }).ehesache).toBe(3000);
  });

  it('Höchstwert 1 Million €', () => {
    expect(verfahrenswert({ nettoMonat: 500000 }).ehesache).toBe(1000000);
  });

  it('Versorgungsausgleich: 10 % je Anrecht', () => {
    const w = verfahrenswert({ nettoMonat: 4000, anrechte: 3 });
    expect(w.versorgungsausgleich).toBe(3600);
    expect(w.gesamt).toBe(15600);
  });

  it('Versorgungsausgleich: insgesamt mindestens 1.000 €', () => {
    expect(verfahrenswert({ nettoMonat: 1500, anrechte: 1 }).versorgungsausgleich).toBe(1000);
  });

  it('kein Versorgungsausgleich, kein Wert', () => {
    expect(verfahrenswert({ nettoMonat: 4000, anrechte: 0 }).versorgungsausgleich).toBe(0);
  });

  it('Kindschaftssache: 20 % der Ehesache, höchstens 5.000 €', () => {
    expect(verfahrenswert({ nettoMonat: 4000, kindschaftssachen: 1 }).kindschaft).toBe(2400);
    expect(verfahrenswert({ nettoMonat: 20000, kindschaftssachen: 1 }).kindschaft).toBe(5000);
    expect(verfahrenswert({ nettoMonat: 4000, kindschaftssachen: 2 }).kindschaft).toBe(4800);
  });
});

describe('anwaltsverguetung – VV 3100, 3104, 7002, 7008 RVG', () => {
  it('2,5 Gebühren, 20 € Pauschale, 19 % Umsatzsteuer', () => {
    // Wert 14.400 € → Stufe bis 16.000 € → volle Gebühr 762 €
    const a = anwaltsverguetung(14400);

    expect(a.verfahrensgebuehr).toBe(990.6);
    expect(a.terminsgebuehr).toBe(914.4);
    expect(a.pauschale).toBe(20);
    expect(a.netto).toBe(1925);
    expect(a.umsatzsteuer).toBe(365.75);
    expect(a.brutto).toBe(2290.75);
  });

  it('die Pauschale bleibt unter 20 %, wenn die Gebühren klein sind', () => {
    // Nur theoretisch: Wert 500 € → 51,50 € × 2,5 = 128,75 €, 20 % = 25,75 € → gedeckelt 20 €
    expect(anwaltsverguetung(500).pauschale).toBe(20);
  });
});

describe('berechneScheidungskosten – Beispiel', () => {
  it('4.000 € Netto im Monat, zwei Anrechte, ein Anwalt', () => {
    const r = berechneScheidungskosten({ nettoMonat: 4000, anrechte: 2, anwaelte: 1 });

    expect(r.verfahrenswert.gesamt).toBe(14400);
    expect(r.gericht).toBe(688);
    expect(r.anwaltGesamt).toBe(2290.75);
    expect(r.gesamt).toBe(2978.75);
  });

  it('zwei Anwälte verdoppeln nur die Anwaltskosten, nicht das Gericht', () => {
    const eins = berechneScheidungskosten({ nettoMonat: 4000, anrechte: 2, anwaelte: 1 });
    const zwei = berechneScheidungskosten({ nettoMonat: 4000, anrechte: 2, anwaelte: 2 });

    expect(zwei.gericht).toBe(eins.gericht);
    expect(zwei.anwaltGesamt).toBe(eins.anwaltGesamt * 2);
  });

  it('das Vermögen spielt für die Rechnung keine Rolle', () => {
    const r = berechneScheidungskosten({ nettoMonat: 4000, vermoegen: 900000 });
    expect(r.verfahrenswert.ehesache).toBe(12000);
  });
});
