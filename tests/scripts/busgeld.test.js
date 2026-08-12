import { describe, it, expect } from 'vitest';
import {
  berechneGeschwindigkeit,
  berechneRotlicht,
  berechneHandy,
  berechneAbstand,
  berechneAlkohol,
  berechneParken,
  BKAT_STAND,
  PROMILLE_STRAFTAT,
} from '../../public/scripts/busgeld.js';

// Alle Regelsätze stammen aus der Anlage zur Bußgeldkatalog-Verordnung
// (BKatV) in der seit dem 9. November 2021 geltenden Fassung sowie aus
// Tabelle 1 und Tabelle 2 des Anhangs. Punkte nach § 28 Abs. 3 Nr. 3 StVG
// in Verbindung mit Anlage 13 FeV: ein Punkt ab 60 Euro Geldbuße, zwei
// Punkte, wenn die Tat mit einem Fahrverbot geahndet wird.

describe('Stand des Bußgeldkatalogs', () => {
  it('nennt die Fassung, auf der die Regelsätze beruhen', () => {
    expect(BKAT_STAND).toBe('9. November 2021');
  });
});

describe('berechneGeschwindigkeit – Regelsätze nach Tabelle 1 Buchstabe c', () => {
  it('ahndet Überschreitungen innerorts nach Tabelle 1', () => {
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 10 }).bussgeld).toBe(30);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 15 }).bussgeld).toBe(50);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 20 }).bussgeld).toBe(70);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 25 }).bussgeld).toBe(115);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 30 }).bussgeld).toBe(180);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 40 }).bussgeld).toBe(260);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 50 }).bussgeld).toBe(400);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 60 }).bussgeld).toBe(560);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 70 }).bussgeld).toBe(700);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 90 }).bussgeld).toBe(800);
  });

  it('ahndet Überschreitungen außerorts milder als innerorts', () => {
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 10 }).bussgeld).toBe(20);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 15 }).bussgeld).toBe(40);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 20 }).bussgeld).toBe(60);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 25 }).bussgeld).toBe(100);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 30 }).bussgeld).toBe(150);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 40 }).bussgeld).toBe(200);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 50 }).bussgeld).toBe(320);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 60 }).bussgeld).toBe(480);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 70 }).bussgeld).toBe(600);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 90 }).bussgeld).toBe(700);
  });
});

describe('berechneGeschwindigkeit – Regelfahrverbot nach § 4 Abs. 1 BKatV', () => {
  it('verhängt innerorts erst ab 31 km/h ein Regelfahrverbot', () => {
    // Tabelle 1 Buchstabe c: 11.3.5 (26–30 km/h innerorts) sieht kein
    // Fahrverbot vor, erst 11.3.6 (31–40 km/h) trägt "1 Monat".
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 30 }).fahrverbot).toBe(0);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 31 }).fahrverbot).toBe(1);
  });

  it('verhängt außerorts erst ab 41 km/h ein Regelfahrverbot', () => {
    // 11.3.6 (31–40 km/h außerorts) trägt in der Fahrverbotsspalte "–".
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 40 }).fahrverbot).toBe(0);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 41 }).fahrverbot).toBe(1);
  });

  it('steigert die Dauer des Fahrverbots mit der Überschreitung', () => {
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 60 }).fahrverbot).toBe(2);
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 70 }).fahrverbot).toBe(3);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 60 }).fahrverbot).toBe(1);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 90 }).fahrverbot).toBe(3);
  });
});

