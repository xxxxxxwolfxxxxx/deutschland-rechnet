// BAföG für Studierende: Bedarf, Anrechnung des Elterneinkommens und des Vermögens
//
// Quellen (https://www.gesetze-im-internet.de/baf_g/, abgerufen am 14.09.2026):
// - § 13 Abs. 1 Nr. 2, Abs. 2: Grundbedarf 475 €, Wohnen 59 € bei den Eltern, 380 € auswärts
// - § 13a Abs. 1: Zuschläge 102 € Kranken-, 35 € Pflegeversicherung
// - § 21 Abs. 1 und 2: Einkommen = positive Einkünfte minus Einkommen- und
//   Kirchensteuer minus Sozialpauschale
// - § 24 Abs. 1 und 4: Einkommen der Eltern aus dem vorletzten Kalenderjahr, je Monat ein Zwölftel
// - § 25 Abs. 1, 3, 4: Freibeträge 2.540 € (verheiratet) bzw. 1.690 € je Elternteil,
//   770 € je Kind; vom Rest bleiben 50 % und 5 % je Kind anrechnungsfrei
// - § 11 Abs. 4: Elterneinkommen wird auf mehrere geförderte Kinder gleich aufgeteilt
// - § 29 Abs. 1, § 30: Vermögensfreibetrag 15.000 € (unter 30), 45.000 € (ab 30),
//   Rest auf die Monate des Bewilligungszeitraums verteilt
// - § 17 Abs. 2: an Hochschulen zur Hälfte Zuschuss, zur Hälfte Darlehen
//
// Die frühere Seite rechnete mit Elternfreibeträgen von 37.350 bzw. 24.850 €
// im Jahr, einem "Eigenfreibetrag von 55 €" und dem rohen Einkommen – nichts
// davon steht im Gesetz.
//
// Nicht abgebildet: eigenes Einkommen des Auszubildenden (§ 23), Einkommen
// eines Ehegatten, Freibetrag für Stiefelternteile (§ 25 Abs. 3 Nr. 1),
// Altersentlastungsbetrag und Altersvorsorgebeiträge (§ 21 Abs. 1 Satz 3 Nr. 1, 4),
// Härtefreibetrag (§ 25 Abs. 6), elternunabhängige Förderung.

export const GRUNDBEDARF_STUDIUM = 475;
export const WOHNEN_BEI_ELTERN = 59;
export const WOHNEN_AUSWAERTS = 380;
export const ZUSCHLAG_KRANKENVERSICHERUNG = 102;
export const ZUSCHLAG_PFLEGEVERSICHERUNG = 35;

export const FREIBETRAG_ELTERN_VERHEIRATET = 2540;
export const FREIBETRAG_ELTERNTEIL = 1690;
export const FREIBETRAG_JE_KIND = 770;
export const ANRECHNUNGSFREI_GRUND = 0.5;
export const ANRECHNUNGSFREI_JE_KIND = 0.05;

/** § 21 Abs. 2 BAföG */
export const SOZIALPAUSCHALE = Object.freeze({
  rvPflichtig: { satz: 0.223, hoechstbetrag: 17200, label: 'rentenversicherungspflichtig beschäftigt' },
  nichtRvArbeitnehmer: { satz: 0.165, hoechstbetrag: 10200, label: 'nicht rentenversicherungspflichtig beschäftigt (z. B. Beamte)' },
  nichtArbeitnehmer: { satz: 0.388, hoechstbetrag: 29500, label: 'selbstständig' },
  nichterwerbstaetig: { satz: 0.165, hoechstbetrag: 10200, label: 'nicht erwerbstätig' },
});

export const VERMOEGENSFREIBETRAG_UNTER_30 = 15000;
export const VERMOEGENSFREIBETRAG_AB_30 = 45000;

export const DARLEHENSANTEIL = 0.5;

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);
const runde = (n) => Math.round(n * 100) / 100;

/** Monatlicher Bedarf nach §§ 13, 13a. */
export function bedarf({ auswaerts = true, eigeneVersicherung = true }) {
  return GRUNDBEDARF_STUDIUM
    + (auswaerts ? WOHNEN_AUSWAERTS : WOHNEN_BEI_ELTERN)
    + (eigeneVersicherung ? ZUSCHLAG_KRANKENVERSICHERUNG + ZUSCHLAG_PFLEGEVERSICHERUNG : 0);
}

