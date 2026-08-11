import { describe, it, expect } from 'vitest';
import {
  BETRIEBSKOSTENSPIEGEL,
  BETRIEBSKOSTEN_ARTEN,
  GLASFASER_BEREITSTELLUNGSENTGELT,
  HEIZKOSTEN_VERBRAUCHSANTEIL,
  KABEL_UMLAGE_ENDE,
  abrechnungsfristEnde,
  berechneNebenkosten,
  einordnung,
  einwendungsfristEnde,
  istKabelentgeltUmlagefaehig,
  pruefeVorauszahlung,
} from '../../public/scripts/nebenkosten.js';

describe('Betriebskostenspiegel als Datengrundlage', () => {
  it('nennt Abrechnungsjahr und Veröffentlichungsdatum, damit der Stand prüfbar ist', () => {
    expect(BETRIEBSKOSTENSPIEGEL.abrechnungsjahr).toBe(2024);
    expect(BETRIEBSKOSTENSPIEGEL.veroeffentlicht).toBe('2025-12-18');
  });

  it('führt den Durchschnitt und den Wert bei voller Ausstattung getrennt', () => {
    expect(BETRIEBSKOSTENSPIEGEL.durchschnittGesamt).toBe(2.67);
    expect(BETRIEBSKOSTENSPIEGEL.alleArtenGesamt).toBe(3.68);
  });

  it('weist jede Art einer Nummer des § 2 BetrKV zu', () => {
    for (const art of BETRIEBSKOSTEN_ARTEN) {
      const nummern = Array.isArray(art.nr) ? art.nr : [art.nr];
      expect(nummern.length).toBeGreaterThan(0);
      for (const nr of nummern) {
        expect(nr).toBeGreaterThanOrEqual(1);
        expect(nr).toBeLessThanOrEqual(17);
      }
    }
  });

  it('gibt alle Richtwerte als Euro je Quadratmeter und MONAT an', () => {
    // Der eigentliche Fehler der Vorgängerversion: Monatswerte wurden noch
    // einmal durch zwölf geteilt. Kein Einzelwert kann monatlich über 3 Euro
    // je Quadratmeter liegen, wenn schon alle Arten zusammen 3,68 ergeben.
    for (const art of BETRIEBSKOSTEN_ARTEN) {
      expect(art.euroProQmMonat).toBeGreaterThan(0);
      expect(art.euroProQmMonat).toBeLessThan(3);
    }
  });

  it('nennt für Heizung und Warmwasser neben dem Durchschnitt die belegte Spitze', () => {
    const heizung = BETRIEBSKOSTEN_ARTEN.find(a => a.key === 'heizung');
    expect(heizung.euroProQmMonat).toBe(1.32);
    expect(heizung.spitze).toBe(2.18);
  });
});

describe('berechneNebenkosten', () => {
  it('rechnet 70 m² in der Größenordnung des Betriebskostenspiegels, nicht ein Zwölftel davon', () => {
    const r = berechneNebenkosten({ flaeche: 70 });
    expect(r.gesamtMonat).toBeGreaterThan(100);
    expect(r.gesamtMonat).toBeLessThan(220);
  });

  it('liefert Jahreswert als das Zwölffache des Monatswerts', () => {
    const r = berechneNebenkosten({ flaeche: 70 });
    expect(r.gesamtJahr).toBeCloseTo(r.gesamtMonat * 12, 2);
  });

  it('bleibt mit dem Quadratmeterwert unterhalb des Werts für alle Arten', () => {
    const voll = berechneNebenkosten({ flaeche: 80, aufzug: true, garten: true, hauswart: true });
    expect(voll.euroProQmMonat).toBeLessThanOrEqual(BETRIEBSKOSTENSPIEGEL.alleArtenGesamt);
  });

  it('skaliert linear mit der Wohnfläche', () => {
    const klein = berechneNebenkosten({ flaeche: 40 });
    const gross = berechneNebenkosten({ flaeche: 80 });
    expect(gross.gesamtMonat).toBeCloseTo(klein.gesamtMonat * 2, 1);
  });

  it('lässt Aufzug, Gartenpflege und Hauswart nur bei vorhandener Ausstattung einfließen', () => {
    const ohne = berechneNebenkosten({ flaeche: 70 });
    const mit = berechneNebenkosten({ flaeche: 70, aufzug: true, garten: true, hauswart: true });
    expect(ohne.positionen.some(p => p.key === 'aufzug')).toBe(false);
    expect(mit.positionen.some(p => p.key === 'aufzug')).toBe(true);
    expect(mit.gesamtMonat).toBeGreaterThan(ohne.gesamtMonat);
  });

  it('rechnet Aufzug, Garten und Hauswart mit genau ihren Richtwerten auf', () => {
    const ohne = berechneNebenkosten({ flaeche: 100 });
    const mit = berechneNebenkosten({ flaeche: 100, aufzug: true, garten: true, hauswart: true });
    const zuschlag = (0.20 + 0.15 + 0.32) * 100;
    expect(mit.gesamtMonat - ohne.gesamtMonat).toBeCloseTo(zuschlag, 2);
  });

  it('erhöht mit der Heizkostenspitze nur die Heizposition', () => {
    const schnitt = berechneNebenkosten({ flaeche: 100 });
    const spitze = berechneNebenkosten({ flaeche: 100, heizungSpitze: true });
    expect(spitze.gesamtMonat - schnitt.gesamtMonat).toBeCloseTo((2.18 - 1.32) * 100, 2);
  });

  it('summiert die ausgewiesenen Positionen exakt zur Gesamtsumme', () => {
    const r = berechneNebenkosten({ flaeche: 63, aufzug: true });
    const summe = r.positionen.reduce((s, p) => s + p.monat, 0);
    expect(r.gesamtMonat).toBeCloseTo(summe, 2);
  });

  it('lehnt eine Wohnfläche von null oder darunter ab', () => {
    expect(() => berechneNebenkosten({ flaeche: 0 })).toThrow();
    expect(() => berechneNebenkosten({ flaeche: -20 })).toThrow();
  });

  it('führt das Kabelentgelt nach dem 30. Juni 2024 nicht mehr als Position', () => {
    const r = berechneNebenkosten({ flaeche: 70 });
    expect(r.positionen.some(p => p.key === 'antenne')).toBe(false);
  });
});

