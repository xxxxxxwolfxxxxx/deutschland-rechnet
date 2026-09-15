import { describe, it, expect } from 'vitest';
import { darlehenAusRate, kaufpreisAusBudget, berechneWieVielHaus } from '../../public/scripts/wie-viel-haus.js';
import { berechneImmokaufNebenkosten } from '../../public/scripts/immokauf-nebenkosten.js';
import { annuitaetenrate } from '../../public/scripts/annuitaet.js';

const basis = {
  rate: 1500, eigenkapital: 80000, sollzins: 3.5, tilgung: 2, zinsbindung: 15,
  bundesland: 'nw', mitMakler: false,
};

describe('darlehenAusRate', () => {
  it('teilt die Jahresrate durch Sollzins plus anfängliche Tilgung', () => {
    // 1.500 × 12 ÷ 5,5 % = 327.272,72 → abgerundet
    expect(darlehenAusRate({ rate: 1500, sollzins: 3.5, tilgung: 2 })).toBe(327272);
  });

  it('liefert ohne Zins und Tilgung kein Darlehen', () => {
    expect(darlehenAusRate({ rate: 1500, sollzins: 0, tilgung: 0 })).toBe(0);
  });
});

describe('kaufpreisAusBudget', () => {
  it('lässt Kaufpreis und Nebenkosten zusammen im Budget', () => {
    const { kaufpreis, nebenkosten } = kaufpreisAusBudget({ budget: 400000, bundesland: 'nw', mitMakler: true });
    expect(kaufpreis + nebenkosten.gesamt).toBeLessThanOrEqual(400000);
    // Ein Euro mehr Kaufpreis würde das Budget sprengen.
    const naechster = berechneImmokaufNebenkosten({ kaufpreis: kaufpreis + 10, bundesland: 'nw', mitMakler: true }).gesamt;
    expect(kaufpreis + 10 + naechster).toBeGreaterThan(400000);
  });

  it('gibt in Bayern mehr Kaufpreis her als in Nordrhein-Westfalen', () => {
    const by = kaufpreisAusBudget({ budget: 400000, bundesland: 'by' });
    const nw = kaufpreisAusBudget({ budget: 400000, bundesland: 'nw' });
    expect(by.nebenkosten.gewSatz).toBe(3.5);
    expect(nw.nebenkosten.gewSatz).toBe(6.5);
    expect(by.kaufpreis).toBeGreaterThan(nw.kaufpreis);
  });
});

describe('berechneWieVielHaus', () => {
  it('verwendet die eingegebene Tilgung statt fester 2 %', () => {
    const zwei = berechneWieVielHaus(basis);
    const drei = berechneWieVielHaus({ ...basis, tilgung: 3 });
    expect(drei.darlehen).toBeLessThan(zwei.darlehen);
    expect(drei.laufzeitJahre).toBeLessThan(zwei.laufzeitJahre);
  });

  it('weist die Restschuld nach der Zinsbindung aus', () => {
    const r = berechneWieVielHaus(basis);
    // Bei 3,5 % Zins und 2 % Tilgung sind nach 15 Jahren rund 39 % getilgt.
    expect(r.restschuld / r.darlehen).toBeGreaterThan(0.6);
    expect(r.restschuld / r.darlehen).toBeLessThan(0.62);
    expect(r.zinsenBindung).toBeGreaterThan(0);
  });

  it('ergibt beim gleichen Anschlusszins wieder die ursprüngliche Rate', () => {
    // Bis auf wenige Euro: Die Restlaufzeit zählt ganze Monate, die letzte
    // Rate des ursprünglichen Plans ist aber nur eine Teilrate.
    const r = berechneWieVielHaus(basis);
    expect(Math.abs(r.anschlussrate - basis.rate) / basis.rate).toBeLessThan(0.005);
  });

  it('erhöht die Anschlussrate bei höherem Anschlusszins', () => {
    const r = berechneWieVielHaus({ ...basis, anschlusszins: 5.5 });
    const laufzeitRest = Math.round(r.laufzeitJahre * 12) - 180;
    expect(r.anschlussrate).toBeGreaterThan(basis.rate);
    expect(r.anschlussrate).toBeCloseTo(annuitaetenrate({ betrag: r.restschuld, sollzins: 5.5, monate: laufzeitRest }), -1);
  });

  it('meldet keine Restschuld, wenn das Darlehen vor Ende der Bindung getilgt ist', () => {
    const r = berechneWieVielHaus({ ...basis, tilgung: 10, zinsbindung: 20 });
    expect(r.restschuld).toBe(0);
    expect(r.anschlussrate).toBe(0);
  });

  it('rechnet die Haushaltsrechnung nur mit Einkommen', () => {
    expect(berechneWieVielHaus(basis).haushalt).toBeNull();
    const h = berechneWieVielHaus({ ...basis, einkommen: 5000, ausgaben: 2200 }).haushalt;
    expect(h).toEqual({ frei: 2800, nachRate: 1300, rateAnteilEinkommen: 30 });
  });
});
