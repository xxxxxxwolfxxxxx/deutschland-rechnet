import { describe, it, expect } from 'vitest';
import { berechneBetreuungskosten } from '../../public/scripts/betreuungskosten.js';

// Schätzmodell für den Elternbeitrag zur Kindertagesbetreuung. Die Beiträge
// sind Landes- und Kommunalrecht (§ 90 SGB VIII) und reichen von der
// vollständigen Beitragsfreiheit bis zu einkommensabhängigen Staffeln – eine
// bundesweit gültige Formel gibt es nicht. Getestet wird deshalb die
// Modelllogik: Faktoren für Umfang, Region und Alter, der Einkommenszuschlag
// und der bei 50 Prozent gedeckelte Geschwisterrabatt.

const BASIS = { einkommen: 50000, kinder: 1, stunden: 6, alter: 'kita', region: 'mid' };

describe('berechneBetreuungskosten – Grundfall', () => {
  it('150 € Grundgebühr plus 0,2 % des Einkommens über 30.000 €', () => {
    const r = berechneBetreuungskosten(BASIS);

    expect(r.grundgebuehr).toBe(150);
    expect(r.einkommenszuschlag).toBe(40);
    expect(r.kostenProKind).toBe(190);
    expect(r.elternbeitrag).toBe(190);
  });

  it('bis 30.000 € Einkommen fällt kein Zuschlag an', () => {
    const r = berechneBetreuungskosten({ ...BASIS, einkommen: 28000 });

    expect(r.einkommenszuschlag).toBe(0);
    expect(r.kostenProKind).toBe(150);
  });

  it('der Zuschlag steigt linear mit dem Einkommen', () => {
    const r = berechneBetreuungskosten({ ...BASIS, einkommen: 80000 });

    expect(r.einkommenszuschlag).toBe(100);
  });
});

describe('berechneBetreuungskosten – Faktoren', () => {
  it('mehr Betreuungsstunden kosten mehr', () => {
    const stunden = [4, 6, 8, 10].map(
      (s) => berechneBetreuungskosten({ ...BASIS, stunden: s }).grundgebuehr,
    );

    expect(stunden).toEqual([105, 150, 180, 210]);
  });

  it('unbekannter Stundenumfang rechnet mit dem Faktor für 6 Stunden', () => {
    expect(berechneBetreuungskosten({ ...BASIS, stunden: 7 }).grundgebuehr).toBe(150);
  });

  it('die Krippe kostet das Anderthalbfache der Kita', () => {
    const kita = berechneBetreuungskosten({ ...BASIS, alter: 'kita' });
    const krippe = berechneBetreuungskosten({ ...BASIS, alter: 'krippe' });

    expect(krippe.grundgebuehr).toBe(kita.grundgebuehr * 1.5);
  });

  it('teure Regionen kosten 40 % mehr, günstige 30 % weniger', () => {
    expect(berechneBetreuungskosten({ ...BASIS, region: 'low' }).grundgebuehr).toBe(105);
    expect(berechneBetreuungskosten({ ...BASIS, region: 'mid' }).grundgebuehr).toBe(150);
    expect(berechneBetreuungskosten({ ...BASIS, region: 'high' }).grundgebuehr).toBe(210);
  });

  it('unbekannte Region und unbekanntes Alter rechnen neutral', () => {
    const r = berechneBetreuungskosten({ ...BASIS, region: 'unbekannt', alter: 'hort' });

    expect(r.grundgebuehr).toBe(150);
  });
});

describe('berechneBetreuungskosten – Geschwisterrabatt', () => {
  it('ein Kind bekommt keinen Rabatt', () => {
    const r = berechneBetreuungskosten(BASIS);

    expect(r.geschwisterRabatt).toBe(0);
    expect(r.elternbeitrag).toBe(r.gesamtkosten);
  });

  it('das zweite Kind bringt 25 % Rabatt auf einen Kindsbeitrag', () => {
    const r = berechneBetreuungskosten({ ...BASIS, kinder: 2 });

    expect(r.gesamtkosten).toBe(380);
    expect(r.geschwisterRabatt).toBe(47.5);
    expect(r.elternbeitrag).toBe(332.5);
  });

  it('der Rabatt ist bei 50 % eines Kindsbeitrags gedeckelt', () => {
    const drei = berechneBetreuungskosten({ ...BASIS, kinder: 3 });
    const fuenf = berechneBetreuungskosten({ ...BASIS, kinder: 5 });

    expect(drei.geschwisterRabatt).toBe(95);
    expect(fuenf.geschwisterRabatt).toBe(95);
  });

  it('der Elternbeitrag steigt trotz Rabatt mit jedem weiteren Kind', () => {
    const beitraege = [1, 2, 3, 4].map(
      (kinder) => berechneBetreuungskosten({ ...BASIS, kinder }).elternbeitrag,
    );

    for (let i = 1; i < beitraege.length; i++) {
      expect(beitraege[i]).toBeGreaterThan(beitraege[i - 1]);
    }
  });

  it('wird nie negativ', () => {
    const r = berechneBetreuungskosten({ ...BASIS, kinder: 10 });

    expect(r.elternbeitrag).toBeGreaterThanOrEqual(0);
  });
});
