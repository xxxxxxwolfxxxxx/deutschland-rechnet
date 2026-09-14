import { describe, it, expect } from 'vitest';
import {
  ANRECHNUNG,
  wohnflaecheNachWoFlV,
  quadratmeterpreis,
  berechneQmPreis,
} from '../../public/scripts/qm-preis.js';

// § 4 WoFlV, https://www.gesetze-im-internet.de/woflv/__4.html (abgerufen am 14.09.2026).
// Die frühere Städtetabelle mit erfundenen Marktpreisen ist entfernt – ihre
// Tests prüften nur, dass die Fiktion in sich stimmig war.

describe('wohnflaecheNachWoFlV – § 4 WoFlV', () => {
  it('Anrechnungsfaktoren', () => {
    expect(ANRECHNUNG.voll).toBe(1);
    expect(ANRECHNUNG.halb).toBe(0.5);
    expect(ANRECHNUNG.keine).toBe(0);
    expect(ANRECHNUNG.wintergarten).toBe(0.5);
    expect(ANRECHNUNG.balkonRegel).toBe(0.25);
    expect(ANRECHNUNG.balkonHoechst).toBe(0.5);
  });

  it('Dachgeschosswohnung: Schrägen und Balkon', () => {
    const r = wohnflaecheNachWoFlV({ vollHoch: 60, halbHoch: 14, niedrig: 6, balkon: 8 });

    // 60 + 7 + 0 + 2
    expect(r.wohnflaeche).toBe(69);
    expect(r.grundflaeche).toBe(88);
    expect(r.nichtAngerechnet).toBe(19);
  });

  it('Balkon höchstens zur Hälfte', () => {
    const regel = wohnflaecheNachWoFlV({ vollHoch: 70, balkon: 10 });
    const hoechst = wohnflaecheNachWoFlV({ vollHoch: 70, balkon: 10, balkonZurHaelfte: true });

    expect(regel.wohnflaeche).toBe(72.5);
    expect(hoechst.wohnflaeche).toBe(75);
  });

  it('unbeheizter Wintergarten zur Hälfte', () => {
    expect(wohnflaecheNachWoFlV({ vollHoch: 100, wintergarten: 12 }).wohnflaeche).toBe(106);
  });

  it('negative und leere Eingaben zählen nicht', () => {
    expect(wohnflaecheNachWoFlV({ vollHoch: -20, halbHoch: 'x' }).wohnflaeche).toBe(0);
  });
});

describe('quadratmeterpreis', () => {
  it('teilt den Kaufpreis durch die Fläche', () => {
    expect(quadratmeterpreis({ kaufpreis: 540000, flaeche: 90 })).toBe(6000);
  });

  it('ohne Fläche kein Preis', () => {
    expect(quadratmeterpreis({ kaufpreis: 300000, flaeche: 0 })).toBeNull();
  });
});

describe('berechneQmPreis – beworbene Fläche gegen WoFlV', () => {
  it('eine als 85 m² beworbene Wohnung mit 72 m² nach WoFlV', () => {
    const r = berechneQmPreis({
      kaufpreis: 360000,
      beworbeneFlaeche: 85,
      flaechen: { vollHoch: 64, halbHoch: 16, niedrig: 5 },
    });

    expect(r.wohnflaeche).toBe(72);
    expect(r.preisBeworben).toBe(4235.29);
    expect(r.preisWoFlV).toBe(5000);
    expect(r.aufschlagProzent).toBe(18.1);
  });

  it('ohne Grundflächen kein WoFlV-Preis und kein Aufschlag', () => {
    const r = berechneQmPreis({ kaufpreis: 300000, beworbeneFlaeche: 80, flaechen: {} });

    expect(r.preisBeworben).toBe(3750);
    expect(r.preisWoFlV).toBeNull();
    expect(r.aufschlagProzent).toBeNull();
  });
});
