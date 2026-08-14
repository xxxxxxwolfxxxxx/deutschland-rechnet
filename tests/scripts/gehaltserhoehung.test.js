import { describe, it, expect } from 'vitest';
import { berechneGehaltserhoehung } from '../../public/scripts/gehaltserhoehung.js';
import { berechneNettoGehalt } from '../../public/scripts/brutto-netto.js';
import { BBG_RV_AV_MONAT, BBG_KV_PV_MONAT } from '../../public/scripts/sozialversicherung.js';

// Der Rechner stellt zwei Nettogehälter gegenüber. Maßgeblich sind der
// Lohnsteuertarif (§ 32a EStG) und die Sozialversicherungsbeiträge mit ihren
// Beitragsbemessungsgrenzen – beides über brutto-netto.js.
//
// Bis zum 14.08.2026 rechnete das Modul mit festen Netto-Faktoren je
// Steuerklasse (I: 0,68, V: 0,58 …). Der Nettogewinn war damit immer derselbe
// Anteil der Bruttoerhöhung, unabhängig von Gehaltshöhe und Progression.

const BASIS = { brutto: 3500, erhoehung: 200, typ: 'euro', stklasse: 'IV' };

describe('berechneGehaltserhoehung – Bruttoerhöhung', () => {
  it('nimmt einen Eurobetrag unverändert', () => {
    const r = berechneGehaltserhoehung(BASIS);

    expect(r.bruttoGewinn).toBe(200);
    expect(r.neuesBrutto).toBe(3700);
  });

  it('rechnet einen Prozentsatz auf das bisherige Brutto', () => {
    const r = berechneGehaltserhoehung({ ...BASIS, erhoehung: 5, typ: 'prozent' });

    expect(r.bruttoGewinn).toBe(175);
    expect(r.neuesBrutto).toBe(3675);
  });
});

describe('berechneGehaltserhoehung – Nettogewinn', () => {
  it('ist die Differenz der beiden Nettogehälter aus brutto-netto.js', () => {
    const r = berechneGehaltserhoehung(BASIS);
    const alt = berechneNettoGehalt({ bruttoMonat: 3500, steuerklasse: 4 });
    const neu = berechneNettoGehalt({ bruttoMonat: 3700, steuerklasse: 4 });

    expect(r.bisherigesNetto).toBeCloseTo(alt.netto, 2);
    expect(r.neuesNetto).toBeCloseTo(neu.netto, 2);
    expect(r.nettoGewinn).toBeCloseTo(neu.netto - alt.netto, 2);
  });

  it('Bruttoerhöhung ist immer Nettogewinn plus Abgaben', () => {
    const r = berechneGehaltserhoehung(BASIS);

    expect(r.nettoGewinn + r.abgaben).toBeCloseTo(r.bruttoGewinn, 2);
  });

  it('bleibt unter der Bruttoerhöhung, aber über null', () => {
    const r = berechneGehaltserhoehung(BASIS);

    expect(r.nettoGewinn).toBeGreaterThan(0);
    expect(r.nettoGewinn).toBeLessThan(r.bruttoGewinn);
  });
});

describe('berechneGehaltserhoehung – Progression', () => {
  it('die Grenzbelastung der Erhöhung liegt über der Durchschnittsbelastung des Gehalts', () => {
    const r = berechneGehaltserhoehung(BASIS);
    const durchschnitt = (1 - r.bisherigesNetto / 3500) * 100;

    expect(r.grenzbelastung).toBeGreaterThan(durchschnitt);
  });

  it('bei höherem Gehalt bleibt von derselben Erhöhung weniger übrig', () => {
    const wenig = berechneGehaltserhoehung({ ...BASIS, brutto: 2500 });
    const mittel = berechneGehaltserhoehung({ ...BASIS, brutto: 4500 });

    expect(mittel.nettoGewinn).toBeLessThan(wenig.nettoGewinn);
  });

  it('oberhalb aller Beitragsbemessungsgrenzen bleibt wieder mehr übrig', () => {
    // Über der Grenze steigen die Beiträge nicht weiter, es wirkt nur noch
    // die Einkommensteuer.
    const unterGrenze = berechneGehaltserhoehung({ ...BASIS, brutto: 5000 });
    const ueberGrenze = berechneGehaltserhoehung({
      ...BASIS,
      brutto: Math.max(BBG_RV_AV_MONAT, BBG_KV_PV_MONAT) + 1000,
    });

    expect(ueberGrenze.nettoGewinn).toBeGreaterThan(unterGrenze.nettoGewinn);
  });

  it('der Nettogewinn ist kein fester Anteil der Bruttoerhöhung mehr', () => {
    const klein = berechneGehaltserhoehung({ ...BASIS, erhoehung: 100 });
    const gross = berechneGehaltserhoehung({ ...BASIS, erhoehung: 1000 });

    expect(gross.grenzbelastung).not.toBeCloseTo(klein.grenzbelastung, 1);
  });
});

describe('berechneGehaltserhoehung – Steuerklassen', () => {
  it('versteht römische Ziffern von der Seite', () => {
    const roemisch = berechneGehaltserhoehung({ ...BASIS, stklasse: 'III' });
    const arabisch = berechneGehaltserhoehung({ ...BASIS, steuerklasse: 3 });

    expect(roemisch.nettoGewinn).toBe(arabisch.nettoGewinn);
  });

  it('in Steuerklasse V bleibt weniger übrig als in Steuerklasse III', () => {
    const drei = berechneGehaltserhoehung({ ...BASIS, stklasse: 'III' });
    const fuenf = berechneGehaltserhoehung({ ...BASIS, stklasse: 'V' });

    expect(fuenf.nettoGewinn).toBeLessThan(drei.nettoGewinn);
  });

  it('Kirchensteuer schmälert den Nettogewinn', () => {
    const ohne = berechneGehaltserhoehung({ ...BASIS, bundesland: 'NW' });
    const mit = berechneGehaltserhoehung({ ...BASIS, bundesland: 'NW', kirchensteuer: true });

    expect(mit.nettoGewinn).toBeLessThan(ohne.nettoGewinn);
  });

  it('Kinder senken den Pflegebeitrag und erhöhen den Nettogewinn', () => {
    const kinderlos = berechneGehaltserhoehung({ ...BASIS, kinder: 0 });
    const mitKindern = berechneGehaltserhoehung({ ...BASIS, kinder: 2 });

    expect(mitKindern.nettoGewinn).toBeGreaterThan(kinderlos.nettoGewinn);
  });
});

describe('berechneGehaltserhoehung – Randfälle', () => {
  it('ohne Erhöhung ändert sich nichts', () => {
    const r = berechneGehaltserhoehung({ ...BASIS, erhoehung: 0 });

    expect(r.bruttoGewinn).toBe(0);
    expect(r.nettoGewinn).toBe(0);
    expect(r.abgaben).toBe(0);
    expect(r.grenzbelastung).toBe(0);
  });

  it('negative Eingaben werden als 0 behandelt', () => {
    const r = berechneGehaltserhoehung({ ...BASIS, erhoehung: -500 });

    expect(r.bruttoGewinn).toBe(0);
    expect(r.neuesBrutto).toBe(3500);
  });

  it('unterhalb des Grundfreibetrags fallen nur Sozialbeiträge an', () => {
    const r = berechneGehaltserhoehung({ ...BASIS, brutto: 800, erhoehung: 100 });

    expect(r.grenzbelastung).toBeGreaterThan(0);
    expect(r.grenzbelastung).toBeLessThan(30);
  });
});
