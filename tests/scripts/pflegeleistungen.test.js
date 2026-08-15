import { describe, it, expect } from 'vitest';
import {
  PFLEGELEISTUNGEN_STAND,
  PFLEGEGELD,
  PFLEGESACHLEISTUNG,
  VOLLSTATIONAER,
  VOLLSTATIONAER_ZUSCHUSS_GRAD1,
  ENTLASTUNGSBETRAG,
  EIGENANTEIL_STAND,
  HEIMKOSTEN,
  BUND,
  leistungszuschlagSatz,
  berechneHeimEigenanteil,
  stationaereLeistung,
} from '../../public/scripts/pflegeleistungen.js';
import { BUNDESLAENDER } from '../../public/scripts/bundeslaender.js';

// Die Leistungsbeträge stehen unmittelbar im Gesetz und wurden am 15.08.2026 am
// Text von gesetze-im-internet.de geprüft. Der Pflege-Rechner führte vorher
// eigene Zahlen: 332 € für Pflegegrad 1, 761 € für Grad 2 und so fort. Das
// waren Sachleistungsbeträge aus der Zeit vor 2025, um einen Grad verschoben
// und als Pflegegeld bezeichnet.
describe('Leistungsbeträge nach dem SGB XI', () => {
  it('trägt den Rechtsstand der Leistungsbeträge', () => {
    expect(PFLEGELEISTUNGEN_STAND).toBe('2025-01-01');
  });

  it('Pflegegeld nach § 37 Abs. 1 Satz 3', () => {
    expect(PFLEGEGELD).toEqual({ 2: 347, 3: 599, 4: 800, 5: 990 });
  });

  it('kennt kein Pflegegeld für Pflegegrad 1', () => {
    expect(PFLEGEGELD[1]).toBeUndefined();
  });

  it('Pflegesachleistung nach § 36 Abs. 3', () => {
    expect(PFLEGESACHLEISTUNG).toEqual({ 2: 796, 3: 1497, 4: 1859, 5: 2299 });
  });

  it('vollstationäre Leistung nach § 43 Abs. 2 Satz 2', () => {
    expect(VOLLSTATIONAER).toEqual({ 2: 805, 3: 1319, 4: 1855, 5: 2096 });
  });

  it('Entlastungsbetrag und Zuschuss für Grad 1 betragen je 131 €', () => {
    expect(ENTLASTUNGSBETRAG).toBe(131);
    expect(VOLLSTATIONAER_ZUSCHUSS_GRAD1).toBe(131);
  });

  it('Sachleistung liegt in jedem Pflegegrad über dem Pflegegeld', () => {
    for (const grad of [2, 3, 4, 5]) {
      expect(PFLEGESACHLEISTUNG[grad]).toBeGreaterThan(PFLEGEGELD[grad]);
    }
  });

  it('stationaereLeistung gibt für Grad 1 den Zuschuss, sonst den Leistungsbetrag', () => {
    expect(stationaereLeistung(1)).toBe(131);
    expect(stationaereLeistung(2)).toBe(805);
    expect(stationaereLeistung(5)).toBe(2096);
  });
});

// § 43c staffelt nach "bis einschließlich zwölf Monate", "seit mehr als zwölf",
// "mehr als 24" und "mehr als 36 Monaten".
describe('Leistungszuschlag nach § 43c SGB XI', () => {
  it('bis einschließlich zwölf Monate: 15 Prozent', () => {
    expect(leistungszuschlagSatz(0)).toBe(0.15);
    expect(leistungszuschlagSatz(12)).toBe(0.15);
  });

  it('mehr als zwölf Monate: 30 Prozent', () => {
    expect(leistungszuschlagSatz(13)).toBe(0.30);
    expect(leistungszuschlagSatz(24)).toBe(0.30);
  });

  it('mehr als 24 Monate: 50 Prozent', () => {
    expect(leistungszuschlagSatz(25)).toBe(0.50);
    expect(leistungszuschlagSatz(36)).toBe(0.50);
  });

  it('mehr als 36 Monate: 75 Prozent', () => {
    expect(leistungszuschlagSatz(37)).toBe(0.75);
    expect(leistungszuschlagSatz(240)).toBe(0.75);
  });

  it('behandelt fehlende und unsinnige Angaben wie den ersten Monat', () => {
    expect(leistungszuschlagSatz(undefined)).toBe(0.15);
    expect(leistungszuschlagSatz(-5)).toBe(0.15);
  });
});