describe('berechneGeschwindigkeit – beharrlicher Verstoß nach § 4 Abs. 2 BKatV', () => {
  it('verhängt bei Voreintragung ab 26 km/h ein Fahrverbot von einem Monat', () => {
    const ohne = berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 28 });
    const mit = berechneGeschwindigkeit({
      ort: 'innerorts',
      ueberschreitung: 28,
      voreintragung: true,
    });
    expect(ohne.fahrverbot).toBe(0);
    expect(mit.fahrverbot).toBe(1);
    expect(mit.bussgeld).toBe(ohne.bussgeld);
  });

  it('lässt Verstöße unter 26 km/h auch bei Voreintragung ohne Fahrverbot', () => {
    const r = berechneGeschwindigkeit({
      ort: 'innerorts',
      ueberschreitung: 25,
      voreintragung: true,
    });
    expect(r.fahrverbot).toBe(0);
  });

  it('verlängert ein bestehendes Regelfahrverbot nicht', () => {
    const r = berechneGeschwindigkeit({
      ort: 'innerorts',
      ueberschreitung: 65,
      voreintragung: true,
    });
    expect(r.fahrverbot).toBe(3);
  });

  it('meldet den beharrlichen Verstoß gesondert', () => {
    const r = berechneGeschwindigkeit({
      ort: 'ausserorts',
      ueberschreitung: 35,
      voreintragung: true,
    });
    expect(r.beharrlich).toBe(true);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 35 }).beharrlich).toBe(false);
  });
});

describe('berechneGeschwindigkeit – Punkte nach Anlage 13 FeV', () => {
  it('vergibt unterhalb von 60 Euro Geldbuße keinen Punkt', () => {
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 15 }).punkte).toBe(0);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 15 }).punkte).toBe(0);
  });

  it('vergibt ab 60 Euro Geldbuße einen Punkt', () => {
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 20 }).punkte).toBe(1);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 20 }).punkte).toBe(1);
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 40 }).punkte).toBe(1);
  });

  it('vergibt zwei Punkte, sobald ein Fahrverbot verhängt wird', () => {
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 35 }).punkte).toBe(2);
    const beharrlich = berechneGeschwindigkeit({
      ort: 'innerorts',
      ueberschreitung: 28,
      voreintragung: true,
    });
    expect(beharrlich.punkte).toBe(2);
  });

  it('nennt die Nummer der Tabelle 1 Buchstabe c', () => {
    // Innerorts und außerorts teilen sich dieselben laufenden Nummern;
    // sie unterscheiden sich nur in den Spalten.
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 10 }).nummer).toBe('11.3.1');
    expect(berechneGeschwindigkeit({ ort: 'ausserorts', ueberschreitung: 30 }).nummer).toBe('11.3.5');
    expect(berechneGeschwindigkeit({ ort: 'innerorts', ueberschreitung: 90 }).nummer).toBe('11.3.10');
  });

  it('fällt bei unbekanntem Ort auf die Werte innerorts zurück', () => {
    expect(berechneGeschwindigkeit({ ort: 'raumstation', ueberschreitung: 20 }).bussgeld).toBe(70);
  });
});

describe('berechneRotlicht – Nummern 132 ff. BKat', () => {
  it('ahndet den einfachen Rotlichtverstoß mit 90 Euro ohne Fahrverbot', () => {
    const r = berechneRotlicht({ rotphase: 'unter1s', folge: 'keine' });
    expect(r).toMatchObject({ bussgeld: 90, punkte: 1, fahrverbot: 0 });
  });

  it('trennt die Rotphase von der Folge des Verstoßes', () => {
    // Nr. 132.1: einfacher Rotlichtverstoß mit Gefährdung – 200 €, nicht 320 €.
    expect(berechneRotlicht({ rotphase: 'unter1s', folge: 'gefaehrdung' })).toMatchObject({
      bussgeld: 200,
      punkte: 2,
      fahrverbot: 1,
    });
    // Nr. 132.3.1: qualifiziert und mit Gefährdung – erst hier 320 €.
    expect(berechneRotlicht({ rotphase: 'ueber1s', folge: 'gefaehrdung' })).toMatchObject({
      bussgeld: 320,
      punkte: 2,
      fahrverbot: 1,
    });
  });

  it('ahndet Sachbeschädigung härter als Gefährdung', () => {
    expect(berechneRotlicht({ rotphase: 'unter1s', folge: 'sachbeschaedigung' }).bussgeld).toBe(240);
    expect(berechneRotlicht({ rotphase: 'ueber1s', folge: 'sachbeschaedigung' }).bussgeld).toBe(360);
  });

  it('ahndet den qualifizierten Rotlichtverstoß mit 200 Euro und Fahrverbot', () => {
    expect(berechneRotlicht({ rotphase: 'ueber1s', folge: 'keine' })).toMatchObject({
      bussgeld: 200,
      punkte: 2,
      fahrverbot: 1,
    });
  });

  it('liefert für unbekannte Angaben den Grundtatbestand', () => {
    expect(berechneRotlicht({}).bussgeld).toBe(90);
  });
});

