import { describe, it, expect } from 'vitest';
import { kostenJe100km, vergleicheAntriebe } from '../../public/scripts/antriebsvergleich.js';

describe('antriebsvergleich', () => {
  it('multipliziert Verbrauch und Preis', () => {
    expect(kostenJe100km({ verbrauch: 5.1, preis: 1.92 })).toBe(9.79);
    expect(kostenJe100km({ verbrauch: 15.7, preis: 0.37 })).toBe(5.81);
  });

  it('rechnet Jahres- und Monatskosten und die Mehrkosten gegenüber dem günstigsten', () => {
    const r = vergleicheAntriebe({
      kmProJahr: 12000,
      antriebe: [
        { name: 'Benzin', verbrauch: 6, preis: 2 },
        { name: 'Strom', verbrauch: 16, preis: 0.5 },
      ],
    });
    expect(r.guenstigster).toBe('Strom');
    expect(r.antriebe[0]).toEqual({ name: 'Benzin', je100km: 12, jahr: 1440, monat: 120, mehrkostenJahr: 480 });
    expect(r.antriebe[1].mehrkostenJahr).toBe(0);
  });

  it('wertet Antriebe ohne Verbrauch oder Preis nicht', () => {
    const r = vergleicheAntriebe({
      kmProJahr: 10000,
      antriebe: [
        { name: 'Benzin', verbrauch: 6, preis: 2 },
        { name: 'Diesel', verbrauch: 5, preis: '' },
      ],
    });
    expect(r.antriebe.map((a) => a.name)).toEqual(['Benzin']);
    expect(r.guenstigster).toBe('Benzin');
  });

  it('kommt ohne gewertete Antriebe aus', () => {
    expect(vergleicheAntriebe({ kmProJahr: 10000, antriebe: [] })).toEqual({ antriebe: [], guenstigster: null });
  });
});