describe('einordnung gegenüber dem Betriebskostenspiegel', () => {
  it('erkennt Werte unter dem Bundesdurchschnitt', () => {
    expect(einordnung(2.0).stufe).toBe('unter');
  });

  it('erkennt Werte im Bereich des Durchschnitts', () => {
    expect(einordnung(2.67).stufe).toBe('durchschnitt');
  });

  it('erkennt Werte oberhalb dessen, was bei voller Ausstattung anfällt', () => {
    expect(einordnung(4.2).stufe).toBe('ueber');
  });

  it('liefert zu jeder Stufe einen erklärenden Text', () => {
    for (const wert of [1.5, 2.67, 3.2, 5.0]) {
      expect(einordnung(wert).text.length).toBeGreaterThan(10);
    }
  });
});

describe('pruefeVorauszahlung', () => {
  it('weist eine Nachzahlung aus, wenn die Vorauszahlung unter den Kosten liegt', () => {
    const r = pruefeVorauszahlung({ flaeche: 70, vorauszahlungMonat: 100 });
    expect(r.differenzMonat).toBeGreaterThan(0);
    expect(r.nachzahlungJahr).toBeCloseTo(r.differenzMonat * 12, 2);
    expect(r.guthabenJahr).toBe(0);
  });

  it('weist ein Guthaben aus, wenn die Vorauszahlung über den Kosten liegt', () => {
    const r = pruefeVorauszahlung({ flaeche: 70, vorauszahlungMonat: 400 });
    expect(r.guthabenJahr).toBeGreaterThan(0);
    expect(r.nachzahlungJahr).toBe(0);
  });

  it('nennt die erwarteten Kosten, an denen die Vorauszahlung gemessen wird', () => {
    const r = pruefeVorauszahlung({ flaeche: 70, vorauszahlungMonat: 150 });
    const direkt = berechneNebenkosten({ flaeche: 70 });
    expect(r.erwartetMonat).toBeCloseTo(direkt.gesamtMonat, 2);
  });
});

describe('Fristen nach § 556 Abs. 3 BGB', () => {
  it('endet die Abrechnungsfrist zwölf Monate nach Ende des Abrechnungszeitraums', () => {
    expect(abrechnungsfristEnde('2025-12-31')).toBe('2026-12-31');
    expect(abrechnungsfristEnde('2025-06-30')).toBe('2026-06-30');
  });

  it('endet die Einwendungsfrist zwölf Monate nach Zugang der Abrechnung', () => {
    expect(einwendungsfristEnde('2026-03-15')).toBe('2027-03-15');
  });

  it('behandelt den 29. Februar, ohne in den März zu rutschen', () => {
    expect(abrechnungsfristEnde('2024-02-29')).toBe('2025-02-28');
  });
});

describe('Umlagefähigkeit des Kabelentgelts (§ 2 Nr. 15 BetrKV)', () => {
  it('nennt den 30. Juni 2024 als Ende des Nebenkostenprivilegs', () => {
    expect(KABEL_UMLAGE_ENDE).toBe('2024-06-30');
  });

  it('war bis zum Stichtag umlagefähig', () => {
    expect(istKabelentgeltUmlagefaehig('2024-06-30')).toBe(true);
    expect(istKabelentgeltUmlagefaehig('2023-01-01')).toBe(true);
  });

  it('ist seit dem 1. Juli 2024 nicht mehr umlagefähig', () => {
    expect(istKabelentgeltUmlagefaehig('2024-07-01')).toBe(false);
    expect(istKabelentgeltUmlagefaehig('2026-08-11')).toBe(false);
  });
});

describe('Glasfaserbereitstellungsentgelt (§ 72 TKG)', () => {
  it('deckelt das Entgelt auf 60 Euro im Jahr und 540 Euro insgesamt', () => {
    expect(GLASFASER_BEREITSTELLUNGSENTGELT.maxEuroProJahr).toBe(60);
    expect(GLASFASER_BEREITSTELLUNGSENTGELT.maxEuroGesamt).toBe(540);
  });

  it('erlaubt fünf Jahre, verlängerbar auf höchstens neun', () => {
    expect(GLASFASER_BEREITSTELLUNGSENTGELT.maxJahre).toBe(5);
    expect(GLASFASER_BEREITSTELLUNGSENTGELT.maxJahreVerlaengert).toBe(9);
  });

  it('nennt die Schwelle, ab der eine Maßnahme als aufwändig gilt', () => {
    expect(GLASFASER_BEREITSTELLUNGSENTGELT.schwelleAufwaendig).toBe(300);
  });
});

describe('Heizkostenverteilung (§ 7 Abs. 1 HeizkostenV)', () => {
  it('verlangt einen verbrauchsabhängigen Anteil zwischen 50 und 70 Prozent', () => {
    expect(HEIZKOSTEN_VERBRAUCHSANTEIL.min).toBe(0.5);
    expect(HEIZKOSTEN_VERBRAUCHSANTEIL.max).toBe(0.7);
  });
});
