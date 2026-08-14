import { describe, it, expect } from 'vitest';
import {
  berechneKindesunterhalt,
  DT_2026,
  MINDESTUNTERHALT,
  KINDERGELD,
  SELBSTBEHALT,
  BEDARF_EIGENER_HAUSSTAND,
} from '../../public/scripts/unterhalt.js';

describe('Düsseldorfer Tabelle 2026 – Tabellenwerk', () => {
  it('hat 15 Einkommensgruppen mit der obersten Grenze 11.200 €', () => {
    expect(DT_2026).toHaveLength(15);
    expect(DT_2026[0].bis).toBe(2100);
    expect(DT_2026[14].bis).toBe(11200);
  });

  it('Gruppe 1 entspricht dem Mindestunterhalt der Mindestunterhaltsverordnung', () => {
    expect(DT_2026[0].saetze).toEqual([486, 558, 653, 698]);
    expect(MINDESTUNTERHALT).toEqual([486, 558, 653]);
  });

  it('Gruppe 15 verdoppelt den Mindestunterhalt', () => {
    expect(DT_2026[14].saetze).toEqual([972, 1116, 1306, 1396]);
  });

  it('leitet jeden Satz als aufgerundeten Prozentsatz des Mindestunterhalts ab', () => {
    // Gruppe 1-5: je +5 %, Gruppe 6-15: je +8 % des Mindestunterhalts.
    const prozent = [100, 105, 110, 115, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200];
    const basis = [...MINDESTUNTERHALT, 698];

    DT_2026.forEach((gruppe, i) => {
      gruppe.saetze.forEach((satz, stufe) => {
        expect(satz).toBe(Math.ceil((basis[stufe] * prozent[i]) / 100));
      });
    });
  });

  it('führt für jede Gruppe einen Bedarfskontrollbetrag', () => {
    expect(DT_2026[1].bedarfskontrollbetrag).toBe(1750);
    expect(DT_2026[14].bedarfskontrollbetrag).toBe(5050);
  });

  it('kennt die Selbstbehalte und das Kindergeld 2026', () => {
    expect(KINDERGELD).toBe(259);
    expect(SELBSTBEHALT.notwendigErwerbstaetig).toBe(1450);
    expect(SELBSTBEHALT.notwendigNichtErwerbstaetig).toBe(1200);
    expect(SELBSTBEHALT.angemessen).toBe(1750);
    expect(BEDARF_EIGENER_HAUSSTAND).toBe(990);
  });
});

describe('berechneKindesunterhalt – Einstufung', () => {
  it('stuft bei nur einem Berechtigten eine Gruppe herauf', () => {
    // 3.000 € liegt in Gruppe 4 (2.901–3.300). Die Tabelle unterstellt zwei
    // Berechtigte, bei einem Berechtigten also Zuschlag durch Gruppe 5.
    const r = berechneKindesunterhalt({
      nettoEinkommen: 3000, alterKind: 8, anzahlBerechtigte: 1,
    });
    expect(r.einkommensgruppe).toBe(5);
    expect(r.bedarf).toBe(670);
    expect(r.zahlbetrag).toBe(540.5);
  });

  it('lässt zwei Berechtigte in der abgelesenen Gruppe', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 3000, alterKind: 8, anzahlBerechtigte: 2,
    });
    expect(r.einkommensgruppe).toBe(4);
    expect(r.bedarf).toBe(642);
  });

  it('ordnet die vier Altersstufen nach vollendetem Lebensjahr zu', () => {
    const stufen = [3, 8, 15, 19].map(
      alter => berechneKindesunterhalt({ nettoEinkommen: 2000, alterKind: alter, anzahlBerechtigte: 2 }).altersstufe,
    );
    expect(stufen).toEqual([1, 2, 3, 4]);
  });
});

describe('berechneKindesunterhalt – Bedarfskontrollbetrag', () => {
  it('stuft zurück, bis der Bedarfskontrollbetrag gewahrt ist', () => {
    // 3.000 € netto, drei Berechtigte: Ablesung Gruppe 4, wegen der dritten
    // Berechtigten Abschlag auf Gruppe 3. Dort verbleiben dem Pflichtigen nach
    // Abzug aller Zahlbeträge nur 1.546,50 € statt der geforderten 1.850 €.
    const r = berechneKindesunterhalt({
      nettoEinkommen: 3000, alterKind: 8, anzahlBerechtigte: 3,
    });
    expect(r.einkommensgruppeVorRueckstufung).toBe(3);
    expect(r.einkommensgruppe).toBe(1);
    expect(r.bedarf).toBe(558);
    expect(r.zahlbetrag).toBe(428.5);
    expect(r.rueckstufung).toBe(true);
  });

  it('stuft nie unter Gruppe 1 zurück', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 1600, alterKind: 8, anzahlBerechtigte: 2,
    });
    expect(r.einkommensgruppe).toBe(1);
    expect(r.bedarf).toBe(558);
  });

  it('lässt eine ausreichend gedeckte Gruppe unangetastet', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 3000, alterKind: 8, anzahlBerechtigte: 1,
    });
    expect(r.rueckstufung).toBe(false);
  });
});

