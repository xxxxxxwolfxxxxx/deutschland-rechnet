import { describe, it, expect } from 'vitest';
import { berechneRente } from '../../public/scripts/rentenrechner.js';
import { berechneNettoGehalt } from '../../public/scripts/brutto-netto.js';

const basis = {
  geburtsjahr: 1980,
  rentenbeginn: 2047,
  entgeltpunkte: 28.5,
  bruttoMonat: 3800,
  steuerklasse: 1,
  bundesland: 'NW',
  aktuellesJahr: 2026,
};

describe('berechneRente – Entgeltpunkte', () => {
  it('rechnet die künftigen Jahre mit dem Entgelt bis zum Rentenbeginn hoch', () => {
    const r = berechneRente(basis);
    // 21 Jahre zu 45.600 € gegen ein Durchschnittsentgelt von 51.944 €
    expect(r.restjahre).toBe(21);
    expect(r.zukuenftigeEntgeltpunkte).toBe(18.4359);
    expect(r.gesamtEntgeltpunkte).toBe(46.9359);
  });

  it('kappt künftige Entgeltpunkte an der Beitragsbemessungsgrenze', () => {
    const r = berechneRente({ ...basis, bruttoMonat: 20000 });
    // 240.000 € im Jahr, angerechnet werden nur 101.400 € – also 1,9521 Punkte je Jahr
    expect(r.zukuenftigeEntgeltpunkte).toBe(40.9941);
    expect(r.ueberBeitragsbemessungsgrenze).toBe(true);
  });

  it('rechnet beim Rentenbeginn im laufenden Jahr nur mit den vorhandenen Punkten', () => {
    const r = berechneRente({ ...basis, geburtsjahr: 1959, rentenbeginn: 2026, aktuellesJahr: 2026 });
    expect(r.restjahre).toBe(0);
    expect(r.zukuenftigeEntgeltpunkte).toBe(0);
    expect(r.gesamtEntgeltpunkte).toBe(28.5);
  });

  it('schiebt die Restjahre mit, wenn der Beginn auf 63 angehoben wird', () => {
    // Jahrgang 1980 kann 2026 keine Altersrente beziehen, frühestens 2043
    const r = berechneRente({ ...basis, rentenbeginn: 2026, aktuellesJahr: 2026 });
    expect(r.aufFruehestenBeginnAngehoben).toBe(true);
    expect(r.restjahre).toBe(17);
  });
});

describe('berechneRente – Zugangsfaktor und Altersgrenze', () => {
  it('kennt für Jahrgang 1980 die Regelaltersgrenze 67', () => {
    const r = berechneRente(basis);
    expect(r.regelaltersgrenzeJahre).toBe(67);
    expect(r.regelaltersgrenzeMonateRest).toBe(0);
    expect(r.zugangsfaktor).toBe(1);
  });

  it('kennt für Jahrgang 1960 die angehobene Grenze von 66 Jahren und 4 Monaten', () => {
    const r = berechneRente({ ...basis, geburtsjahr: 1960, rentenbeginn: 2026 });
    expect(r.regelaltersgrenzeJahre).toBe(66);
    expect(r.regelaltersgrenzeMonateRest).toBe(4);
  });

  it('mindert die Rente bei vorzeitigem Beginn um 0,3 Prozent je Monat', () => {
    const r = berechneRente({ ...basis, rentenbeginn: 2044 });
    expect(r.monateVorzeitig).toBe(36);
    expect(r.zugangsfaktor).toBe(0.892);
    expect(r.abschlagProzent).toBe(10.8);
  });

  it('erhöht sie bei Aufschub um 0,5 Prozent je Monat', () => {
    const r = berechneRente({ ...basis, rentenbeginn: 2049 });
    expect(r.monateAufgeschoben).toBe(24);
    expect(r.zugangsfaktor).toBe(1.12);
    expect(r.zuschlagProzent).toBe(12);
  });

  it('lässt die Altersrente nicht vor 63 beginnen', () => {
    const r = berechneRente({ ...basis, rentenbeginn: 2040 });
    expect(r.aufFruehestenBeginnAngehoben).toBe(true);
    expect(r.renteneintrittsalter).toBe(63);
    expect(r.zugangsfaktor).toBe(0.856);
  });

  it('ist mit 45 Beitragsjahren ab 65 abschlagsfrei', () => {
    const r = berechneRente({ ...basis, rentenbeginn: 2045, wartezeit45: true });
    expect(r.renteneintrittsalter).toBe(65);
    expect(r.zugangsfaktor).toBe(1);
  });

  it('bringt 45 Beitragsjahre vor der eigenen Altersgrenze keinen Vorteil', () => {
    const mit = berechneRente({ ...basis, rentenbeginn: 2044, wartezeit45: true });
    const ohne = berechneRente({ ...basis, rentenbeginn: 2044 });
    expect(mit.zugangsfaktor).toBe(ohne.zugangsfaktor);
  });

  it('wendet den Zugangsfaktor auf die Entgeltpunkte an (§ 66 Abs. 1 SGB VI)', () => {
    const r = berechneRente({ ...basis, rentenbeginn: 2044 });
    expect(r.persoenlicheEntgeltpunkte).toBe(runde4(r.gesamtEntgeltpunkte * 0.892));
    expect(r.renteBrutto).toBe(runde2(r.persoenlicheEntgeltpunkte * 42.52));
  });
});

