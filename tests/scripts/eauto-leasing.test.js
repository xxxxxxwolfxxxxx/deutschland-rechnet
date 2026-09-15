import { describe, it, expect } from 'vitest';
import { berechneLeasingkosten } from '../../public/scripts/eauto-leasing.js';

const angebot = {
  listenpreis: 40000,
  rate: 300,
  laufzeitMonate: 36,
  sonderzahlung: 3000,
  ueberfuehrung: 1080,
  vertragsKmJahr: 10000,
  erwarteteKmJahr: 12000,
  mehrKmSatz: 0.08,
  verbrauchJe100km: 16,
  strompreis: 0.37,
};

describe('berechneLeasingkosten – Kennzahlen', () => {
  it('bezieht den Leasingfaktor auf die Monatsrate, nicht auf ein Jahr', () => {
    const r = berechneLeasingkosten(angebot);
    expect(r.leasingfaktor).toBe(0.75); // 300 ÷ 40.000
  });

  it('legt Sonderzahlung und Überführung im Gesamtkostenfaktor auf die Laufzeit um', () => {
    const r = berechneLeasingkosten(angebot);
    // (300 + 4.080 ÷ 36) ÷ 40.000 = 1,0333 %
    expect(r.gesamtkostenfaktor).toBe(1.03);
  });
});

describe('berechneLeasingkosten – Kosten', () => {
  it('summiert Raten, Einmalkosten, Mehrkilometer und Strom', () => {
    const r = berechneLeasingkosten(angebot);
    expect(r.vertragskosten).toBe(14880); // 36 × 300 + 4.080
    expect(r.mehrKm).toBe(6000);
    expect(r.mehrKmKosten).toBe(480);
    expect(r.kmGesamt).toBe(36000);
    expect(r.stromkosten).toBe(2131.2); // 36.000 ÷ 100 × 16 × 0,37
    expect(r.gesamt).toBe(17491.2);
    expect(r.jeMonat).toBe(485.87);
    expect(r.jeKm).toBe(0.486);
  });

  it('vergütet keine Minderkilometer', () => {
    const r = berechneLeasingkosten({ ...angebot, erwarteteKmJahr: 8000 });
    expect(r.mehrKm).toBe(0);
    expect(r.mehrKmKosten).toBe(0);
  });

  it('kommt ohne Listenpreis und Laufzeit ohne Division durch null aus', () => {
    const r = berechneLeasingkosten({ ...angebot, listenpreis: 0, laufzeitMonate: '' });
    expect(r.leasingfaktor).toBe(0);
    expect(r.gesamtkostenfaktor).toBe(0);
    expect(r.jeMonat).toBe(0);
    expect(r.jeKm).toBe(0);
  });
});
