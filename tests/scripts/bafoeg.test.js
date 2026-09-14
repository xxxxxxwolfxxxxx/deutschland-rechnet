import { describe, it, expect } from 'vitest';
import {
  bedarf,
  sozialpauschale,
  elternanrechnung,
  vermoegensanrechnung,
  berechneBafoeg,
} from '../../public/scripts/bafoeg.js';

// BAföG §§ 13, 13a, 21, 24, 25, 29, 30, abgerufen am 14.09.2026.

describe('bedarf – §§ 13, 13a', () => {
  it('auswärts mit eigener Kranken- und Pflegeversicherung: 992 €', () => {
    expect(bedarf({ auswaerts: true, eigeneVersicherung: true })).toBe(992);
  });

  it('bei den Eltern, familienversichert: 534 €', () => {
    expect(bedarf({ auswaerts: false, eigeneVersicherung: false })).toBe(534);
  });
});

describe('sozialpauschale – § 21 Abs. 2', () => {
  it('22,3 % bei Rentenversicherungspflicht', () => {
    expect(sozialpauschale(50000, 'rvPflichtig')).toBeCloseTo(11150, 2);
  });

  it('gedeckelt auf 17.200 €', () => {
    expect(sozialpauschale(100000, 'rvPflichtig')).toBe(17200);
  });

  it('38,8 % bei Selbstständigen, höchstens 29.500 €', () => {
    expect(sozialpauschale(50000, 'nichtArbeitnehmer')).toBeCloseTo(19400, 2);
    expect(sozialpauschale(100000, 'nichtArbeitnehmer')).toBe(29500);
  });
});

describe('elternanrechnung – § 25', () => {
  const eltern = [
    { einkuenfte: 50000, status: 'rvPflichtig', steuern: 9000 },
    { einkuenfte: 20000, status: 'rvPflichtig', steuern: 0 },
  ];

  it('verheiratete Eltern, ein weiteres Kind mit Freibetrag', () => {
    const r = elternanrechnung({ verheiratet: true, elternteile: eltern, kinderMitFreibetrag: 1 });

    // (50.000 − 11.150 + 20.000 − 4.460 − 9.000) / 12 = 3.782,50
    expect(r.details[0].einkommenMonat).toBe(3782.5);
    expect(r.details[0].freibetrag).toBe(3310);
    expect(r.details[0].uebersteigend).toBe(472.5);
    expect(r.anteilAngerechnetProzent).toBe(45);
    expect(r.gesamt).toBe(212.63);
  });

  it('unter dem Freibetrag wird nichts angerechnet', () => {
    const r = elternanrechnung({ verheiratet: true, elternteile: [{ einkuenfte: 30000, status: 'rvPflichtig', steuern: 2000 }] });
    expect(r.gesamt).toBe(0);
  });

  it('getrennt lebende Eltern: je Elternteil 1.690 €', () => {
    const r = elternanrechnung({ verheiratet: false, elternteile: eltern });

    expect(r.details).toHaveLength(2);
    expect(r.details[0].freibetrag).toBe(1690);
    // (50.000 − 11.150 − 9.000) / 12 = 2.487,50 → 797,50 übersteigend → 50 %
    expect(r.details[0].angerechnet).toBe(398.75);
    // (20.000 − 4.460) / 12 = 1.295 → unter dem Freibetrag
    expect(r.details[1].angerechnet).toBe(0);
  });

  it('zwei geförderte Geschwister teilen die Anrechnung (§ 11 Abs. 4)', () => {
    const eins = elternanrechnung({ verheiratet: true, elternteile: eltern, gefoerderteKinder: 1 });
    const zwei = elternanrechnung({ verheiratet: true, elternteile: eltern, gefoerderteKinder: 2 });
    expect(zwei.jeAuszubildendem).toBeCloseTo(eins.gesamt / 2, 2);
  });
});

describe('vermoegensanrechnung – §§ 29, 30', () => {
  it('unter 30: Freibetrag 15.000 €, Rest auf 12 Monate', () => {
    expect(vermoegensanrechnung({ vermoegen: 21000 })).toBe(500);
  });

  it('ab 30: Freibetrag 45.000 €', () => {
    expect(vermoegensanrechnung({ vermoegen: 21000, ab30: true })).toBe(0);
  });
});

describe('berechneBafoeg', () => {
  it('Beispiel: 992 € Bedarf minus 212,63 € Elternanteil', () => {
    const r = berechneBafoeg({
      verheiratet: true,
      elternteile: [
        { einkuenfte: 50000, status: 'rvPflichtig', steuern: 9000 },
        { einkuenfte: 20000, status: 'rvPflichtig', steuern: 0 },
      ],
      kinderMitFreibetrag: 1,
    });

    expect(r.foerderung).toBe(779.37);
    expect(r.zuschuss).toBe(389.69);
    expect(r.darlehen).toBe(389.69);
  });

  it('nie negativ', () => {
    const r = berechneBafoeg({ verheiratet: true, elternteile: [{ einkuenfte: 300000, status: 'rvPflichtig', steuern: 80000 }] });
    expect(r.foerderung).toBe(0);
  });
});