describe('berechneRente – Abzüge von der Rente', () => {
  it('zieht die Hälfte des Krankenversicherungsbeitrags und den vollen Pflegebeitrag ab', () => {
    const r = berechneRente(basis);
    expect(r.krankenversicherung).toBe(runde2(r.renteBrutto * 0.0875));
    expect(r.pflegeversicherung).toBe(runde2(r.renteBrutto * 0.036));
    expect(r.renteNachBeitraegen).toBe(
      runde2(r.renteBrutto - r.krankenversicherung - r.pflegeversicherung)
    );
  });

  it('belastet Kinderlose in der Pflegeversicherung stärker', () => {
    const mitKind = berechneRente({ ...basis, elternteil: true });
    const ohneKind = berechneRente({ ...basis, elternteil: false });
    expect(ohneKind.pflegeversicherung).toBeGreaterThan(mitKind.pflegeversicherung);
    expect(ohneKind.renteNachBeitraegen).toBeLessThan(mitKind.renteNachBeitraegen);
  });
});

describe('berechneRente – Rentenlücke', () => {
  it('vergleicht mit dem tatsächlichen Netto und nicht mit einer Nettoquote', () => {
    const r = berechneRente(basis);
    const netto = berechneNettoGehalt({
      bruttoMonat: 3800,
      steuerklasse: 1,
      bundesland: 'NW',
      kirchensteuer: false,
    }).netto;
    expect(r.letztesNetto).toBe(netto);
    expect(r.letztesNetto).not.toBe(3800 * 0.7);
  });

  it('berücksichtigt die Steuerklasse', () => {
    const klasse1 = berechneRente({ ...basis, steuerklasse: 1 });
    const klasse3 = berechneRente({ ...basis, steuerklasse: 3 });
    expect(klasse3.letztesNetto).toBeGreaterThan(klasse1.letztesNetto);
    expect(klasse3.rentenluecke).toBeGreaterThan(klasse1.rentenluecke);
  });

  it('ist die Differenz zwischen letztem Netto und Rente nach Beiträgen', () => {
    const r = berechneRente(basis);
    expect(r.rentenluecke).toBe(runde2(r.letztesNetto - r.renteNachBeitraegen));
  });

  it('wird nicht negativ, wenn die Rente über dem letzten Netto liegt', () => {
    const r = berechneRente({ ...basis, entgeltpunkte: 80, bruttoMonat: 1500 });
    expect(r.rentenluecke).toBe(0);
  });
});

function runde4(wert) {
  return Math.round(wert * 1e4) / 1e4;
}

function runde2(betrag) {
  return Math.round(betrag * 100) / 100;
}
