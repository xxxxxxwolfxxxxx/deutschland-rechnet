import { describe, it, expect } from 'vitest';
import {
  annuitaetenrate,
  tilgungsplan,
  darlehenskosten,
  effektivzins,
  sollzinsAusRate,
} from '../../public/scripts/annuitaet.js';

// Annuitaetendarlehen fuer Kreditvergleich und Tilgungsrechner: Rate,
// Tilgungsplan mit exakter Schlussrate, effektiver Jahreszins nach der
// Barwertmethode der Anlage zu § 16 PAngV und die Umkehrung Sollzins aus Rate.

describe('annuitaetenrate', () => {
  it('20.000 € zu 5,9 % ueber 36 Monate', () => {
    expect(annuitaetenrate({ betrag: 20000, sollzins: 5.9, monate: 36 })).toBe(607.53);
  });

  it('200.000 € zu 3,5 % ueber 20 Jahre', () => {
    expect(annuitaetenrate({ betrag: 200000, sollzins: 3.5, monate: 240 })).toBe(1159.92);
  });

  it('ohne Zins wird der Betrag gleichmaessig verteilt', () => {
    expect(annuitaetenrate({ betrag: 1200, sollzins: 0, monate: 12 })).toBe(100);
  });
});

describe('tilgungsplan und darlehenskosten', () => {
  it('die Schlussrate bringt die Restschuld exakt auf null', () => {
    const k = darlehenskosten({ betrag: 20000, sollzins: 5.9, monate: 36 });
    expect(k.monate).toBe(36);
    expect(k.plan[k.plan.length - 1].restschuld).toBe(0);
    expect(k.schlussrate).toBe(607.66);
    expect(k.gezahlt).toBe(21871.21);
    expect(k.zinsen).toBe(1871.21);
    expect(k.zinsanteilErsteRate).toBe(98.33);
  });

  it('Tilgungsrechner-Voreinstellung: Restschuld nach zehn Jahren und Kipppunkt im Monat 3', () => {
    const k = darlehenskosten({ betrag: 200000, sollzins: 3.5, monate: 240 });
    expect(k.zinsanteilErsteRate).toBe(583.33);
    expect(k.schlussrate).toBe(1159.78);
    expect(Math.round(k.plan[119].restschuld)).toBe(117299);
    expect(k.plan.find((z) => z.tilgung >= z.zins).monat).toBe(3);
  });

  it('eine hoehere Rate endet frueher', () => {
    const plan = tilgungsplan({ betrag: 200000, sollzins: 3.5, monate: 1200, rate: 916.67 });
    expect(plan).toHaveLength(348);
  });
});

describe('effektivzins', () => {
  it('liegt ohne Nebenkosten ueber dem Sollzins: 5,9 % werden 6,062 %', () => {
    expect(effektivzins({ auszahlung: 20000, rate: 607.53, monate: 36 })).toBe(6.06);
  });

  it('entspricht ohne Nebenkosten dem aufgezinsten Sollzins, unabhaengig von der Laufzeit', () => {
    const aufgezinst = (Math.pow(1 + 0.059 / 12, 12) - 1) * 100;
    for (const monate of [12, 24, 36, 48, 84]) {
      const rate = annuitaetenrate({ betrag: 20000, sollzins: 5.9, monate });
      expect(Math.abs(effektivzins({ auszahlung: 20000, rate, monate }) - aufgezinst)).toBeLessThanOrEqual(0.005);
    }
  });

  it('eine Rate, die den Betrag nie zurueckzahlt, ergibt 0 statt -60,10 %', () => {
    expect(effektivzins({ auszahlung: 20000, rate: 100, monate: 36 })).toBe(0);
  });

  it('ein einbehaltener Betrag hebt den Effektivzins', () => {
    const voll = effektivzins({ auszahlung: 200000, rate: 1159.92, monate: 240 });
    const disagio = effektivzins({ auszahlung: 198000, rate: 1159.92, monate: 240 });
    expect(disagio).toBeGreaterThan(voll);
  });
});

describe('sollzinsAusRate', () => {
  it('ist die Umkehrung der Annuitaetenformel', () => {
    expect(sollzinsAusRate({ betrag: 20000, rate: 607.53, monate: 36 })).toBeCloseTo(5.9, 2);
  });

  it('Kreditvergleich: 650 € auf 20.000 € ueber 36 Monate sind 10,49 %', () => {
    expect(sollzinsAusRate({ betrag: 20000, rate: 650, monate: 36 })).toBeCloseTo(10.49, 2);
  });

  it('eine Rate unter Betrag durch Laufzeit ergibt 0', () => {
    expect(sollzinsAusRate({ betrag: 20000, rate: 100, monate: 36 })).toBe(0);
  });
});
