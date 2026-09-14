import { describe, it, expect } from 'vitest';
import { FESTZUSCHUSS_ANTEIL, festzuschussUmrechnen, berechneZahnersatz } from '../../public/scripts/zahnersatz.js';

describe('Festzuschuss – § 55 Abs. 1 SGB V', () => {
  it('60, 70 und 75 Prozent der Regelversorgung', () => {
    expect(FESTZUSCHUSS_ANTEIL).toEqual({ ohneBonus: 0.6, bonus5Jahre: 0.7, bonus10Jahre: 0.75 });
  });

  it('rechnet zwischen Bonusstufen um', () => {
    expect(festzuschussUmrechnen(600, 'ohneBonus', 'bonus10Jahre')).toBe(750);
    expect(festzuschussUmrechnen(700, 'bonus5Jahre', 'ohneBonus')).toBe(600);
  });

  it('unbekannte Stufe lässt den Betrag unverändert', () => {
    expect(festzuschussUmrechnen(600, 'ohneBonus', 'xyz')).toBe(600);
  });
});

describe('berechneZahnersatz', () => {
  it('Eigenanteil ohne Tarif', () => {
    const r = berechneZahnersatz({ gesamtkosten: 3000, festzuschuss: 900 });

    expect(r.eigenanteil).toBe(2100);
    expect(r.erstattung).toBe(0);
    expect(r.eigenanteilMitTarif).toBe(2100);
  });

  it('Tarif "90 % inklusive Kassenleistung"', () => {
    const r = berechneZahnersatz({ gesamtkosten: 3000, festzuschuss: 900, erstattungProzent: 90, bezug: 'gesamt' });

    // 2.700 € Gesamtleistung, davon 900 € Kasse
    expect(r.erstattung).toBe(1800);
    expect(r.eigenanteilMitTarif).toBe(300);
  });

  it('Tarif "80 % des Eigenanteils"', () => {
    const r = berechneZahnersatz({ gesamtkosten: 3000, festzuschuss: 900, erstattungProzent: 80, bezug: 'eigenanteil' });
    expect(r.erstattung).toBe(1680);
  });

  it('Leistungsgrenze im Behandlungsjahr', () => {
    const r = berechneZahnersatz({ gesamtkosten: 3000, festzuschuss: 900, erstattungProzent: 90, hoechstbetrag: 1000 });

    expect(r.erstattung).toBe(1000);
    expect(r.begrenzt).toBe(true);
  });

  it('Erstattung nie höher als der Eigenanteil', () => {
    const r = berechneZahnersatz({ gesamtkosten: 1000, festzuschuss: 600, erstattungProzent: 100, bezug: 'gesamt' });
    expect(r.erstattung).toBe(400);
    expect(r.eigenanteilMitTarif).toBe(0);
  });

  it('Saldo gegen die bis zur Behandlung gezahlten Beiträge', () => {
    const r = berechneZahnersatz({ gesamtkosten: 3000, festzuschuss: 900, erstattungProzent: 90, beitragMonat: 30, monateBeitrag: 24 });

    expect(r.beitraege).toBe(720);
    expect(r.saldo).toBe(1080);
  });

  it('Festzuschuss über den Kosten wird gekappt', () => {
    expect(berechneZahnersatz({ gesamtkosten: 500, festzuschuss: 800 }).eigenanteil).toBe(0);
  });
});
