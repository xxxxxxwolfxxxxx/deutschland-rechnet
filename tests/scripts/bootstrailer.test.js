import { describe, it, expect } from 'vitest';
import {
  berechneBootstrailer,
  pruefeTempo100,
  TEMPO100_FAKTOREN,
} from '../../public/scripts/bootstrailer.js';

describe('Fahrerlaubnisklasse – § 6 FeV, Zugfahrzeug bis 3,5 t', () => {
  it('erlaubt Anhänger bis 750 kg ohne Rücksicht auf die Kombination', () => {
    // 3.500 + 750 = 4.250 kg Kombination, trotzdem Klasse B: die 750-kg-Regel
    // des § 6 Abs. 1 steht unabhängig neben der Kombinationsgrenze.
    const r = berechneBootstrailer({ zugfahrzeugKg: 3500, anhaengerKg: 750 });
    expect(r.klasse).toBe('B');
    expect(r.kombinationKg).toBe(4250);
    expect(r.spielraumAnhaengerKg).toBe(0);
    expect(r.spielraumKombinationKg).toBe(null);
  });

  it('bleibt bei schwererem Anhänger B, solange die Kombination 3.500 kg hält', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2100, anhaengerKg: 1300 });
    expect(r.klasse).toBe('B');
    expect(r.kombinationKg).toBe(3400);
    expect(r.spielraumKombinationKg).toBe(100);
    expect(r.spielraumAnhaengerKg).toBe(100);
  });

  it('rechnet genau 3.500 kg noch als B', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2200, anhaengerKg: 1300 });
    expect(r.klasse).toBe('B');
    expect(r.spielraumKombinationKg).toBe(0);
  });

  it('verlangt zwischen 3.500 und 4.250 kg die Schlüsselzahl 96', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2500, anhaengerKg: 1300 });
    expect(r.klasse).toBe('B96');
    expect(r.erlaubtMitB).toBe(false);
    expect(r.spielraumKombinationKg).toBe(450);
  });

  it('verlangt über 4.250 kg die Klasse BE', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2500, anhaengerKg: 2000 });
    expect(r.klasse).toBe('BE');
    expect(r.kombinationKg).toBe(4500);
  });

  it('kennt bei BE keine Kombinationsgrenze, wohl aber die Anhängergrenze', () => {
    // BE begrenzt nur den Anhänger auf 3.500 kg; die Kombination darf bis
    // 7.000 kg wiegen. Der Spielraum liegt also beim Anhänger, nicht bei der
    // Summe.
    const r = berechneBootstrailer({ zugfahrzeugKg: 2000, anhaengerKg: 3000 });
    expect(r.klasse).toBe('BE');
    expect(r.spielraumKombinationKg).toBe(null);
    expect(r.spielraumAnhaengerKg).toBe(500);
  });
});

describe('Fahrerlaubnisklasse – Anhänger über 3,5 t und schwere Zugfahrzeuge', () => {
  it('verlangt bei Anhänger über 3.500 kg die Klasse C1E', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 3000, anhaengerKg: 4000 });
    expect(r.klasse).toBe('C1E');
    expect(r.erlaubtMitB).toBe(false);
  });

  it('kennt die 12-Tonnen-Grenze der Klasse C1E', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 3000, anhaengerKg: 10000 });
    expect(r.kombinationKg).toBe(13000);
    expect(r.klasse).toBe('CE');
    expect(r.hinweise.join(' ')).toContain('12.000');
  });

  it('reicht bei schwerem Zugfahrzeug und leichtem Anhänger die Klasse C1', () => {
    // C1 schließt Anhänger bis 750 kg ein – C1E ist dafür nicht nötig.
    const r = berechneBootstrailer({ zugfahrzeugKg: 4000, anhaengerKg: 700 });
    expect(r.klasse).toBe('C1');
  });

  it('verlangt bei schwerem Zugfahrzeug und Anhänger über 750 kg C1E', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 4000, anhaengerKg: 1000 });
    expect(r.klasse).toBe('C1E');
  });

  it('geht über 7,5 t Zugfahrzeug in die Klasse C beziehungsweise CE', () => {
    expect(berechneBootstrailer({ zugfahrzeugKg: 8000, anhaengerKg: 700 }).klasse).toBe('C');
    expect(berechneBootstrailer({ zugfahrzeugKg: 8000, anhaengerKg: 1000 }).klasse).toBe('CE');
  });
});

describe('Technische Grenzen neben der Fahrerlaubnis', () => {
  it('meldet eine überschrittene Anhängelast, obwohl die Klasse passt', () => {
    // Feld O.1 der Zulassungsbescheinigung. Klasse B genügt, das Fahrzeug darf
    // den Trailer trotzdem nicht ziehen.
    const r = berechneBootstrailer({
      zugfahrzeugKg: 2100, anhaengerKg: 1300, anhaengelastKg: 1200,
    });
    expect(r.klasse).toBe('B');
    expect(r.anhaengelastUeberschritten).toBe(true);
    expect(r.hinweise.join(' ')).toContain('Anhängelast');
  });

  it('meldet eine überschrittene zulässige Masse der Kombination', () => {
    // Feld F.3 liegt oft unter der Summe aus F.1 und Anhänger-zGM.
    const r = berechneBootstrailer({
      zugfahrzeugKg: 2100, anhaengerKg: 1300, kombinationMaxKg: 3300,
    });
    expect(r.kombinationUeberschritten).toBe(true);
  });

  it('leitet die technisch mögliche Anhängermasse aus beiden Grenzen ab', () => {
    const r = berechneBootstrailer({
      zugfahrzeugKg: 2100, anhaengerKg: 1300, anhaengelastKg: 1500, kombinationMaxKg: 3400,
    });
    expect(r.maxAnhaengerTechnischKg).toBe(1300); // 3.400 − 2.100 ist strenger als 1.500
    expect(r.anhaengelastUeberschritten).toBe(false);
    expect(r.kombinationUeberschritten).toBe(false);
  });

  it('lässt die technische Prüfung weg, wenn keine Werte vorliegen', () => {
    const r = berechneBootstrailer({ zugfahrzeugKg: 2100, anhaengerKg: 1300 });
    expect(r.maxAnhaengerTechnischKg).toBe(null);
    expect(r.anhaengelastUeberschritten).toBe(false);
  });
});