describe('berechneHandy – Nummer 246 BKat', () => {
  it('ahndet die Gerätenutzung beim Führen eines Fahrzeugs mit 100 Euro', () => {
    expect(berechneHandy({ situation: 'kfz' })).toMatchObject({
      bussgeld: 100,
      punkte: 1,
      fahrverbot: 0,
    });
  });

  it('ahndet Gefährdung und Sachbeschädigung mit Fahrverbot', () => {
    expect(berechneHandy({ situation: 'kfz_gefaehrdung' })).toMatchObject({
      bussgeld: 150,
      punkte: 2,
      fahrverbot: 1,
    });
    expect(berechneHandy({ situation: 'kfz_sachbeschaedigung' })).toMatchObject({
      bussgeld: 200,
      punkte: 2,
      fahrverbot: 1,
    });
  });

  it('ahndet die Nutzung beim Radfahren mit 55 Euro ohne Punkt', () => {
    expect(berechneHandy({ situation: 'radfahren' })).toMatchObject({
      bussgeld: 55,
      punkte: 0,
      fahrverbot: 0,
    });
  });

  it('kennt keinen Tatbestand für Fußgänger', () => {
    // § 23 Abs. 1a StVO gilt nur für Fahrzeugführer. Der Bußgeldkatalog
    // enthält für Fußgänger mit Mobiltelefon keinen Regelsatz.
    expect(berechneHandy({ situation: 'fussgaenger' })).toBeNull();
  });
});

