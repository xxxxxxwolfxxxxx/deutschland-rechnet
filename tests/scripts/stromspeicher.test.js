import { describe, it, expect } from 'vitest';
import {
  berechneStromspeicher,
  vergleicheSpeichergroessen,
  DIREKTVERBRAUCH_ANTEIL,
  SPEICHER_NUTZTAGE,
  SPEICHER_WIRKUNGSGRAD,
} from '../../public/scripts/stromspeicher.js';
import { verguetungProKwh, SPEZIFISCHER_ERTRAG } from '../../public/scripts/photovoltaik.js';

// Referenzfall der Ratgeberseite: 4-Personen-Haushalt mit 5.000 kWh
// Jahresverbrauch und einer 10-kWp-Anlage.
const basis = {
  speicher: 5,
  pvLeistung: 10,
  stromverbrauch: 5000,
  strompreis: 38,
  speicherkosten: 1000,
};

describe('berechneStromspeicher – Bezugsgrößen des Eigenverbrauchs', () => {
  it('bezieht die Eigenverbrauchsquote auf den Ertrag, den Autarkiegrad auf den Verbrauch', () => {
    // Beide Zahlen beschreiben denselben selbst genutzten Strom, nur mit
    // verschiedenem Nenner. Wer sie verwechselt, rechnet eine
    // überdimensionierte Anlage schön.
    const r = berechneStromspeicher(basis);
    const ertrag = basis.pvLeistung * SPEZIFISCHER_ERTRAG; // 9.500 kWh
    expect(r.eigenverbrauchsquote).toBe(Math.round((r.eigenverbrauchKwh / ertrag) * 100));
    expect(r.autarkiegrad).toBe(
      Math.round((r.eigenverbrauchKwh / basis.stromverbrauch) * 100),
    );
    expect(r.eigenverbrauchsquote).not.toBe(r.autarkiegrad);
  });

  it('deckt ohne Speicher den vereinbarten Anteil des Verbrauchs direkt', () => {
    const r = berechneStromspeicher({ ...basis, speicher: 0 });
    expect(DIREKTVERBRAUCH_ANTEIL).toBe(0.3);
    expect(r.direktKwh).toBe(1500); // 30 % von 5.000 kWh
    expect(r.speicherKwh).toBe(0);
    expect(r.autarkiegrad).toBe(30);
  });

  it('begrenzt den Direktverbrauch auf den tatsächlichen Ertrag', () => {
    // 1 kWp erzeugt 950 kWh – weniger als die 30 % von 5.000 kWh.
    const r = berechneStromspeicher({ ...basis, pvLeistung: 1, speicher: 0 });
    expect(r.direktKwh).toBe(950);
    expect(r.autarkiegrad).toBe(19);
    expect(r.eigenverbrauchsquote).toBe(100);
  });

  it('summiert Eigenverbrauch und Einspeisung zum Jahresertrag', () => {
    const r = berechneStromspeicher(basis);
    expect(r.eigenverbrauchKwh + r.einspeisungKwh).toBe(basis.pvLeistung * SPEZIFISCHER_ERTRAG);
  });
});

describe('berechneStromspeicher – Grenzen der Speichernutzung', () => {
  it('lädt den Speicher an den nutzbaren Tagen, nicht an 365', () => {
    // Im Winterhalbjahr und bei Schlechtwetter bleibt der Speicher teilweise leer.
    expect(SPEICHER_NUTZTAGE).toBe(250);
    expect(SPEICHER_WIRKUNGSGRAD).toBe(0.92);
    const r = berechneStromspeicher(basis);
    expect(r.speicherKwh).toBe(1150); // 5 kWh × 0,92 × 250 Tage
  });

  it('begrenzt den Speicher auf den Verbrauch, der nach dem Direktverbrauch bleibt', () => {
    // 20 kWh könnten 4.600 kWh im Jahr liefern, gebraucht werden aber nur
    // 3.500 kWh – und davon nur, was an den nutzbaren Tagen anfällt.
    const gross = berechneStromspeicher({ ...basis, speicher: 20 });
    const restVerbrauchProTag = (5000 - 1500) / 365;
    expect(gross.speicherKwh).toBe(Math.round(restVerbrauchProTag * SPEICHER_NUTZTAGE));
    expect(gross.eigenverbrauchKwh).toBeLessThan(basis.stromverbrauch);
  });

  it('begrenzt den Speicher auf den vorhandenen Überschuss', () => {
    // 2 kWp erzeugen 1.900 kWh, davon gehen 1.500 kWh direkt in den Haushalt.
    const r = berechneStromspeicher({ ...basis, pvLeistung: 2, speicher: 10 });
    expect(r.speicherKwh).toBe(400);
    expect(r.einspeisungKwh).toBe(0);
  });

  it('bringt einen doppelt so großen Speicher nicht die doppelte Ersparnis', () => {
    // Solange der Speicher kleiner ist als der Verbrauch außerhalb der
    // Erzeugungsstunden (hier 9,6 kWh am Tag), wächst die Ersparnis linear.
    // Darüber sättigt sie, weil die zusätzliche Kapazität leer bleibt.
    const klein = berechneStromspeicher({ ...basis, speicher: 10 });
    const gross = berechneStromspeicher({ ...basis, speicher: 20 });
    expect(gross.ersparnis).toBeGreaterThan(klein.ersparnis);
    expect(gross.ersparnis).toBeLessThan(klein.ersparnis * 2);
  });
});

