import { describe, it, expect } from 'vitest';
import {
  berechneRueckstufung,
  beitragssatz,
  naechstbesser,
  rueckstufung,
  KLASSEN,
  RUECKKAUF_GRENZE_HAFTPFLICHT,
} from '../../public/scripts/kfz-versicherung.js';

// Rueckstufung nach einem Schaden: melden oder selbst zahlen?
// Beitragssaetze und Rueckstufungstabelle fuer Pkw aus den AKB 2025 der GHV
// Versicherung (Anhang 1.1 und 1.2), Neueinstufung nach I.3, Rueckkauf nach I.5.
//
// Bis September 2026 testete diese Datei ein erfundenes Schaetzmodell
// (400 € Basis, frei gewaehlte Typ-, Regional- und Altersfaktoren). Die Tests
// hielten damit genau die Zahlen fest, die keine Quelle hatten.

describe('Tabellen aus Anhang 1.1 und 1.2', () => {
  it('kennt 39 Klassen von SF 35 bis M', () => {
    expect(KLASSEN).toHaveLength(39);
    expect(KLASSEN[0]).toBe('35');
    expect(KLASSEN.slice(-4)).toEqual(['1/2', '0', 'S', 'M']);
  });

  it('liest Beitragssaetze getrennt nach Sparte', () => {
    expect(beitragssatz('haftpflicht', '35')).toBe(20);
    expect(beitragssatz('haftpflicht', '10')).toBe(37);
    expect(beitragssatz('haftpflicht', '0')).toBe(100);
    expect(beitragssatz('vollkasko', '10')).toBe(34);
    expect(beitragssatz('vollkasko', 'M')).toBe(125);
  });

  it('wirft bei unbekannter Klasse, statt still zu rechnen', () => {
    expect(() => beitragssatz('haftpflicht', '99')).toThrow();
  });

  it('kein Beitragssatz sinkt bei schlechterer Klasse', () => {
    for (const sparte of ['haftpflicht', 'vollkasko']) {
      for (let i = 1; i < KLASSEN.length; i += 1) {
        expect(beitragssatz(sparte, KLASSEN[i])).toBeGreaterThanOrEqual(beitragssatz(sparte, KLASSEN[i - 1]));
      }
    }
  });

  it('keine Rueckstufung ist besser als die Ausgangsklasse, zwei Schaeden nie besser als einer', () => {
    const pos = (k) => KLASSEN.indexOf(k);
    for (const sparte of ['haftpflicht', 'vollkasko']) {
      for (const k of KLASSEN) {
        const nachEinem = rueckstufung(sparte, k, 1);
        const nachZwei = rueckstufung(sparte, k, 2);
        expect(pos(nachEinem)).toBeGreaterThanOrEqual(k === 'M' ? pos('M') : pos(k) + 1);
        expect(pos(nachZwei)).toBeGreaterThanOrEqual(pos(nachEinem));
      }
    }
  });

  it('stuft nach der Tabelle zurueck', () => {
    expect(rueckstufung('haftpflicht', '35', 1)).toBe('20');
    expect(rueckstufung('haftpflicht', '35', 2)).toBe('8');
    expect(rueckstufung('haftpflicht', '10', 1)).toBe('4');
    expect(rueckstufung('vollkasko', '35', 1)).toBe('22');
    expect(rueckstufung('vollkasko', '3', 2)).toBe('M');
  });
});

describe('naechstbesser – Neueinstufung nach I.3.2 und I.3.4.1', () => {
  it('steigt je schadenfreiem Jahr eine Klasse', () => {
    expect(naechstbesser('10')).toBe('11');
  });

  it('bleibt in SF 35', () => {
    expect(naechstbesser('35')).toBe('35');
  });

  it('fuehrt aus SF ½, 0, S und M direkt in SF 1', () => {
    for (const k of ['1/2', '0', 'S', 'M']) expect(naechstbesser(k)).toBe('1');
  });
});

describe('berechneRueckstufung', () => {
  const BASIS = { sparte: 'haftpflicht', klasse: '10', jahresbeitrag: 500, entschaedigung: 1200 };

  it('rechnet den Beitrag zu 100 Prozent aus dem eigenen Beitrag zurueck', () => {
    const r = berechneRueckstufung(BASIS);
    expect(r.satzHeute).toBe(37);
    expect(r.beitrag100).toBe(1351.35);
  });

  it('Beispiel der Seite: SF 10 Haftpflicht, 500 € – SF 4 und 1.229,71 € in zehn Jahren', () => {
    const r = berechneRueckstufung(BASIS);
    expect(r.zielKlasse).toBe('4');
    expect(r.zeilen).toHaveLength(10);
    expect(r.zeilen[0]).toEqual({
      jahr: 1, klasseOhne: '11', satzOhne: 35, beitragOhne: 472.97,
      klasseMit: '4', satzMit: 52, beitragMit: 702.7, mehr: 229.73,
    });
    expect(r.mehrbeitrag).toBe(1229.71);
    expect(r.selbstZahlenLohnt).toBe(true);
    expect(r.eingeholtImJahr).toBeNull();
  });

  it('Melden lohnt sich, wenn die Entschaedigung den Mehrbeitrag uebersteigt', () => {
    expect(berechneRueckstufung({ ...BASIS, entschaedigung: 3000 }).selbstZahlenLohnt).toBe(false);
  });

  it('ohne Entschaedigung gibt es keine Empfehlung zum Selbstzahlen', () => {
    expect(berechneRueckstufung({ ...BASIS, entschaedigung: 0 }).selbstZahlenLohnt).toBe(false);
  });

  it('eingeholt ist der Abstand erst in derselben Klasse – SF 35 Vollkasko im 14. Jahr', () => {
    const r = berechneRueckstufung({ sparte: 'vollkasko', klasse: '35', jahresbeitrag: 400, jahre: 20 });
    expect(r.zielKlasse).toBe('22');
    expect(r.mehrbeitrag).toBe(860);
    expect(r.eingeholtImJahr).toBe(14);
  });

  it('gleicher Beitragssatz allein zaehlt nicht als eingeholt (Vollkasko SF 16/17 je 28 %)', () => {
    const r = berechneRueckstufung({ sparte: 'vollkasko', klasse: 'M', jahresbeitrag: 500, jahre: 20 });
    expect(r.zeilen.some((z) => z.mehr === 0)).toBe(true);
    expect(r.eingeholtImJahr).toBeNull();
  });

  it('Rueckkauf nach I.5 nur in der Haftpflicht und nur bis 500 €', () => {
    expect(RUECKKAUF_GRENZE_HAFTPFLICHT).toBe(500);
    expect(berechneRueckstufung({ ...BASIS, entschaedigung: 400 }).rueckkaufMoeglich).toBe(true);
    expect(berechneRueckstufung({ ...BASIS, entschaedigung: 501 }).rueckkaufMoeglich).toBe(false);
    expect(berechneRueckstufung({ ...BASIS, sparte: 'vollkasko', entschaedigung: 400 }).rueckkaufMoeglich).toBe(false);
  });
});
