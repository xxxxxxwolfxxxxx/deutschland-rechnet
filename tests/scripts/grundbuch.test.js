import { describe, it, expect } from 'vitest';
import { berechneGrundbuchkosten, EINTRAGUNGSARTEN } from '../../public/scripts/grundbuch.js';

// Der Rechner rechnete bis 12.08.2026 mit festen Prozentsätzen
// (1 % Notar + 0,5 % Grundbuch + 20 € Beglaubigung) und widersprach damit
// dem eigenen Fließtext. Die Gebühren stehen im Kostenverzeichnis (Anlage 1
// GNotKG) und sind Wertgebühren nach Tabelle B (Anlage 2 GNotKG).

describe('EINTRAGUNGSARTEN', () => {
  it('bildet die Positionen des Kostenverzeichnisses ab', () => {
    expect(EINTRAGUNGSARTEN.eigentuemer.grundbuch).toMatchObject({ kv: '14110', satz: 1.0 });
    expect(EINTRAGUNGSARTEN.auflassungsvormerkung.grundbuch).toMatchObject({ kv: '14150', satz: 0.5 });
    expect(EINTRAGUNGSARTEN.grundschuldBuch.grundbuch).toMatchObject({ kv: '14121', satz: 1.0 });
    expect(EINTRAGUNGSARTEN.grundschuldBrief.grundbuch).toMatchObject({ kv: '14120', satz: 1.3 });
    expect(EINTRAGUNGSARTEN.loeschungVormerkung.grundbuch).toMatchObject({ kv: '14152', festbetrag: 25 });
  });
});

describe('berechneGrundbuchkosten – Eintragung des Eigentümers', () => {
  // Kaufpreis 400 000 € → Tabelle B: 785,00 €
  const r = berechneGrundbuchkosten({ geschaeftswert: 400000, art: 'eigentuemer' });

  it('Grundbuchgebühr ist eine volle 1,0-Gebühr (KV 14110)', () => {
    expect(r.grundbuch.betrag).toBe(785);
    expect(r.grundbuch.kv).toBe('14110');
  });
  it('Notargebühr ist das 2,0-Beurkundungsverfahren (KV 21100)', () => {
    expect(r.notar.betrag).toBe(1570);
    expect(r.notar.kv).toBe('21100');
  });
  it('19 % Umsatzsteuer nur auf die Notargebühr (KV 32014)', () => {
    expect(r.umsatzsteuer).toBe(298.3);
  });
  it('Gesamt = Grundbuch + Notar + USt', () => {
    expect(r.gesamt).toBe(2653.3);
  });
});

describe('berechneGrundbuchkosten – Grundschuld', () => {
  it('Buchgrundschuld: KV 14121 mit 1,0, Notar KV 21200 mit 1,0', () => {
    const r = berechneGrundbuchkosten({ geschaeftswert: 200000, art: 'grundschuldBuch' });
    expect(r.grundbuch.betrag).toBe(435);
    expect(r.notar.betrag).toBe(435);
    expect(r.umsatzsteuer).toBe(82.65);
    expect(r.gesamt).toBe(952.65);
  });
  it('Briefgrundschuld kostet mehr: KV 14120 mit 1,3', () => {
    const r = berechneGrundbuchkosten({ geschaeftswert: 200000, art: 'grundschuldBrief' });
    expect(r.grundbuch.betrag).toBe(565.5);
    expect(r.notar.betrag).toBe(435);
    expect(r.gesamt).toBe(1083.15);
  });
  it('Geschäftswert ist der Nennbetrag der Schuld (§ 53 Abs. 1 GNotKG)', () => {
    expect(EINTRAGUNGSARTEN.grundschuldBuch.wertGrundlage).toContain('§ 53');
  });
});