describe('berechneAbstand – Tabelle 2 des Anhangs zur BKatV', () => {
  it('meldet keinen Verstoß, wenn der halbe Tachowert eingehalten ist', () => {
    expect(berechneAbstand({ geschwindigkeit: 100, abstandMeter: 50 })).toBeNull();
    expect(berechneAbstand({ geschwindigkeit: 100, abstandMeter: 60 })).toBeNull();
  });

  it('ahndet zu geringen Abstand bis 80 km/h mit 25 Euro', () => {
    expect(berechneAbstand({ geschwindigkeit: 60, abstandMeter: 20 })).toMatchObject({
      bussgeld: 25,
      punkte: 0,
      fahrverbot: 0,
    });
    expect(berechneAbstand({ geschwindigkeit: 80, abstandMeter: 30 }).bussgeld).toBe(25);
  });

  it('ahndet über 80 km/h mit 35 Euro, solange ein Viertel des Tachowertes bleibt', () => {
    // Nr. 12.4: Abstand nicht weniger als ein Viertel des Tachowertes.
    // 120 km/h: halber Tachowert 60 m, ein Viertel des Tachowertes 30 m.
    expect(berechneAbstand({ geschwindigkeit: 120, abstandMeter: 30 })).toMatchObject({
      bussgeld: 35,
      punkte: 0,
      fahrverbot: 0,
    });
  });

  it('misst die Staffel am halben Tachowert, nicht am vollen', () => {
    // 100 km/h, 24 m: 24 / 50 = 4,8/10 des halben Tachowertes -> Nr. 12.5.1.
    // Gemessen am vollen Tachowert wären es 2,4/10 und damit eine Stufe,
    // die es in Tabelle 2 Buchstabe a gar nicht mit Fahrverbot gibt.
    expect(berechneAbstand({ geschwindigkeit: 100, abstandMeter: 24 })).toMatchObject({
      bussgeld: 75,
      punkte: 1,
      fahrverbot: 0,
    });
  });

  it('wählt die strengste zutreffende Stufe, nicht die mildeste', () => {
    // 120 km/h, 17 m: 17 / 60 = 2,83/10 -> weniger als 3/10, Nr. 12.6.3.
    expect(berechneAbstand({ geschwindigkeit: 120, abstandMeter: 17 })).toMatchObject({
      bussgeld: 160,
      punkte: 2,
      fahrverbot: 1,
    });
  });

  it('kennt über 80 km/h kein Fahrverbot, auch bei geringstem Abstand', () => {
    // Tabelle 2 Buchstabe a trägt in keiner Zeile ein Fahrverbot;
    // § 4 Abs. 1 Nr. 2 BKatV nennt erst 12.6.3 ff.
    expect(berechneAbstand({ geschwindigkeit: 90, abstandMeter: 4 })).toMatchObject({
      bussgeld: 320,
      punkte: 1,
      fahrverbot: 0,
    });
  });

  it('ordnet genau 100 km/h noch Buchstabe a zu', () => {
    // Buchstabe b gilt erst "bei einer Geschwindigkeit von mehr als 100 km/h".
    expect(berechneAbstand({ geschwindigkeit: 100, abstandMeter: 14 })).toMatchObject({
      bussgeld: 160,
      fahrverbot: 0,
    });
    expect(berechneAbstand({ geschwindigkeit: 101, abstandMeter: 14 }).fahrverbot).toBe(1);
  });

  it('staffelt über 130 km/h nach Buchstabe c', () => {
    // 140 km/h: halber Tachowert 70 m.
    expect(berechneAbstand({ geschwindigkeit: 140, abstandMeter: 34 })).toMatchObject({
      bussgeld: 100,
      fahrverbot: 0,
    });
    expect(berechneAbstand({ geschwindigkeit: 140, abstandMeter: 20 })).toMatchObject({
      bussgeld: 240,
      punkte: 2,
      fahrverbot: 1,
    });
    expect(berechneAbstand({ geschwindigkeit: 140, abstandMeter: 6 })).toMatchObject({
      bussgeld: 400,
      punkte: 2,
      fahrverbot: 3,
    });
  });
});

describe('berechneAlkohol – § 24a StVG und Nummer 241 BKat', () => {
  it('zieht die Grenze zur Straftat bei 1,1 Promille', () => {
    // Absolute Fahruntüchtigkeit eines Kraftfahrzeugführers, § 316 StGB.
    expect(PROMILLE_STRAFTAT).toBe(1.1);
    expect(berechneAlkohol({ promille: 1.1 }).art).toBe('straftat');
    expect(berechneAlkohol({ promille: 1.09 }).art).toBe('owi');
  });

  it('meldet unter 0,5 Promille keinen Verstoß nach § 24a StVG', () => {
    expect(berechneAlkohol({ promille: 0.4 }).art).toBe('kein_verstoss');
  });

  it('ahndet den Ersttäter mit 500 Euro und einem Monat Fahrverbot', () => {
    expect(berechneAlkohol({ promille: 0.6, voreintragungen: 0 })).toMatchObject({
      art: 'owi',
      bussgeld: 500,
      punkte: 2,
      fahrverbot: 1,
    });
  });

  it('staffelt nach Voreintragungen im Fahreignungsregister, nicht nach Promille', () => {
    // Nr. 241.1 und 241.2 knüpfen an eingetragene Entscheidungen an.
    // Der Regelsatz ist bei 0,6 und bei 1,0 Promille derselbe.
    expect(berechneAlkohol({ promille: 1.0, voreintragungen: 0 }).bussgeld).toBe(500);
    expect(berechneAlkohol({ promille: 0.6, voreintragungen: 1 })).toMatchObject({
      bussgeld: 1000,
      fahrverbot: 3,
    });
    expect(berechneAlkohol({ promille: 0.6, voreintragungen: 2 })).toMatchObject({
      bussgeld: 1500,
      fahrverbot: 3,
    });
    expect(berechneAlkohol({ promille: 0.6, voreintragungen: 5 }).bussgeld).toBe(1500);
  });
});