describe('berechneStromspeicher – Einspeisevergütung nach § 48 Abs. 2 EEG', () => {
  it('übernimmt den Satz aus dem Photovoltaik-Modul statt eines eigenen Werts', () => {
    expect(berechneStromspeicher(basis).verguetungCentProKwh).toBe(
      Math.round(verguetungProKwh(10) * 100 * 100) / 100,
    );
    expect(berechneStromspeicher(basis).verguetungCentProKwh).toBe(7.7);
  });

  it('mischt den Satz oberhalb von 10 kWp anteilig', () => {
    const r = berechneStromspeicher({ ...basis, pvLeistung: 15 });
    expect(r.verguetungCentProKwh).toBe(7.35);
    expect(r.verguetungCentProKwh).toBeLessThan(7.7);
  });

  it('rechnet nicht mehr mit dem Satz von 8,1 ct/kWh', () => {
    // Der Satz galt 2024 und steht in mehreren Ratgebertexten noch.
    expect(berechneStromspeicher(basis).verguetungCentProKwh).not.toBe(8.1);
  });
});

describe('berechneStromspeicher – Wirtschaftlichkeit', () => {
  it('bewertet jede gespeicherte kWh mit Strompreis minus Einspeisevergütung', () => {
    // Die gespeicherte kWh ersetzt Netzstrom (38 ct) und kostet die
    // entgangene Vergütung (7,70 ct) – der Vorteil ist die Differenz.
    const r = berechneStromspeicher(basis);
    expect(r.ersparnis).toBe(1150 * (0.38 - 0.077));
    expect(r.ersparnis).toBe(348.45);
  });

  it('führt die Ersparnis als Differenz der beiden Jahresbilanzen', () => {
    const r = berechneStromspeicher(basis);
    expect(r.ohneSpeicher).toBe(1186); // 1.500 × 38 ct + 8.000 × 7,70 ct
    expect(r.mitSpeicher).toBe(1534.45); // 2.650 × 38 ct + 6.850 × 7,70 ct
    expect(r.ersparnis).toBeCloseTo(r.mitSpeicher - r.ohneSpeicher, 2);
  });

  it('weist Netzbezug und Netzstromkosten aus', () => {
    // Was der Haushalt nicht selbst deckt, kauft er zum vollen Strompreis.
    const r = berechneStromspeicher(basis);
    expect(r.netzbezugKwh).toBe(5000 - r.eigenverbrauchKwh); // 2.350 kWh
    expect(r.netzstromkosten).toBe(893); // 2.350 kWh × 38 ct
  });

  it('kauft ohne PV-Anlage den gesamten Verbrauch zu', () => {
    const r = berechneStromspeicher({ ...basis, pvLeistung: 0, speicher: 0 });
    expect(r.netzbezugKwh).toBe(5000);
    expect(r.netzstromkosten).toBe(1900);
  });

  it('amortisiert den Beispielspeicher nach 14,3 Jahren', () => {
    const r = berechneStromspeicher(basis);
    expect(r.investition).toBe(5000);
    expect(r.amortisation).toBe(14.3);
  });

  it('verkürzt die Amortisation bei höherem Strompreis', () => {
    const teuer = berechneStromspeicher({ ...basis, strompreis: 42 });
    expect(teuer.amortisation).toBe(12.7);
    expect(teuer.amortisation).toBeLessThan(berechneStromspeicher(basis).amortisation);
  });

  it('meldet keine Amortisation, wenn der Speicher nichts einbringt', () => {
    const ohnePv = berechneStromspeicher({ ...basis, pvLeistung: 0 });
    expect(ohnePv.ersparnis).toBe(0);
    expect(ohnePv.amortisation).toBeNull();
  });
});

