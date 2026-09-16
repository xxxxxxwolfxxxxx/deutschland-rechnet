import { describe, it, expect } from 'vitest';
import { TAGESPAUSCHALE, TAGESPAUSCHALE_HOECHSTBETRAG, tagespauschale, steuervorteil } from '../../public/scripts/homeoffice.js';
import { ARBEITNEHMER_PAUSCHBETRAG } from '../../public/scripts/lohnsteuer.js';
import { einkommensteuer, tariflicheEinkommensteuer } from '../../public/scripts/einkommensteuer.js';

describe('Tagespauschale nach § 4 Abs. 5 Satz 1 Nr. 6c EStG', () => {
  it('beträgt 6 € je Tag und höchstens 1.260 € im Jahr', () => {
    expect(TAGESPAUSCHALE).toBe(6);
    expect(TAGESPAUSCHALE_HOECHSTBETRAG).toBe(1260);
  });

  it('rechnet Tage mal 6 € bis zum Höchstbetrag', () => {
    expect(tagespauschale(100)).toBe(600);
    expect(tagespauschale(210)).toBe(1260);
    expect(tagespauschale(250)).toBe(1260);
  });

  it('zählt nur volle Tage und keine negativen Werte', () => {
    expect(tagespauschale(10.9)).toBe(60);
    expect(tagespauschale(-5)).toBe(0);
    expect(tagespauschale(undefined)).toBe(0);
  });
});

describe('steuervorteil – Wirkung der Tagespauschale auf die Einkommensteuer', () => {
  it('wirkt bei Arbeitnehmern ohne weitere Werbungskosten erst über dem Pauschbetrag', () => {
    const r = steuervorteil({ tage: 150, zvE: 50000 });
    expect(r.pauschale).toBe(900);
    expect(r.zusaetzlicherAbzug).toBe(0);
    expect(r.ersparnis).toBe(0);
    expect(r.tageBisPauschbetrag).toBe(Math.ceil(ARBEITNEHMER_PAUSCHBETRAG / TAGESPAUSCHALE));
  });

  it('rechnet nur den Teil über dem Arbeitnehmer-Pauschbetrag', () => {
    const r = steuervorteil({ tage: 210, zvE: 50000 });
    expect(r.zusaetzlicherAbzug).toBe(1260 - ARBEITNEHMER_PAUSCHBETRAG);
    expect(r.ersparnis).toBe(einkommensteuer(50000) - einkommensteuer(50000 - r.zusaetzlicherAbzug));
  });

  it('wirkt teilweise, wenn die übrigen Werbungskosten unter dem Pauschbetrag liegen', () => {
    const r = steuervorteil({ tage: 100, zvE: 50000, sonstigeWerbungskosten: 1000 });
    expect(r.zusaetzlicherAbzug).toBe(1600 - ARBEITNEHMER_PAUSCHBETRAG);
    expect(r.tageBisPauschbetrag).toBe(Math.ceil((ARBEITNEHMER_PAUSCHBETRAG - 1000) / TAGESPAUSCHALE));
  });

  it('wirkt voll, wenn die übrigen Werbungskosten den Pauschbetrag schon übersteigen', () => {
    const r = steuervorteil({ tage: 100, zvE: 50000, sonstigeWerbungskosten: 2000 });
    expect(r.zusaetzlicherAbzug).toBe(600);
    expect(r.tageBisPauschbetrag).toBe(0);
    expect(r.ersparnis).toBe(einkommensteuer(50000) - einkommensteuer(49400));
  });

  it('zieht bei Selbständigen den vollen Betrag als Betriebsausgabe ab', () => {
    const r = steuervorteil({ tage: 100, zvE: 50000, arbeitnehmer: false });
    expect(r.zusaetzlicherAbzug).toBe(600);
    expect(r.tageBisPauschbetrag).toBe(0);
  });

  it('rechnet im Splittingtarif', () => {
    const r = steuervorteil({ tage: 100, zvE: 80000, sonstigeWerbungskosten: 2000, splitting: true });
    expect(r.ersparnis).toBe(tariflicheEinkommensteuer(80000, true) - tariflicheEinkommensteuer(79400, true));
  });
});