// Gegenprobe zur veröffentlichten vdek-Tabelle vom 1. Juli 2026. Sie weist die
// Zuschlagsbeträge selbst aus; stimmen sie mit 15/30/50/75 Prozent des EEE
// überein, ist die Bemessungsgrundlage bestätigt – einschließlich der
// Ausbildungskosten, die im EEE enthalten sind.
const VDEK_ZUSCHLAEGE = {
  BUND: [313, 626, 1044, 1566],
  BW: [360, 720, 1201, 1801],
  BY: [328, 656, 1093, 1639],
  BE: [362, 723, 1205, 1808],
  BB: [326, 652, 1086, 1629],
  HB: [344, 689, 1148, 1722],
  HH: [324, 648, 1080, 1619],
  HE: [335, 670, 1117, 1675],
  MV: [311, 621, 1035, 1553],
  NI: [279, 559, 931, 1397],
  NW: [297, 595, 992, 1487],
  RP: [265, 530, 883, 1325],
  SL: [326, 653, 1088, 1632],
  SN: [320, 641, 1068, 1602],
  ST: [299, 598, 997, 1495],
  SH: [267, 535, 891, 1337],
  TH: [307, 614, 1023, 1534],
};

const VDEK_EIGENBETEILIGUNG_OHNE_ZUSCHUSS = {
  BUND: 3677, BW: 4017, BY: 3598, BE: 3749, BB: 3476, HB: 4105, HH: 3805, HE: 3766,
  MV: 3342, NI: 3287, NW: 3968, RP: 3554, SL: 4021, SN: 3472, ST: 3190, SH: 3415, TH: 3470,
};

describe('Eigenanteil im Pflegeheim', () => {
  it('trägt den Stand der vdek-Erhebung', () => {
    expect(EIGENANTEIL_STAND).toBe('2026-07-01');
  });

  it('führt alle 16 Länder und den Bund', () => {
    expect(Object.keys(HEIMKOSTEN).sort()).toEqual([BUND, ...Object.keys(BUNDESLAENDER)].sort());
  });

  it('weist die Ausbildungskosten als Teil des EEE aus', () => {
    for (const [land, kosten] of Object.entries(HEIMKOSTEN)) {
      expect(kosten.ausbildung, land).toBeLessThan(kosten.eee);
    }
  });

  it.each(Object.keys(VDEK_EIGENBETEILIGUNG_OHNE_ZUSCHUSS))(
    'summiert die Eigenbeteiligung ohne Zuschuss wie vdek: %s',
    (land) => {
      const r = berechneHeimEigenanteil({ land, monateImHeim: 0 });
      expect(r.ohneZuschlag).toBe(VDEK_EIGENBETEILIGUNG_OHNE_ZUSCHUSS[land]);
    }
  );

  it.each(Object.keys(VDEK_ZUSCHLAEGE))('trifft die vdek-Zuschläge aller vier Stufen: %s', (land) => {
    const monate = [12, 13, 25, 37];
    const gerechnet = monate.map((m) => berechneHeimEigenanteil({ land, monateImHeim: m }).zuschlag);
    expect(gerechnet).toEqual(VDEK_ZUSCHLAEGE[land]);
  });

  it('mindert nur den EEE, nie Unterkunft, Verpflegung oder Investitionskosten', () => {
    const kurz = berechneHeimEigenanteil({ land: BUND, monateImHeim: 1 });
    const lang = berechneHeimEigenanteil({ land: BUND, monateImHeim: 48 });
    expect(lang.unterkunftVerpflegung).toBe(kurz.unterkunftVerpflegung);
    expect(lang.investition).toBe(kurz.investition);
    expect(kurz.eigenanteil - lang.eigenanteil).toBe(lang.zuschlag - kurz.zuschlag);
  });

  it('senkt den Eigenanteil mit jeder Stufe', () => {
    const stufen = [6, 18, 30, 48].map((m) => berechneHeimEigenanteil({ land: BUND, monateImHeim: m }).eigenanteil);
    expect(stufen).toEqual([...stufen].sort((a, b) => b - a));
    expect(new Set(stufen).size).toBe(4);
  });

  it('rechnet ohne Angabe mit dem Bundesdurchschnitt', () => {
    expect(berechneHeimEigenanteil({ monateImHeim: 6 }).land).toBe(BUND);
  });

  it('weist unbekannte Länderkürzel zurück', () => {
    expect(() => berechneHeimEigenanteil({ land: 'XX', monateImHeim: 6 })).toThrow();
  });
});
