import { describe, it, expect } from 'vitest';
import { berechneKfzVersicherung } from '../../public/scripts/kfz-versicherung.js';

// Schätzmodell für den Jahresbeitrag. Versicherer kalkulieren mit eigenen,
// nicht veröffentlichten Tarifmerkmalen; die Typ-, Schadenfreiheits-,
// Regional- und Altersfaktoren hier sind Näherungen der Größenordnung. Der
// Rechner ersetzt kein Angebot, sondern zeigt, wie stark die Merkmale wirken.
//
// Bis zum 14.08.2026 stand im Modul zusätzlich eine Tabelle
// VERSICHERUNG_FAKTOR, deren Wert in eine Variable gelesen, aber nie
// verwendet wurde. Der Kaskoanteil kam schon damals aus eigenen Faktoren.

const BASIS = { typ: 'compact', sf: '3', region: 2, versicherung: 'haftpflicht', alter: 40 };

describe('berechneKfzVersicherung – Haftpflicht', () => {
  it('Grundfall: 400 € Basis × 0,6 ergibt 240 € Haftpflicht', () => {
    const r = berechneKfzVersicherung(BASIS);

    expect(r.haftpflicht).toBe(240);
    expect(r.kasko).toBe(0);
    expect(r.beitrag).toBe(240);
  });
});

describe('berechneKfzVersicherung – Kasko', () => {
  it('Teilkasko schlägt 160 € auf', () => {
    const r = berechneKfzVersicherung({ ...BASIS, versicherung: 'teilkasko' });

    expect(r.kasko).toBe(160);
    expect(r.beitrag).toBe(400);
  });

  it('Vollkasko schlägt 560 € auf', () => {
    const r = berechneKfzVersicherung({ ...BASIS, versicherung: 'vollkasko' });

    expect(r.kasko).toBe(560);
    expect(r.beitrag).toBe(800);
  });

  it('Vollkasko kostet mehr als Teilkasko, Teilkasko mehr als Haftpflicht', () => {
    const haftpflicht = berechneKfzVersicherung({ ...BASIS, versicherung: 'haftpflicht' }).beitrag;
    const teilkasko = berechneKfzVersicherung({ ...BASIS, versicherung: 'teilkasko' }).beitrag;
    const vollkasko = berechneKfzVersicherung({ ...BASIS, versicherung: 'vollkasko' }).beitrag;

    expect(teilkasko).toBeGreaterThan(haftpflicht);
    expect(vollkasko).toBeGreaterThan(teilkasko);
  });
});

describe('berechneKfzVersicherung – Schadenfreiheitsklasse', () => {
  it('der Fahranfänger ohne SF-Klasse zahlt das Zweieinhalbfache von SF 3', () => {
    const sf0 = berechneKfzVersicherung({ ...BASIS, sf: '0' }).beitrag;
    const sf3 = berechneKfzVersicherung({ ...BASIS, sf: '3' }).beitrag;

    expect(sf0).toBe(sf3 * 2.5);
  });

  it('der Beitrag sinkt mit jeder SF-Klasse', () => {
    const beitraege = ['0', '1/2', '1', '2', '3', '4', '5', '6+'].map(
      (sf) => berechneKfzVersicherung({ ...BASIS, sf }).beitrag,
    );

    for (let i = 1; i < beitraege.length; i++) {
      expect(beitraege[i]).toBeLessThan(beitraege[i - 1]);
    }
  });

  it('unbekannte SF-Klasse rechnet wie SF 3', () => {
    expect(berechneKfzVersicherung({ ...BASIS, sf: '12' }).beitrag).toBe(
      berechneKfzVersicherung({ ...BASIS, sf: '3' }).beitrag,
    );
  });
});

describe('berechneKfzVersicherung – Fahrzeugtyp', () => {
  it('der Kleinwagen ist günstiger, die Oberklasse teurer als der Kompaktwagen', () => {
    const klein = berechneKfzVersicherung({ ...BASIS, typ: 'small' }).beitrag;
    const kompakt = berechneKfzVersicherung({ ...BASIS, typ: 'compact' }).beitrag;
    const gross = berechneKfzVersicherung({ ...BASIS, typ: 'large' }).beitrag;

    expect(klein).toBeLessThan(kompakt);
    expect(gross).toBeGreaterThan(kompakt);
  });

  it('das Elektroauto liegt unter dem Kompaktwagen', () => {
    expect(berechneKfzVersicherung({ ...BASIS, typ: 'ev' }).beitrag).toBeLessThan(
      berechneKfzVersicherung({ ...BASIS, typ: 'compact' }).beitrag,
    );
  });

  it('unbekannter Typ rechnet neutral', () => {
    expect(berechneKfzVersicherung({ ...BASIS, typ: 'oldtimer' }).beitrag).toBe(
      berechneKfzVersicherung({ ...BASIS, typ: 'compact' }).beitrag,
    );
  });
});

describe('berechneKfzVersicherung – Region und Alter', () => {
  it('die Regionalklasse spreizt den Beitrag von 0,8 bis 1,6', () => {
    const region1 = berechneKfzVersicherung({ ...BASIS, region: 1 }).beitrag;
    const region5 = berechneKfzVersicherung({ ...BASIS, region: 5 }).beitrag;

    expect(region1).toBe(192);
    expect(region5).toBe(384);
  });

  it('unter 25 Jahren kostet der Beitrag 80 % mehr', () => {
    const jung = berechneKfzVersicherung({ ...BASIS, alter: 21 }).beitrag;

    expect(jung).toBe(432);
  });

  it('zwischen 25 und 34 Jahren bleiben 10 % Aufschlag', () => {
    expect(berechneKfzVersicherung({ ...BASIS, alter: 30 }).beitrag).toBe(264);
  });

  it('ab 35 Jahren entfällt der Altersaufschlag', () => {
    const alter35 = berechneKfzVersicherung({ ...BASIS, alter: 35 }).beitrag;
    const alter60 = berechneKfzVersicherung({ ...BASIS, alter: 60 }).beitrag;

    expect(alter35).toBe(240);
    expect(alter60).toBe(240);
  });

  it('der Altersaufschlag wirkt auch auf den Kaskoanteil', () => {
    const jung = berechneKfzVersicherung({ ...BASIS, alter: 21, versicherung: 'vollkasko' });

    expect(jung.beitrag).toBe(800 * 1.8);
  });
});