/** Sozialpauschale eines Einkommensbeziehers im Jahr. */
export function sozialpauschale(einkuenfte, status) {
  const p = SOZIALPAUSCHALE[status] ?? SOZIALPAUSCHALE.rvPflichtig;
  return Math.min(zahl(einkuenfte) * p.satz, p.hoechstbetrag);
}

/**
 * Anzurechnender Monatsbetrag aus dem Einkommen der Eltern.
 *
 * @param {object} p
 * @param {boolean} p.verheiratet verheiratet und nicht dauernd getrennt lebend
 * @param {{ einkuenfte: number, status: string, steuern: number }[]} p.elternteile
 *   Jahreswerte aus dem Steuerbescheid des vorletzten Jahres. Bei verheirateten
 *   Eltern können die Steuern bei einem Elternteil stehen.
 * @param {number} [p.kinderMitFreibetrag] Kinder der Eltern, die NICHT in förderungsfähiger Ausbildung sind
 * @param {number} [p.gefoerderteKinder] Kinder in förderungsfähiger Ausbildung einschließlich des Antragstellers
 */
export function elternanrechnung({ verheiratet, elternteile, kinderMitFreibetrag = 0, gefoerderteKinder = 1 }) {
  const k = Math.floor(zahl(kinderMitFreibetrag));
  const anteilAngerechnet = Math.max(0, 1 - ANRECHNUNGSFREI_GRUND - ANRECHNUNGSFREI_JE_KIND * k);
  const einkommenJahr = (e) => Math.max(0, zahl(e.einkuenfte) - sozialpauschale(e.einkuenfte, e.status) - zahl(e.steuern));

  const gruppen = verheiratet
    ? [{ monat: elternteile.reduce((s, e) => s + einkommenJahr(e), 0) / 12, freibetrag: FREIBETRAG_ELTERN_VERHEIRATET }]
    : elternteile.map((e) => ({ monat: einkommenJahr(e) / 12, freibetrag: FREIBETRAG_ELTERNTEIL }));

  const details = gruppen.map((g) => {
    const freibetrag = g.freibetrag + FREIBETRAG_JE_KIND * k;
    const uebersteigend = Math.max(0, g.monat - freibetrag);
    return { einkommenMonat: runde(g.monat), freibetrag, uebersteigend: runde(uebersteigend), angerechnet: uebersteigend * anteilAngerechnet };
  });

  const gesamt = details.reduce((s, d) => s + d.angerechnet, 0);
  const n = Math.max(1, Math.floor(zahl(gefoerderteKinder)));
  return {
    details: details.map((d) => ({ ...d, angerechnet: runde(d.angerechnet) })),
    anteilAngerechnetProzent: Math.round(anteilAngerechnet * 100),
    gesamt: runde(gesamt),
    jeAuszubildendem: runde(gesamt / n),
  };
}

/** Monatlicher Anrechnungsbetrag aus dem eigenen Vermögen nach §§ 29, 30. */
export function vermoegensanrechnung({ vermoegen, ab30 = false, monateBewilligung = 12 }) {
  const freibetrag = ab30 ? VERMOEGENSFREIBETRAG_AB_30 : VERMOEGENSFREIBETRAG_UNTER_30;
  const monate = Math.max(1, Math.floor(zahl(monateBewilligung)));
  return runde(Math.max(0, zahl(vermoegen) - freibetrag) / monate);
}

export function berechneBafoeg({
  auswaerts = true,
  eigeneVersicherung = true,
  verheiratet = true,
  elternteile = [],
  kinderMitFreibetrag = 0,
  gefoerderteKinder = 1,
  vermoegen = 0,
  ab30 = false,
  monateBewilligung = 12,
}) {
  const b = bedarf({ auswaerts, eigeneVersicherung });
  const eltern = elternanrechnung({ verheiratet, elternteile, kinderMitFreibetrag, gefoerderteKinder });
  const vermoegenMonat = vermoegensanrechnung({ vermoegen, ab30, monateBewilligung });
  const foerderung = Math.max(0, b - vermoegenMonat - eltern.jeAuszubildendem);
  return {
    bedarf: b,
    eltern,
    vermoegenMonat,
    foerderung: runde(foerderung),
    zuschuss: runde(foerderung * (1 - DARLEHENSANTEIL)),
    darlehen: runde(foerderung * DARLEHENSANTEIL),
  };
}