describe('Tempo 100 – Neunte Verordnung über Ausnahmen von den Vorschriften der StVO', () => {
  it('kennt die Faktoren des § 1 Nr. 1', () => {
    expect(TEMPO100_FAKTOREN.ohneDaempfer).toBe(0.3);
    expect(TEMPO100_FAKTOREN.wohnanhaenger).toBe(0.8);
    expect(TEMPO100_FAKTOREN.wohnanhaengerStabilisiert).toBe(1.0);
    expect(TEMPO100_FAKTOREN.sonstiger).toBe(1.1);
    expect(TEMPO100_FAKTOREN.sonstigerStabilisiert).toBe(1.2);
  });

  it('bezieht den Faktor auf die LEERMASSE des Zugfahrzeugs', () => {
    // 1.600 kg Leermasse x 1,1 = 1.760 kg, gekappt auf die Anhängelast 1.500 kg
    const r = pruefeTempo100({
      anhaengerKg: 1300, leermasseZugfahrzeugKg: 1600, zugfahrzeugKg: 2100,
      anhaengelastKg: 1500, schwingungsdaempfer: true,
    });
    expect(r.faktor).toBe(1.1);
    expect(r.maxAnhaengerKg).toBe(1500);
    expect(r.zulaessig).toBe(true);
  });

  it('fällt ohne hydraulische Schwingungsdämpfer auf den Faktor 0,3', () => {
    const r = pruefeTempo100({
      anhaengerKg: 1300, leermasseZugfahrzeugKg: 1600, zugfahrzeugKg: 2100,
      anhaengelastKg: 1500, schwingungsdaempfer: false,
    });
    expect(r.faktor).toBe(0.3);
    expect(r.maxAnhaengerKg).toBe(480);
    expect(r.zulaessig).toBe(false);
  });

  it('hebt den Faktor mit Stabilisierungseinrichtung auf 1,2', () => {
    const r = pruefeTempo100({
      anhaengerKg: 1300, leermasseZugfahrzeugKg: 1000, zugfahrzeugKg: 2100,
      anhaengelastKg: 1500, schwingungsdaempfer: true, stabilisierung: true,
    });
    expect(r.faktor).toBe(1.2);
    expect(r.maxAnhaengerKg).toBe(1200); // 1.000 x 1,2, unter beiden Obergrenzen
    expect(r.zulaessig).toBe(false);
  });

  it('deckelt beim kleineren Wert aus zGM des Zugfahrzeugs und Anhängelast', () => {
    const r = pruefeTempo100({
      anhaengerKg: 1300, leermasseZugfahrzeugKg: 2000, zugfahrzeugKg: 1800,
      anhaengelastKg: 2500, schwingungsdaempfer: true,
    });
    expect(r.maxAnhaengerKg).toBe(1800); // zGM Zugfahrzeug ist strenger
  });

  it('rechnet Wohnanhänger mit 0,8 und ohne die Obergrenzen des Buchstaben c', () => {
    const r = pruefeTempo100({
      anhaengerKg: 1300, leermasseZugfahrzeugKg: 1600, zugfahrzeugKg: 2100,
      anhaengelastKg: 1500, schwingungsdaempfer: true, anhaengerart: 'wohnanhaenger',
    });
    expect(r.faktor).toBe(0.8);
    expect(r.maxAnhaengerKg).toBe(1280);
  });

  it('hebt den Wohnanhänger mit Stabilisierungseinrichtung auf 1,0', () => {
    const r = pruefeTempo100({
      anhaengerKg: 1300, leermasseZugfahrzeugKg: 1600, zugfahrzeugKg: 2100,
      anhaengelastKg: 1500, schwingungsdaempfer: true, stabilisierung: true,
      anhaengerart: 'wohnanhaenger',
    });
    expect(r.faktor).toBe(1);
    expect(r.maxAnhaengerKg).toBe(1600);
  });

  it('nennt die Voraussetzungen, die sich nicht rechnen lassen', () => {
    const r = pruefeTempo100({
      anhaengerKg: 1000, leermasseZugfahrzeugKg: 1600, zugfahrzeugKg: 2100,
      anhaengelastKg: 1500, schwingungsdaempfer: true,
    });
    const alle = r.voraussetzungen.join(' ');
    expect(alle).toContain('Blockierverhinderer');
    expect(alle).toContain('sechs Jahre');
    expect(alle).toContain('Plakette');
  });

  it('weist darauf hin, dass 100 km/h nur auf Autobahn und Kraftfahrstraße gelten', () => {
    const r = pruefeTempo100({
      anhaengerKg: 1000, leermasseZugfahrzeugKg: 1600, zugfahrzeugKg: 2100,
      anhaengelastKg: 1500, schwingungsdaempfer: true,
    });
    expect(r.geltungsbereich).toContain('Kraftfahrstraßen');
  });

  it('verlangt eine Leermasse als Bezugsgröße', () => {
    expect(() => pruefeTempo100({ anhaengerKg: 1000, leermasseZugfahrzeugKg: 0 }))
      .toThrow(/Leermasse/);
  });
});
