import { describe, it, expect } from 'vitest';
import { sparverlaufMitSteuer } from '../../public/scripts/sparen.js';

describe('sparverlaufMitSteuer', () => {
  it('ohne Zins: Endkapital = Einzahlungen', () => {
    const r = sparverlaufMitSteuer({ startkapital: 1000, sparrate: 100, zinsProzent: 0, jahre: 2 });
    expect(r.endkapital).toBe(3400);
    expect(r.steuern).toBe(0);
  });

  it('Zinsen unter dem Pauschbetrag bleiben steuerfrei', () => {
    const r = sparverlaufMitSteuer({ startkapital: 20000, sparrate: 0, zinsProzent: 3, jahre: 1 });
    expect(r.zinsenBrutto).toBeCloseTo(20000 * (Math.pow(1.0025, 12) - 1), 2);
    expect(r.steuern).toBe(0);
  });

  it('Steuer auf den Teil über dem Pauschbetrag, ohne Teilfreistellung', () => {
    const r = sparverlaufMitSteuer({ startkapital: 100000, sparrate: 0, zinsProzent: 3, jahre: 1 });
    const zinsen = 100000 * (Math.pow(1.0025, 12) - 1);

    expect(r.steuern).toBeCloseTo((zinsen - 1000) * 0.26375, 1);
    expect(r.endkapital).toBeCloseTo(100000 + zinsen - (zinsen - 1000) * 0.26375, 1);
  });

  it('der Pauschbetrag gilt jedes Jahr neu', () => {
    const r = sparverlaufMitSteuer({ startkapital: 30000, sparrate: 0, zinsProzent: 3, jahre: 3 });
    expect(r.steuern).toBe(0);
  });

  it('ohne Pauschbetrag wird jeder Euro Zins besteuert', () => {
    const mit = sparverlaufMitSteuer({ startkapital: 30000, sparrate: 0, zinsProzent: 3, jahre: 3 });
    const ohne = sparverlaufMitSteuer({ startkapital: 30000, sparrate: 0, zinsProzent: 3, jahre: 3, pauschbetrag: 0 });
    expect(ohne.steuern).toBeGreaterThan(0);
    expect(ohne.endkapital).toBeLessThan(mit.endkapital);
  });
});
