import { describe, it, expect } from 'vitest';
import {
  AG_FRISTEN,
  GRUNDFRIST_TAGE,
  KLAGEFRIST_WOCHEN,
  KSCHG_WARTEZEIT_MONATE,
  PROBEZEIT_FRIST_TAGE,
  PROBEZEIT_MAX_MONATE,
  berechneKuendigungsfrist,
  betriebszugehoerigkeitJahre,
  klagefristEnde,
  kuendigungsschutzAb,
} from '../../public/scripts/kuendigungsfrist.js';

describe('Staffel des § 622 Abs. 2 BGB', () => {
  it('bildet alle sieben Stufen des Gesetzes ab', () => {
    const stufen = AG_FRISTEN.filter(f => f.abJahre > 0);
    expect(stufen.map(f => f.abJahre)).toEqual([2, 5, 8, 10, 12, 15, 20]);
    expect(stufen.map(f => f.monate)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('führt die Grundfrist des Absatzes 1 als Vier-Wochen-Frist, nicht als Monatsfrist', () => {
    // Die Vorgängerversion trug hier "monate: 1" und dazu den Text
    // "4 Wochen zum 15. oder Monatsende" – Text und Rechnung widersprachen sich.
    const grund = AG_FRISTEN.find(f => f.abJahre === 0);
    expect(grund.monate).toBe(0);
    expect(grund.tage).toBe(GRUNDFRIST_TAGE);
  });
});

describe('betriebszugehoerigkeitJahre', () => {
  it('zählt vollendete Kalenderjahre', () => {
    expect(betriebszugehoerigkeitJahre('2019-03-01', '2025-01-10')).toBe(5);
    expect(betriebszugehoerigkeitJahre('2020-01-10', '2025-01-10')).toBe(5);
    expect(betriebszugehoerigkeitJahre('2020-01-10', '2025-01-09')).toBe(4);
  });

  it('rechnet kalendarisch statt mit 365,25 Tagen im Jahr', () => {
    // 01.03.2021 bis 01.03.2023 sind exakt zwei Jahre, aber nur 730 Tage.
    // Geteilt durch 365,25 ergibt das 1,998 – die Vorgängerversion stufte
    // hier auf ein Jahr zurück und verkürzte die Frist um einen ganzen Monat.
    expect(betriebszugehoerigkeitJahre('2021-03-01', '2023-03-01')).toBe(2);
  });

  it('behandelt den 29. Februar als Eintrittstag', () => {
    expect(betriebszugehoerigkeitJahre('2024-02-29', '2025-02-28')).toBe(1);
  });
});

describe('Kündigung durch den Arbeitgeber', () => {
  it('rechnet das Beispiel des Leitfadens: zwei Monate ab dem 10.01. enden am 31.03.', () => {
    // Regressionstest: Die Vorgängerversion lieferte hier den 28.02.2025,
    // während der Leitfaden derselben Seite den 31.03.2025 nannte.
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2019-03-01',
      kuendigungsdatum: '2025-01-10',
      seite: 'arbeitgeber',
    });
    expect(r.monate).toBe(2);
    expect(r.endDatum).toBe('2025-03-31');
  });

  it('wendet in den ersten zwei Jahren die Grundfrist zum 15. oder Monatsende an', () => {
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2024-06-01',
      kuendigungsdatum: '2025-01-10',
      seite: 'arbeitgeber',
    });
    expect(r.monate).toBe(0);
    expect(r.wochen).toBe(4);
    expect(r.endDatum).toBe('2025-02-15');
  });

  it('verlängert die Frist an jeder Stufengrenze taggenau', () => {
    const ende = zugang => berechneKuendigungsfrist({
      eintrittsdatum: '2000-01-10',
      kuendigungsdatum: zugang,
      seite: 'arbeitgeber',
    }).monate;
    expect(ende('2002-01-09')).toBe(0);
    expect(ende('2002-01-10')).toBe(1);
    expect(ende('2005-01-10')).toBe(2);
    expect(ende('2008-01-10')).toBe(3);
    expect(ende('2010-01-10')).toBe(4);
    expect(ende('2012-01-10')).toBe(5);
    expect(ende('2015-01-10')).toBe(6);
    expect(ende('2020-01-10')).toBe(7);
  });

  it('nennt die Fundstelle der angewandten Stufe', () => {
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2010-01-01',
      kuendigungsdatum: '2025-06-10',
      seite: 'arbeitgeber',
    });
    expect(r.grundlage).toContain('§ 622 Abs. 2');
  });
});

