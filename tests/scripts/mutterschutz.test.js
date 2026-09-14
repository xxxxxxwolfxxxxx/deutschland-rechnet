import { describe, it, expect } from 'vitest';
import { berechneMutterschutz } from '../../public/scripts/mutterschutz.js';

// § 3 MuSchG, abgerufen am 14.09.2026.

describe('berechneMutterschutz – Entbindung am Termin', () => {
  const r = berechneMutterschutz({ geburtstermin: '2026-11-20' });

  it('beginnt 6 Wochen vor dem Termin', () => {
    expect(r.beginn).toBe('2026-10-09');
  });

  it('endet 8 Wochen nach der Geburt', () => {
    expect(r.ende).toBe('2027-01-15');
    expect(r.tageGesamt).toBe(98);
  });
});

describe('berechneMutterschutz – verlängerte Frist (§ 3 Abs. 2 Satz 2)', () => {
  it('12 Wochen bei Früh-, Mehrlingsgeburt oder Behinderung', () => {
    expect(berechneMutterschutz({ geburtstermin: '2026-11-20', verlaengert: true }).ende).toBe('2027-02-12');
  });

  it('ältere Schnittstelle fruehgeburt', () => {
    expect(berechneMutterschutz({ geburtstermin: '2026-11-20', fruehgeburt: true }).ende).toBe('2027-02-12');
  });
});

describe('berechneMutterschutz – Entbindung vor oder nach dem Termin', () => {
  it('vorzeitige Entbindung: nicht genommene Tage werden angehängt (§ 3 Abs. 2 Satz 3)', () => {
    const r = berechneMutterschutz({ geburtstermin: '2026-11-20', entbindung: '2026-11-10' });

    expect(r.verkuerzung).toBe(10);
    expect(r.ende).toBe('2027-01-15'); // 10.11. + 56 + 10 Tage
    expect(r.tageGesamt).toBe(98);
  });

  it('spätere Entbindung: die Frist davor verlängert sich, 8 Wochen ab Geburt', () => {
    const r = berechneMutterschutz({ geburtstermin: '2026-11-20', entbindung: '2026-11-27' });

    expect(r.beginn).toBe('2026-10-09');
    expect(r.verkuerzung).toBe(0);
    expect(r.ende).toBe('2027-01-22');
    expect(r.tageGesamt).toBe(105);
  });

  it('Frühgeburt mit verlängerter Frist und Verkürzung', () => {
    const r = berechneMutterschutz({ geburtstermin: '2026-11-20', entbindung: '2026-10-20', verlaengert: true });
    expect(r.ende).toBe('2027-02-12'); // 20.10. + 84 + 31 Tage
  });
});