describe('berechneKindesunterhalt – Kindergeldanrechnung § 1612b BGB', () => {
  it('rechnet bei minderjährigen Kindern das halbe Kindergeld an', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 3000, alterKind: 8, anzahlBerechtigte: 1,
    });
    expect(r.kindergeldAnrechnung).toBe(129.5);
    expect(r.zahlbetrag).toBe(r.bedarf - 129.5);
  });

  it('rechnet bei volljährigen Kindern das volle Kindergeld an', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 4000, alterKind: 20, anzahlBerechtigte: 2,
    });
    expect(r.kindergeldAnrechnung).toBe(259);
  });
});

describe('berechneKindesunterhalt – volljährige Kinder', () => {
  it('setzt für Studierende mit eigenem Hausstand den Festbedarf 990 € an', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 4000, alterKind: 21, anzahlBerechtigte: 1, eigenerHausstand: true,
    });
    expect(r.bedarf).toBe(990);
    expect(r.zahlbetrag).toBe(731);
    expect(r.einkommensgruppe).toBeNull();
  });

  it('wendet gegenüber volljährigen Kindern den angemessenen Selbstbehalt an', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 2000, alterKind: 19, anzahlBerechtigte: 1,
    });
    expect(r.selbstbehalt).toBe(1750);
  });

  it('stellt privilegierte Volljährige minderjährigen Kindern gleich', () => {
    // § 1603 Abs. 2 Satz 2 BGB: unter 21, im Elternhaushalt, in allgemeiner
    // Schulausbildung – dann gilt der notwendige Selbstbehalt.
    const r = berechneKindesunterhalt({
      nettoEinkommen: 2000, alterKind: 19, anzahlBerechtigte: 1, schulausbildung: true,
    });
    expect(r.privilegiert).toBe(true);
    expect(r.selbstbehalt).toBe(1450);
  });

  it('privilegiert nicht mehr ab 21 Jahren', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 2000, alterKind: 21, anzahlBerechtigte: 1, schulausbildung: true,
    });
    expect(r.privilegiert).toBe(false);
    expect(r.selbstbehalt).toBe(1750);
  });
});

describe('berechneKindesunterhalt – Selbstbehalt und Mangelfall', () => {
  it('nutzt den niedrigeren Selbstbehalt für nicht Erwerbstätige', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 2000, alterKind: 8, anzahlBerechtigte: 1, erwerbstaetig: false,
    });
    expect(r.selbstbehalt).toBe(1200);
  });

  it('kürzt im Mangelfall auf das über dem Selbstbehalt liegende Einkommen', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 1700, alterKind: 15, anzahlBerechtigte: 1,
    });
    expect(r.mangelfall).toBe(true);
    expect(r.zahlbetrag).toBe(250); // 1.700 − 1.450
  });

  it('ergibt keinen Unterhalt unterhalb des Selbstbehalts', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 1300, alterKind: 8, anzahlBerechtigte: 1,
    });
    expect(r.zahlbetrag).toBe(0);
    expect(r.mangelfall).toBe(true);
  });

  it('verteilt die Last im Mangelfall auf alle Berechtigten', () => {
    // 1.900 € − 1.450 € Selbstbehalt = 450 € für zwei Berechtigte.
    const r = berechneKindesunterhalt({
      nettoEinkommen: 1900, alterKind: 15, anzahlBerechtigte: 2,
    });
    expect(r.mangelfall).toBe(true);
    expect(r.zahlbetrag).toBe(225);
  });
});

describe('berechneKindesunterhalt – Einkommen über der Tabelle', () => {
  it('kappt bei Gruppe 15 und weist darauf hin', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 15000, alterKind: 8, anzahlBerechtigte: 2,
    });
    expect(r.einkommensgruppe).toBe(15);
    expect(r.ueberTabelle).toBe(true);
  });

  it('bleibt innerhalb der Tabelle ohne Hinweis', () => {
    const r = berechneKindesunterhalt({
      nettoEinkommen: 5000, alterKind: 8, anzahlBerechtigte: 2,
    });
    expect(r.ueberTabelle).toBe(false);
  });
});
