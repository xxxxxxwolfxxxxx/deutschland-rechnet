// Kinderbetreuungskosten nach Steuern.
//
// Bis September 2026 schaetzte dieses Modul Kita-Gebuehren mit einer Formel
// aus Einkommen, Betreuungszeit und "Region": 150 € Grundgebuehr mal frei
// gewaehlte Faktoren plus 0,2 Prozent des Einkommens ueber 30.000 €. Diese
// Formel gab es nirgends. Elternbeitraege setzen Kommunen und Traeger selbst
// fest (§ 90 SGB VIII), teils einkommensabhaengig gestaffelt, in einigen
// Laendern ganz oder teilweise beitragsfrei.
//
// Das Modul rechnet deshalb nur noch, was bundeseinheitlich im Gesetz steht:
// den steuerfreien Arbeitgeberzuschuss (§ 3 Nr. 33 EStG), den
// Sonderausgabenabzug (§ 10 Abs. 1 Nr. 5 EStG) und die Steuerersparnis nach
// dem Tarif des § 32a EStG. Den Beitrag selbst traegt der Nutzer ein.

import { einkommensteuer, TARIF_STAND } from './einkommensteuer.js';

/** § 10 Abs. 1 Nr. 5 Satz 1 EStG: abziehbarer Anteil der Aufwendungen. */
export const ABZUGSQUOTE = 0.8;
/** § 10 Abs. 1 Nr. 5 Satz 1 EStG: Hoechstbetrag je Kind und Jahr. */
export const HOECHSTBETRAG_JE_KIND = 4800;
/** Ab diesen eigenen Aufwendungen je Kind ist der Hoechstbetrag erreicht. */
export const KOSTEN_BIS_ZUM_DECKEL = HOECHSTBETRAG_JE_KIND / ABZUGSQUOTE;
/** § 10 Abs. 1 Nr. 5 Satz 1 EStG: Altersgrenze (Kinder mit Behinderung: Eintritt vor dem 25.). */
export const ALTERSGRENZE = 14;

export { TARIF_STAND };

const aufCent = (b) => Math.round(b * 100) / 100;

/**
 * Tarifliche Einkommensteuer, bei Zusammenveranlagung nach dem Splittingverfahren
 * des § 32a Abs. 5 EStG: das Zweifache der Steuer auf die Haelfte des zvE.
 */
export function steuerNachTarif(zvE, zusammen = false) {
  if (!zusammen) return einkommensteuer(zvE);
  return 2 * einkommensteuer(zvE / 2);
}

/**
 * @param {object} e
 * @param {number} e.kinder              Anzahl betreuter Kinder
 * @param {number} e.beitragMonat        Betreuungsbeitrag je Kind im Monat, OHNE Essensgeld
 * @param {number} [e.monate]            Monate mit Beitrag im Jahr
 * @param {number} [e.zuschussMonat]     steuerfreier Arbeitgeberzuschuss je Kind im Monat
 * @param {number} e.zvE                 zu versteuerndes Einkommen OHNE die Betreuungskosten
 * @param {boolean} [e.zusammen]         Zusammenveranlagung
 */
export function berechneBetreuungskosten({
  kinder,
  beitragMonat,
  monate = 12,
  zuschussMonat = 0,
  zvE,
  zusammen = false,
}) {
  const n = Math.max(0, Math.floor(Number(kinder) || 0));
  const m = Math.min(12, Math.max(0, Math.floor(Number(monate) || 0)));
  const aufwandJeKind = Math.max(0, Number(beitragMonat) || 0) * m;
  // Abziehbar ist nur, was die Eltern selbst tragen: Ein steuerfreier
  // Arbeitgeberzuschuss mindert die Aufwendungen.
  const zuschussJeKind = Math.min(aufwandJeKind, Math.max(0, Number(zuschussMonat) || 0) * m);
  const eigenJeKind = aufwandJeKind - zuschussJeKind;
  const abziehbarJeKind = Math.min(eigenJeKind * ABZUGSQUOTE, HOECHSTBETRAG_JE_KIND);

  const aufwand = aufwandJeKind * n;
  const zuschuss = zuschussJeKind * n;
  const eigen = eigenJeKind * n;
  const sonderausgaben = abziehbarJeKind * n;

  const einkommen = Math.max(0, Number(zvE) || 0);
  const steuerOhne = steuerNachTarif(einkommen, zusammen);
  const steuerMit = steuerNachTarif(Math.max(0, einkommen - sonderausgaben), zusammen);
  const steuerersparnis = steuerOhne - steuerMit;
  const nettokosten = eigen - steuerersparnis;

  return {
    aufwand: aufCent(aufwand),
    zuschuss: aufCent(zuschuss),
    eigen: aufCent(eigen),
    sonderausgaben: aufCent(sonderausgaben),
    deckelErreicht: eigenJeKind * ABZUGSQUOTE > HOECHSTBETRAG_JE_KIND,
    steuerOhne,
    steuerMit,
    steuerersparnis,
    nettokosten: aufCent(nettokosten),
    nettokostenMonat: aufCent(nettokosten / 12),
    /** Anteil der Aufwendungen, den Zuschuss und Steuer zusammen zurueckholen. */
    entlastungsquote: aufwand > 0 ? Math.round(((zuschuss + steuerersparnis) / aufwand) * 1000) / 10 : 0,
  };
}
