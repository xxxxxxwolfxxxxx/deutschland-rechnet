import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  berechneSchwangerschaft,
  TRAGZEIT_TAGE,
  SCHUTZFRIST_VOR_GEBURT_TAGE,
  SCHUTZFRIST_NACH_GEBURT_TAGE,
  MUTTERSCHAFTSGELD_HOECHSTBETRAG_TAG,
} from '../../public/scripts/schwangerschaft.js';

// Rechtsgrundlagen: § 3 MuSchG (Schutzfristen), § 20 MuSchG (Zuschuss des
// Arbeitgebers), § 24i SGB V (Mutterschaftsgeld der Krankenkasse). Der
// Geburtstermin folgt der Naegele-Regel.
//
// Bis zum 14.08.2026 gab das Modul die Schwangerschaftswoche als ssW und
// ssWTage zurück, die Seite las aber r.ssw und r.sswTage – angezeigt wurde
// deshalb "undefined (undefined Tage)". Der Arbeitgeberzuschuss steckte
// zudem ohne eigenen Ausweis in der Gesamtsumme.

const LETZTE_PERIODE = '2026-01-01';

describe('Rechengrößen', () => {
  it('Naegele-Regel: 280 Tage', () => {
    expect(TRAGZEIT_TAGE).toBe(280);
  });

  it('Schutzfrist 6 Wochen vor und 8 Wochen nach der Entbindung (§ 3 MuSchG)', () => {
    expect(SCHUTZFRIST_VOR_GEBURT_TAGE).toBe(42);
    expect(SCHUTZFRIST_NACH_GEBURT_TAGE).toBe(56);
  });

  it('Höchstbetrag der Krankenkasse 13 € je Kalendertag (§ 24i Abs. 2 SGB V)', () => {
    expect(MUTTERSCHAFTSGELD_HOECHSTBETRAG_TAG).toBe(13);
  });
});

describe('Geburtstermin (Naegele-Regel)', () => {
  it('liegt 280 Tage nach dem ersten Tag der letzten Periode', () => {
    const r = berechneSchwangerschaft({ letztePeriode: '2026-01-01', netto: 2200 });

    expect(r.geburtstermin.toISOString().slice(0, 10)).toBe('2026-10-08');
  });

  it('rechnet über den Jahreswechsel', () => {
    const r = berechneSchwangerschaft({ letztePeriode: '2026-06-15', netto: 2200 });

    expect(r.geburtstermin.toISOString().slice(0, 10)).toBe('2027-03-22');
  });
});

describe('Schwangerschaftswoche', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('zählt abgeschlossene Wochen und Resttage seit der letzten Periode', () => {
    // 38 Tage nach dem 01.01. sind 5 abgeschlossene Wochen und 3 Tage (5+3).
    vi.setSystemTime(new Date('2026-02-08T12:00:00Z'));
    const r = berechneSchwangerschaft({ letztePeriode: LETZTE_PERIODE, netto: 2200 });

    expect(r.ssw).toBe(5);
    expect(r.sswTage).toBe(3);
  });

  it('am ersten Tag der letzten Periode steht die Zählung bei 0+0', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const r = berechneSchwangerschaft({ letztePeriode: LETZTE_PERIODE, netto: 2200 });

    expect(r.ssw).toBe(0);
    expect(r.sswTage).toBe(0);
  });

  it('am errechneten Termin sind 40 Wochen erreicht', () => {
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    const r = berechneSchwangerschaft({ letztePeriode: LETZTE_PERIODE, netto: 2200 });

    expect(r.ssw).toBe(40);
    expect(r.sswTage).toBe(0);
  });

  it('liefert die Felder unter den Namen, die die Seite ausliest', () => {
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
    const r = berechneSchwangerschaft({ letztePeriode: LETZTE_PERIODE, netto: 2200 });

    expect(r.ssw).toBeTypeOf('number');
    expect(r.sswTage).toBeTypeOf('number');
  });
});

describe('Mutterschaftsgeld der Krankenkasse (§ 24i SGB V)', () => {
  it('ist auf 13 € je Kalendertag gedeckelt', () => {
    const r = berechneSchwangerschaft({ letztePeriode: LETZTE_PERIODE, netto: 2200 });

    expect(r.mutterschaftsgeldTag).toBe(13);
  });

  it('zahlt bei niedrigem Nettoentgelt nur das tatsächliche Netto je Tag', () => {
    // 300 € im Monat sind 10 € je Kalendertag und damit weniger als 13 €.
    const r = berechneSchwangerschaft({ letztePeriode: LETZTE_PERIODE, netto: 300 });

    expect(r.mutterschaftsgeldTag).toBe(10);
  });

  it('verteilt sich auf 42 Tage vor und 56 Tage nach der Entbindung', () => {
    const r = berechneSchwangerschaft({ letztePeriode: LETZTE_PERIODE, netto: 2200 });

    expect(r.mutterschaftsgeldVorGeburt).toBe(13 * 42);
    expect(r.mutterschaftsgeldNachGeburt).toBe(13 * 56);
  });
});

describe('Arbeitgeberzuschuss (§ 20 MuSchG)', () => {
  it('gleicht die Differenz zwischen 13 € und dem Nettoentgelt je Kalendertag aus', () => {
    // 2400 € Netto sind 80 € je Kalendertag, der Zuschuss also 67 € × 98 Tage.
    const r = berechneSchwangerschaft({
      letztePeriode: LETZTE_PERIODE,
      netto: 2400,
      arbeitgeberZuschuss: true,
    });

    expect(r.arbeitgeberzuschuss).toBe(67 * 98);
  });

  it('deckt zusammen mit dem Mutterschaftsgeld das volle Nettoentgelt der Schutzfrist', () => {
    const netto = 2400;
    const r = berechneSchwangerschaft({
      letztePeriode: LETZTE_PERIODE,
      netto,
      arbeitgeberZuschuss: true,
    });

    expect(r.gesamt).toBeCloseTo((netto / 30) * 98, 2);
  });

  it('entfällt ohne Zuschussvereinbarung', () => {
    const r = berechneSchwangerschaft({
      letztePeriode: LETZTE_PERIODE,
      netto: 2400,
      arbeitgeberZuschuss: false,
    });

    expect(r.arbeitgeberzuschuss).toBe(0);
    expect(r.gesamt).toBe(13 * 98);
  });

  it('bleibt bei einem Nettoentgelt unter 13 € je Tag bei null', () => {
    const r = berechneSchwangerschaft({
      letztePeriode: LETZTE_PERIODE,
      netto: 300,
      arbeitgeberZuschuss: true,
    });

    expect(r.arbeitgeberzuschuss).toBe(0);
    expect(r.gesamt).toBe(10 * 98);
  });
});