describe('berechneGrundbuchkosten – Vormerkung', () => {
  it('Eintragung: halbe Gebühr nach KV 14150', () => {
    const r = berechneGrundbuchkosten({ geschaeftswert: 400000, art: 'auflassungsvormerkung' });
    expect(r.grundbuch.betrag).toBe(392.5);
    expect(r.notar.betrag).toBe(392.5); // KV 21201, 0,5
    expect(r.umsatzsteuer).toBe(74.58);
    expect(r.gesamt).toBe(859.58);
  });
  it('Löschung: Festgebühr 25 € nach KV 14152, unabhängig vom Wert', () => {
    const klein = berechneGrundbuchkosten({ geschaeftswert: 50000, art: 'loeschungVormerkung' });
    const gross = berechneGrundbuchkosten({ geschaeftswert: 2000000, art: 'loeschungVormerkung' });
    expect(klein.grundbuch.betrag).toBe(25);
    expect(gross.grundbuch.betrag).toBe(25);
  });
  it('Löschung: Beglaubigung nach KV 25100 ist bei 70 € gedeckelt', () => {
    const r = berechneGrundbuchkosten({ geschaeftswert: 400000, art: 'loeschungVormerkung' });
    expect(r.notar.betrag).toBe(70); // 0,2 × 785 € = 157 € → gedeckelt
    expect(r.umsatzsteuer).toBe(13.3);
    expect(r.gesamt).toBe(108.3);
  });
});

describe('berechneGrundbuchkosten – Grundbuchgebühren sind umsatzsteuerfrei', () => {
  it('die USt bemisst sich allein an der Notargebühr', () => {
    const r = berechneGrundbuchkosten({ geschaeftswert: 300000, art: 'grundschuldBuch' });
    expect(r.umsatzsteuer).toBe(Math.round(r.notar.betrag * 0.19 * 100) / 100);
    expect(r.gesamt).toBe(r.grundbuch.betrag + r.notar.betrag + r.umsatzsteuer);
  });
});

describe('berechneGrundbuchkosten – Degression', () => {
  // Der Fließtext der Seite behauptete "typischerweise 1-2 % des Kaufpreises".
  // Nach dem Kostenverzeichnis liegt der Anteil deutlich darunter und sinkt
  // mit steigendem Geschäftswert – genau das sagt der übrige Text auch.
  it('der Anteil am Geschäftswert sinkt mit steigendem Wert', () => {
    const werte = [100000, 400000, 1000000, 3000000];
    // gesamtProzent ist für die Anzeige auf eine Nachkommastelle gerundet und
    // zu grob für den Vergleich – hier zählt das ungerundete Verhältnis.
    const anteile = werte.map(w => {
      const r = berechneGrundbuchkosten({ geschaeftswert: w, art: 'eigentuemer' });
      return r.gesamt / r.geschaeftswert;
    });
    for (let i = 1; i < anteile.length; i++) {
      expect(anteile[i]).toBeLessThan(anteile[i - 1]);
    }
  });
  it('bleibt auch bei kleinen Kaufpreisen unter 2 %', () => {
    expect(berechneGrundbuchkosten({ geschaeftswert: 100000, art: 'eigentuemer' }).gesamtProzent).toBeLessThan(2);
  });
  it('liegt bei 400 000 € Kaufpreis unter 1 %', () => {
    expect(berechneGrundbuchkosten({ geschaeftswert: 400000, art: 'eigentuemer' }).gesamtProzent).toBeLessThan(1);
  });
});

describe('berechneGrundbuchkosten – Eingaben', () => {
  it('unbekannte Eintragungsart fällt auf die Eigentümereintragung zurück', () => {
    const r = berechneGrundbuchkosten({ geschaeftswert: 400000, art: 'gibtesnicht' });
    expect(r.art).toBe('eigentuemer');
  });
  it('fehlender Geschäftswert ergibt die Mindestgebühren, nicht NaN', () => {
    const r = berechneGrundbuchkosten({ geschaeftswert: undefined, art: 'grundschuldBuch' });
    expect(r.grundbuch.betrag).toBe(15); // § 34 Abs. 5
    expect(r.notar.betrag).toBe(60); // KV 21200, mindestens 60 €
    expect(Number.isFinite(r.gesamt)).toBe(true);
  });
  it('Geschäftswert 0 ergibt keinen Prozentsatz statt Infinity', () => {
    const r = berechneGrundbuchkosten({ geschaeftswert: 0, art: 'eigentuemer' });
    expect(r.gesamtProzent).toBe(null);
  });
});
