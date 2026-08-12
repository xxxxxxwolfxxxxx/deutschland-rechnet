import { describe, it, expect } from 'vitest';
import { berechneImmokaufNebenkosten } from '../../public/scripts/immokauf-nebenkosten.js';

describe('berechneImmokaufNebenkosten', () => {
  it('Bayern ohne Makler: nur GEW + Notar + Grundbuch', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'by', mitMakler: false });
    expect(r.grunderwerbsteuer).toBe(14000); // 3,5%
    expect(r.maklerKaeufer).toBe(0);
    expect(r.gesamt).toBe(14000 + r.notar + r.grundbuch);
  });
  it('NRW hat 6,5% GEW', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 200000, bundesland: 'nw', mitMakler: false });
    expect(r.grunderwerbsteuer).toBe(13000);
  });
});

describe('Grunderwerbsteuersätze kommen aus grunderwerbsteuer.js', () => {
  // Das Modul führte bis 10.08.2026 eine eigene Kopie der Satztabelle, die zwei
  // Gesetzesänderungen hinterher war. Diese Tests halten die Kopplung fest.
  it('Thüringen rechnet mit 5,0 % (nicht mehr 6,5 %)', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'th', mitMakler: false });
    expect(r.gewSatz).toBe(5.0);
    expect(r.grunderwerbsteuer).toBe(20000);
  });
  it('Bremen rechnet mit 5,5 % (nicht mehr 5,0 %)', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'hb', mitMakler: false });
    expect(r.gewSatz).toBe(5.5);
    expect(r.grunderwerbsteuer).toBe(22000);
  });
});

describe('Maklerprovision (§§ 656c, 656d BGB)', () => {
  // maklerProvisionProzentJeSeite ist der Bruttosatz, den EINE Partei schuldet.
  // Marktüblich sind 3,57 % (= 3,00 % netto + 19 % USt) je Seite. Die Rechnung
  // multiplizierte diesen Bruttosatz bis 12.08.2026 erneut mit 1,19 und halbierte
  // ihn dann – effektiv 2,124 % statt 3,57 %.
  it('Käuferanteil ist der angegebene Bruttosatz, ohne zweiten USt-Aufschlag', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'by' });
    expect(r.maklerKaeufer).toBe(14280); // 3,57 % von 400.000 €
  });

  it('rechnet die 19 % USt nicht doppelt auf', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'by' });
    expect(r.maklerKaeufer).not.toBe(8494.8); // alte Formel: 3,57 % × 1,19 ÷ 2
    expect(r.maklerKaeufer).not.toBe(16993.2); // 3,57 % × 1,19
  });

  it('halbiert den Satz nicht – § 656c BGB teilt die Provision, nicht den Satz je Seite', () => {
    // Gesamtprovision 7,14 % brutto bedeutet nach § 656c Abs. 1 Satz 1 für jede
    // Partei 3,57 %; wer 7,14 % als Satz je Seite eingibt, meint 7,14 % je Seite.
    const r = berechneImmokaufNebenkosten({
      kaufpreis: 400000, bundesland: 'by', maklerProvisionProzentJeSeite: 7.14,
    });
    expect(r.maklerKaeufer).toBe(28560);
  });

  it('übernimmt abweichende Provisionssätze', () => {
    const r = berechneImmokaufNebenkosten({
      kaufpreis: 400000, bundesland: 'by', maklerProvisionProzentJeSeite: 2.975,
    });
    expect(r.maklerKaeufer).toBe(11900);
  });

  it('fließt in die Gesamtsumme ein', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'by' });
    expect(r.gesamt).toBe(
      Math.round((r.grunderwerbsteuer + r.notar + r.grundbuch + r.maklerKaeufer) * 100) / 100,
    );
  });
});

describe('Notar- und Grundbuchkosten nach GNotKG', () => {
  // Bis 12.08.2026 pauschal 1,5 % des Kaufpreises. Tatsächlich sind die Gebühren
  // Wertgebühren nach Tabelle B (§ 34 GNotKG) und damit degressiv.
  // Angesetzt: KV 21100 (2,0 Beurkundung), KV 22110 (0,5 Vollzug),
  // KV 22200 (0,5 Betreuung), zzgl. 19 % USt nach KV 32014; Grundbuch
  // KV 14150 (0,5 Auflassungsvormerkung) + KV 14110 (1,0 Eigentumsumschreibung).
  it('400.000 € Kaufpreis: 3,0 Notargebühren brutto, 1,5 Grundbuchgebühren', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'by', mitMakler: false });
    expect(r.notar).toBe(2802.45); // 3,0 × 785 € × 1,19
    expect(r.grundbuch).toBe(1177.5); // 1,5 × 785 €
  });

  it('200.000 € Kaufpreis', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 200000, bundesland: 'by', mitMakler: false });
    expect(r.notar).toBe(1552.95); // 3,0 × 435 € × 1,19
    expect(r.grundbuch).toBe(652.5); // 1,5 × 435 €
  });

  it('Grundbuchgebühren tragen keine Umsatzsteuer (Gerichtsgebühren)', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 1000000, bundesland: 'by', mitMakler: false });
    expect(r.grundbuch).toBe(2602.5); // 1,5 × 1.735 €, ohne USt
    expect(r.notar).toBe(6193.95); // 3,0 × 1.735 € × 1,19
  });

  it('ist degressiv: höherer Kaufpreis, kleinerer Prozentsatz', () => {
    const klein = berechneImmokaufNebenkosten({ kaufpreis: 200000, bundesland: 'by', mitMakler: false });
    const gross = berechneImmokaufNebenkosten({ kaufpreis: 1000000, bundesland: 'by', mitMakler: false });
    const anteil = (r, kaufpreis) => (r.notar + r.grundbuch) / kaufpreis;
    expect(anteil(gross, 1000000)).toBeLessThan(anteil(klein, 200000));
  });

  it('liegt deutlich unter der alten Pauschale von 1,5 %', () => {
    const r = berechneImmokaufNebenkosten({ kaufpreis: 400000, bundesland: 'by', mitMakler: false });
    expect(r.notar + r.grundbuch).toBeLessThan(400000 * 0.015);
  });

  it('beachtet die Mindestgebühr von 120 € für KV 21100', () => {
    // 5.000 € Geschäftswert: Tabelle B = 45 €, die 2,0-Gebühr wäre 90 €.
    const r = berechneImmokaufNebenkosten({ kaufpreis: 5000, bundesland: 'by', mitMakler: false });
    expect(r.notar).toBe(196.35); // (120 + 22,50 + 22,50) × 1,19
    expect(r.grundbuch).toBe(67.5); // 1,5 × 45 €
  });
});