describe('Kündigung durch den Arbeitnehmer (§ 622 Abs. 1 BGB)', () => {
  it('bleibt bei vier Wochen, egal wie lange das Arbeitsverhältnis besteht', () => {
    // Die alte FAQ behauptete "unter 2 Jahren gelten 2 Wochen". Das steht
    // nirgends im Gesetz: zwei Wochen gibt es nur in der Probezeit.
    for (const eintritt of ['2024-11-01', '2020-01-01', '1995-01-01']) {
      const r = berechneKuendigungsfrist({
        eintrittsdatum: eintritt,
        kuendigungsdatum: '2025-01-10',
        seite: 'arbeitnehmer',
      });
      expect(r.monate).toBe(0);
      expect(r.wochen).toBe(4);
      expect(r.endDatum).toBe('2025-02-15');
    }
  });

  it('ist nie länger als die Frist des Arbeitgebers (§ 622 Abs. 6 BGB)', () => {
    for (const eintritt of ['2024-01-01', '2015-01-01', '2000-01-01']) {
      const an = berechneKuendigungsfrist({ eintrittsdatum: eintritt, kuendigungsdatum: '2025-06-10', seite: 'arbeitnehmer' });
      const ag = berechneKuendigungsfrist({ eintrittsdatum: eintritt, kuendigungsdatum: '2025-06-10', seite: 'arbeitgeber' });
      expect(an.endDatum <= ag.endDatum).toBe(true);
    }
  });
});

describe('Termin der Grundfrist: zum Fünfzehnten oder zum Monatsende', () => {
  it('nimmt den Fünfzehnten, wenn die vier Wochen bis dahin abgelaufen sind', () => {
    const r = berechneKuendigungsfrist({ eintrittsdatum: '2024-01-01', kuendigungsdatum: '2025-01-18', seite: 'arbeitnehmer' });
    expect(r.fristablauf).toBe('2025-02-15');
    expect(r.endDatum).toBe('2025-02-15');
  });

  it('rückt auf das Monatsende, wenn der Fünfzehnte schon verstrichen ist', () => {
    const r = berechneKuendigungsfrist({ eintrittsdatum: '2024-01-01', kuendigungsdatum: '2025-01-19', seite: 'arbeitnehmer' });
    expect(r.fristablauf).toBe('2025-02-16');
    expect(r.endDatum).toBe('2025-02-28');
  });
});

describe('Monatsfristen nach §§ 187, 188 BGB', () => {
  it('endet nie vor Ablauf der Frist', () => {
    for (const zugang of ['2025-01-01', '2025-01-15', '2025-01-31', '2025-02-28', '2024-02-29']) {
      const r = berechneKuendigungsfrist({ eintrittsdatum: '2000-01-01', kuendigungsdatum: zugang, seite: 'arbeitgeber' });
      expect(r.endDatum >= r.fristablauf).toBe(true);
    }
  });

  it('klemmt auf den letzten Tag des Monats, wenn die Zahl dort fehlt (§ 188 Abs. 3 BGB)', () => {
    const r = berechneKuendigungsfrist({ eintrittsdatum: '2022-01-01', kuendigungsdatum: '2025-01-31', seite: 'arbeitgeber' });
    expect(r.monate).toBe(1);
    expect(r.fristablauf).toBe('2025-02-28');
    expect(r.endDatum).toBe('2025-02-28');
  });

  it('trifft im Schaltjahr den 29. Februar', () => {
    const r = berechneKuendigungsfrist({ eintrittsdatum: '2021-01-01', kuendigungsdatum: '2024-01-31', seite: 'arbeitgeber' });
    expect(r.fristablauf).toBe('2024-02-29');
    expect(r.endDatum).toBe('2024-02-29');
  });

  it('endet immer auf einem Monatsletzten', () => {
    for (const zugang of ['2025-01-05', '2025-03-17', '2025-11-30']) {
      const r = berechneKuendigungsfrist({ eintrittsdatum: '2015-01-01', kuendigungsdatum: zugang, seite: 'arbeitgeber' });
      const [j, m, t] = r.endDatum.split('-').map(Number);
      expect(t).toBe(new Date(Date.UTC(j, m, 0)).getUTCDate());
    }
  });
});