describe('berechneParken – Nummern 50 ff. BKat', () => {
  it('ahndet unzulässiges Halten mit 20 und unzulässiges Parken mit 25 Euro', () => {
    expect(berechneParken({ typ: 'halten_unzulaessig' }).bussgeld).toBe(20);
    expect(berechneParken({ typ: 'halteverbot_parken' }).bussgeld).toBe(25);
  });

  it('ahndet Parken im Halteverbot mit Behinderung mit 40 Euro', () => {
    // Nr. 52.1. Die 35 Euro der Nr. 51.1 gelten für das Halten, nicht das Parken.
    expect(berechneParken({ typ: 'halteverbot_parken_behinderung' }).bussgeld).toBe(40);
  });

  it('ahndet Parken auf Geh- und Radwegen mit 55 Euro', () => {
    expect(berechneParken({ typ: 'gehweg_radweg' }).bussgeld).toBe(55);
    expect(berechneParken({ typ: 'gehweg_radweg_behinderung' }).bussgeld).toBe(70);
  });

  it('ahndet das Parken vor Kreuzungen nach Nummer 54 mit 10 Euro', () => {
    // § 12 Abs. 3 Nr. 1 StVO verbietet das Parken bis 5 m vor der Kreuzung.
    expect(berechneParken({ typ: 'kreuzung_5m' }).bussgeld).toBe(10);
  });

  it('ahndet Feuerwehrzufahrt und Schwerbehindertenparkplatz mit 55 Euro', () => {
    expect(berechneParken({ typ: 'feuerwehrzufahrt' }).bussgeld).toBe(55);
    expect(berechneParken({ typ: 'feuerwehrzufahrt_behinderung' }).bussgeld).toBe(100);
    expect(berechneParken({ typ: 'schwerbehindertenparkplatz' }).bussgeld).toBe(55);
  });

  it('vergibt für Park- und Halteverstöße keine Punkte', () => {
    for (const typ of [
      'halten_unzulaessig',
      'halteverbot_parken',
      'gehweg_radweg_behinderung',
      'feuerwehrzufahrt_behinderung',
      'schwerbehindertenparkplatz',
    ]) {
      expect(berechneParken({ typ }).punkte).toBe(0);
    }
  });

  it('ahndet die nicht gebildete Rettungsgasse mit 200 Euro und Fahrverbot', () => {
    // Nr. 50. Die 240 Euro gelten nach Nr. 50.1 erst bei Behinderung
    // und nach Nr. 50a für das unberechtigte Befahren der Gasse.
    expect(berechneParken({ typ: 'rettungsgasse_nicht_gebildet' })).toMatchObject({
      bussgeld: 200,
      punkte: 2,
      fahrverbot: 1,
    });
    expect(berechneParken({ typ: 'rettungsgasse_benutzt' }).bussgeld).toBe(240);
  });

  it('liefert für unbekannte Tatbestände null', () => {
    expect(berechneParken({ typ: 'halteverbot_gefaehrdung' })).toBeNull();
  });

  it('gibt zu jedem Tatbestand die Nummer des Bußgeldkatalogs an', () => {
    expect(berechneParken({ typ: 'rettungsgasse_nicht_gebildet' }).nummer).toBe('50');
    expect(berechneParken({ typ: 'kreuzung_5m' }).nummer).toBe('54');
  });
});