describe('vergleicheSpeichergroessen – Grenzertrag und Empfehlung', () => {
  const eingaben = { pvLeistung: 10, stromverbrauch: 5000, strompreis: 38, preisJeKwh: 600, nutzungsdauer: 15 };

  it('rechnet jede Größe mit derselben Jahresbilanz wie der Stromspeicher-Rechner', () => {
    const { zeilen } = vergleicheSpeichergroessen({ ...eingaben, groessen: [5, 10] });
    expect(zeilen[0].ersparnis).toBe(berechneStromspeicher({ ...basis, speicherkosten: 600 }).ersparnis);
    expect(zeilen[1].investition).toBe(6000);
  });

  it('lässt den Grenzertrag je kWh sinken, sobald der Speicher leer bleibt', () => {
    const { zeilen } = vergleicheSpeichergroessen(eingaben);
    const erste = zeilen[0].grenzertragJeKwh;
    const letzte = zeilen[zeilen.length - 1].grenzertragJeKwh;
    expect(letzte).toBeLessThan(erste);
    // Bis 8 kWh wächst die Ersparnis linear: 0,92 × 250 Tage × 30,3 ct.
    expect(zeilen[1].grenzertragJeKwh).toBeCloseTo(0.92 * 250 * 0.303, 1);
  });

  it('empfiehlt die größte Stufe, die ihren Preis über die Nutzungsdauer hereinholt', () => {
    const { zeilen, empfehlung } = vergleicheSpeichergroessen(eingaben);
    const idx = zeilen.findIndex((z) => z.speicher === empfehlung);
    expect(zeilen.slice(0, idx + 1).every((z) => z.lohntStufe)).toBe(true);
    if (idx + 1 < zeilen.length) expect(zeilen[idx + 1].lohntStufe).toBe(false);
  });

  it('empfiehlt keinen Speicher, wenn schon die kleinste Stufe sich nicht trägt', () => {
    const { empfehlung } = vergleicheSpeichergroessen({ ...eingaben, preisJeKwh: 2000, nutzungsdauer: 5 });
    expect(empfehlung).toBe(0);
  });

  it('empfiehlt bei günstigerem Speicher keine kleinere Größe', () => {
    const teuer = vergleicheSpeichergroessen({ ...eingaben, preisJeKwh: 900 }).empfehlung;
    const billig = vergleicheSpeichergroessen({ ...eingaben, preisJeKwh: 400 }).empfehlung;
    expect(billig).toBeGreaterThanOrEqual(teuer);
  });
});

describe('berechneStromspeicher – Robustheit der Eingaben', () => {
  it('kommt ohne PV-Anlage ohne Division durch null aus', () => {
    const r = berechneStromspeicher({ ...basis, pvLeistung: 0 });
    expect(r.eigenverbrauchsquote).toBe(0);
    expect(r.autarkiegrad).toBe(0);
    expect(r.ohneSpeicher).toBe(0);
    expect(r.mitSpeicher).toBe(0);
  });

  it('behandelt fehlende und negative Eingaben als null', () => {
    const r = berechneStromspeicher({
      speicher: -5,
      pvLeistung: 10,
      stromverbrauch: NaN,
      strompreis: 38,
      speicherkosten: 1000,
    });
    expect(r.speicherKwh).toBe(0);
    expect(r.direktKwh).toBe(0);
    expect(r.investition).toBe(0);
    expect(r.amortisation).toBeNull();
  });

  it('liefert für jede Eingabe endliche Zahlen', () => {
    const r = berechneStromspeicher({
      speicher: 8,
      pvLeistung: 12,
      stromverbrauch: 6000,
      strompreis: 35,
      speicherkosten: 800,
    });
    for (const [feld, wert] of Object.entries(r)) {
      if (feld === 'amortisation' && wert === null) continue;
      expect(Number.isFinite(wert), `${feld} ist keine endliche Zahl`).toBe(true);
    }
  });
});