describe('Probezeit (§ 622 Abs. 3 BGB)', () => {
  it('verkürzt auf zwei Wochen ohne Bindung an einen Termin', () => {
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2025-01-01',
      kuendigungsdatum: '2025-03-10',
      seite: 'arbeitgeber',
      probezeitVereinbart: true,
    });
    expect(r.inProbezeit).toBe(true);
    expect(r.tage).toBe(PROBEZEIT_FRIST_TAGE);
    expect(r.endDatum).toBe('2025-03-24');
  });

  it('gilt für beide Seiten gleich', () => {
    const opts = { eintrittsdatum: '2025-01-01', kuendigungsdatum: '2025-03-10', probezeitVereinbart: true };
    const an = berechneKuendigungsfrist({ ...opts, seite: 'arbeitnehmer' });
    const ag = berechneKuendigungsfrist({ ...opts, seite: 'arbeitgeber' });
    expect(an.endDatum).toBe(ag.endDatum);
  });

  it('greift nur, wenn eine Probezeit überhaupt vereinbart ist', () => {
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2025-01-01',
      kuendigungsdatum: '2025-03-10',
      seite: 'arbeitgeber',
      probezeitVereinbart: false,
    });
    expect(r.inProbezeit).toBe(false);
    expect(r.wochen).toBe(4);
  });

  it('gilt noch, wenn die Kündigung am letzten Tag der Probezeit zugeht', () => {
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2025-01-01',
      kuendigungsdatum: '2025-06-30',
      seite: 'arbeitgeber',
      probezeitVereinbart: true,
    });
    expect(r.probezeitEnde).toBe('2025-06-30');
    expect(r.inProbezeit).toBe(true);
    expect(r.endDatum).toBe('2025-07-14');
  });

  it('gilt nicht mehr, wenn die Kündigung einen Tag später zugeht', () => {
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2025-01-01',
      kuendigungsdatum: '2025-07-01',
      seite: 'arbeitgeber',
      probezeitVereinbart: true,
    });
    expect(r.inProbezeit).toBe(false);
  });

  it('deckelt eine zu lang vereinbarte Probezeit auf sechs Monate', () => {
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2025-01-01',
      kuendigungsdatum: '2025-08-01',
      seite: 'arbeitgeber',
      probezeitVereinbart: true,
      probezeitMonate: 12,
    });
    expect(PROBEZEIT_MAX_MONATE).toBe(6);
    expect(r.probezeitEnde).toBe('2025-06-30');
    expect(r.inProbezeit).toBe(false);
  });

  it('übernimmt eine kürzer vereinbarte Probezeit', () => {
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2025-01-01',
      kuendigungsdatum: '2025-04-01',
      seite: 'arbeitgeber',
      probezeitVereinbart: true,
      probezeitMonate: 3,
    });
    expect(r.probezeitEnde).toBe('2025-03-31');
    expect(r.inProbezeit).toBe(false);
  });
});

describe('Kündigungsschutz nach § 1 Abs. 1 KSchG', () => {
  it('greift erst, wenn das Arbeitsverhältnis länger als sechs Monate bestanden hat', () => {
    expect(KSCHG_WARTEZEIT_MONATE).toBe(6);
    expect(kuendigungsschutzAb('2025-01-01')).toBe('2025-07-01');
  });

  it('weist im Ergebnis aus, ob die Wartezeit bei Zugang erfüllt war', () => {
    const frueh = berechneKuendigungsfrist({ eintrittsdatum: '2025-01-01', kuendigungsdatum: '2025-05-02', seite: 'arbeitgeber' });
    const spaet = berechneKuendigungsfrist({ eintrittsdatum: '2025-01-01', kuendigungsdatum: '2025-08-02', seite: 'arbeitgeber' });
    expect(frueh.kuendigungsschutz.greift).toBe(false);
    expect(spaet.kuendigungsschutz.greift).toBe(true);
  });

  it('trennt die Wartezeit von der Probezeit – beide laufen unabhängig', () => {
    const r = berechneKuendigungsfrist({
      eintrittsdatum: '2025-01-01',
      kuendigungsdatum: '2025-05-02',
      seite: 'arbeitgeber',
      probezeitVereinbart: true,
      probezeitMonate: 3,
    });
    expect(r.inProbezeit).toBe(false);
    expect(r.kuendigungsschutz.greift).toBe(false);
  });
});

describe('Klagefrist nach § 4 KSchG', () => {
  it('endet drei Wochen nach Zugang der Kündigung', () => {
    expect(KLAGEFRIST_WOCHEN).toBe(3);
    expect(klagefristEnde('2025-01-10')).toBe('2025-01-31');
  });

  it('rechnet über den Monatswechsel hinweg', () => {
    expect(klagefristEnde('2025-02-20')).toBe('2025-03-13');
  });

  it('wird in jedem Ergebnis mitgeliefert', () => {
    const r = berechneKuendigungsfrist({ eintrittsdatum: '2020-01-01', kuendigungsdatum: '2025-01-10', seite: 'arbeitgeber' });
    expect(r.klagefristEnde).toBe('2025-01-31');
  });
});

describe('Eingabeprüfung', () => {
  it('weist eine Kündigung vor dem Eintritt zurück', () => {
    expect(() => berechneKuendigungsfrist({
      eintrittsdatum: '2025-06-01',
      kuendigungsdatum: '2025-01-01',
      seite: 'arbeitgeber',
    })).toThrow();
  });

  it('weist unbrauchbare Datumsangaben zurück', () => {
    expect(() => berechneKuendigungsfrist({
      eintrittsdatum: '',
      kuendigungsdatum: '2025-01-01',
      seite: 'arbeitgeber',
    })).toThrow();
  });
});
