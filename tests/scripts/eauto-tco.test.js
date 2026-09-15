import { describe, it, expect } from 'vitest';
import { berechneTco, vergleicheTco } from '../../public/scripts/eauto-tco.js';
import {
  corsaBenzin,
  corsaElektro,
  BENZINPREIS,
  ADAC_STROMPREIS,
  ADAC_HALTEDAUER_MONATE,
  ADAC_KM_PRO_JAHR,
  ADAC_PFLEGEPAUSCHALE_PRO_JAHR,
  adacVerbrauchJe100km,
} from '../../public/scripts/adac-autokosten.js';

const ausAdac = (f, preis) => ({
  kaufpreis: f.grundpreis,
  restwert: f.grundpreis - f.wertverlust * ADAC_HALTEDAUER_MONATE,
  verbrauchJe100km: adacVerbrauchJe100km(f, preis),
  energiepreis: preis,
  fixkostenJahr: f.fix * 12,
  werkstattJahr: f.werkstatt * 12,
});
const jahre = ADAC_HALTEDAUER_MONATE / 12;

describe('berechneTco', () => {
  it('rechnet Wertverlust plus laufende Kosten', () => {
    const r = berechneTco({
      jahre: 4, kmProJahr: 10000, kaufpreis: 30000, restwert: 18000,
      verbrauchJe100km: 6, energiepreis: 2, fixkostenJahr: 1000, werkstattJahr: 500,
    });
    expect(r.wertverlust).toBe(12000);
    expect(r.energieJahr).toBe(1200);
    expect(r.laufendJahr).toBe(2700);
    expect(r.gesamt).toBe(22800);
    expect(r.jeMonat).toBe(475);
    expect(r.jeKm).toBe(0.57);
  });

  it('stellt die ADAC-Summe ohne Pflegepauschale wieder her', () => {
    // Die Vorbelegung der Seite muss dieselbe Summe ergeben wie die
    // ADAC-Monatswerte über 60 Monate, abzüglich der Pflegepauschale.
    for (const [f, preis] of [[corsaBenzin, BENZINPREIS], [corsaElektro, ADAC_STROMPREIS]]) {
      const r = berechneTco({ jahre, kmProJahr: ADAC_KM_PRO_JAHR, ...ausAdac(f, preis) });
      const adac = (f.fix + f.werkstatt + f.betrieb + f.wertverlust) * ADAC_HALTEDAUER_MONATE
        - ADAC_PFLEGEPAUSCHALE_PRO_JAHR * jahre;
      expect(r.gesamt).toBeCloseTo(adac, 0);
    }
  });

  it('behandelt leere Eingaben als null', () => {
    const r = berechneTco({ jahre: '', kmProJahr: 0, kaufpreis: 'x' });
    expect(r.gesamt).toBe(0);
    expect(r.jeKm).toBe(0);
  });
});

describe('vergleicheTco', () => {
  it('meldet ein negatives Ergebnis, wenn das zweite Fahrzeug teurer ist', () => {
    const v = vergleicheTco({
      jahre, kmProJahr: ADAC_KM_PRO_JAHR,
      a: ausAdac(corsaBenzin, BENZINPREIS),
      b: ausAdac(corsaElektro, ADAC_STROMPREIS),
    });
    expect(v.differenz).toBeLessThan(0);
    expect(v.differenz).toBeCloseTo(-(682 - 631) * 60, 0);
  });

  it('nennt die Ausgleichsdauer nur, wenn b laufend günstiger und im Wertverlust teurer ist', () => {
    const basis = { verbrauchJe100km: 0, energiepreis: 0, werkstattJahr: 0 };
    const v = vergleicheTco({
      jahre: 5, kmProJahr: 10000,
      a: { ...basis, kaufpreis: 20000, restwert: 10000, fixkostenJahr: 2000 },
      b: { ...basis, kaufpreis: 26000, restwert: 10000, fixkostenJahr: 1000 },
    });
    expect(v.ausgleichNachJahren).toBe(6);
    const umgekehrt = vergleicheTco({
      jahre: 5, kmProJahr: 10000,
      a: { ...basis, kaufpreis: 26000, restwert: 10000, fixkostenJahr: 1000 },
      b: { ...basis, kaufpreis: 20000, restwert: 10000, fixkostenJahr: 2000 },
    });
    expect(umgekehrt.ausgleichNachJahren).toBeNull();
  });
});
