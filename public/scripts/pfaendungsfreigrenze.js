// Pfändungsfreigrenzen für Arbeitseinkommen nach § 850c ZPO
//
// Rechtsstand: 2026-07-01
// Primärquellen:
// - § 850c ZPO   https://www.gesetze-im-internet.de/zpo/__850c.html
// - Pfändungsfreigrenzenbekanntmachung 2026 vom 19.03.2026,
//   BGBl. 2026 I Nr. 80
//
// Das Modul rechnete bis zum 11.08.2026 mit den Beträgen vom 01.07.2024 und
// einer frei erfundenen Formel: Unterhalb einer selbst gesetzten Grenze gab es
// den vollen Betrag über der Freigrenze als pfändbar aus, darüber einen
// quadratisch wachsenden Anteil ("ca. 50 % des Mehrbetrags"). Die drei Zehntel
// des Absatzes 3 kamen darin nicht vor. Eine mitgelieferte Wertetabelle wurde
// nie benutzt.
//
// Statt die amtliche Tabelle abzuschreiben, rechnet dieses Modul sie aus
// Absatz 3 und Absatz 5 nach. Beide Wege wurden gegeneinander geprüft: Die
// Formel trifft alle 1.335 Werte der Monatstabelle der Bekanntmachung 2026
// auf den Cent genau. Zu pflegen sind damit nur die vier Beträge, die das
// Bundesministerium der Justiz jährlich zum 1. Juli neu bekannt macht.

export const PFAENDUNG_STAND = '2026-07-01';

/** § 850c Abs. 1 Nr. 1 ZPO: unpfändbar bis zu diesem Betrag. */
export const GRUNDFREIBETRAG_MONAT = 1587.4;

/** § 850c Abs. 2 Satz 1 Nr. 1 ZPO: Erhöhung für die erste Person. */
export const ERHOEHUNG_ERSTE_PERSON = 597.42;

/** § 850c Abs. 2 Satz 2 Nr. 1 ZPO: Erhöhung für die zweite bis fünfte Person. */
export const ERHOEHUNG_WEITERE_PERSON = 332.83;

/** § 850c Abs. 3 Satz 3 Nr. 1 ZPO: Was darüber liegt, ist voll pfändbar. */
export const HOECHSTBETRAG_MONAT = 4866.3;

/** Mehr als fünf unterhaltsberechtigte Personen erhöhen die Freigrenze nicht. */
export const MAX_UNTERHALTSPFLICHTIGE = 5;

/**
 * Unpfändbarer Sockelbetrag bei einer bestimmten Zahl unterhaltsberechtigter
 * Personen (§ 850c Abs. 1 und 2 ZPO).
 */
export function freigrenze(unterhaltspflichtige = 0) {
  const personen = anzahl(unterhaltspflichtige);
  const weitere = Math.max(0, personen - 1);
  const betrag =
    GRUNDFREIBETRAG_MONAT +
    (personen >= 1 ? ERHOEHUNG_ERSTE_PERSON : 0) +
    weitere * ERHOEHUNG_WEITERE_PERSON;
  return runde(betrag);
}

/**
 * Geschütztes Guthaben auf dem Pfändungsschutzkonto (§ 899 Abs. 1 Satz 1 ZPO):
 * der Freibetrag des § 850c Abs. 1, aufgerundet auf den nächsten vollen
 * 10-Euro-Betrag.
 */
export function pKontoFreibetrag() {
  return Math.ceil(GRUNDFREIBETRAG_MONAT / 10) * 10;
}

/**
 * Anteil des Mehrbetrags, der nach § 850c Abs. 3 ZPO unpfändbar bleibt:
 * drei Zehntel, für die erste Person zwei weitere, für die zweite bis fünfte
 * je ein weiteres Zehntel.
 */
function unpfaendbareZehntel(personen) {
  return 3 + (personen >= 1 ? 2 : 0) + Math.max(0, personen - 1);
}

/**
 * Pfändbarer und unpfändbarer Teil eines monatlichen Nettoarbeitseinkommens.
 *
 * @param {object} eingabe
 * @param {number} eingabe.nettoMonat Nettoarbeitseinkommen im Monat, in Euro
 * @param {number} [eingabe.unterhaltspflichtige] Personen, denen der Schuldner
 *   gesetzlich Unterhalt gewährt (§ 850c Abs. 2 ZPO)
 */
export function berechnePfaendungsfreigrenze({ nettoMonat, unterhaltspflichtige = 0 } = {}) {
  const netto = Math.max(0, zahl(nettoMonat));
  const personen = anzahl(unterhaltspflichtige);
  const grenze = freigrenze(personen);

  // § 850c Abs. 3 Satz 3: Der Teil oberhalb des Höchstbetrags bleibt bei der
  // Berechnung außer Betracht – er ist in voller Höhe pfändbar.
  const ueberHoechstbetrag = Math.max(0, netto - HOECHSTBETRAG_MONAT);

  // § 850c Abs. 5 Satz 1 Nr. 1: Der Rest wird auf ein Vielfaches von zehn
  // Euro abgerundet. Deshalb gilt innerhalb jeder Zehnerstufe derselbe Betrag.
  const bemessung = Math.floor(Math.min(netto, HOECHSTBETRAG_MONAT) / 10) * 10;

  const mehrbetrag = Math.max(0, bemessung - grenze);
  const pfaendbarerAnteil = (10 - unpfaendbareZehntel(personen)) / 10;

  const pfaendbar = runde(mehrbetrag * pfaendbarerAnteil + ueberHoechstbetrag);

  return {
    nettoMonat: netto,
    unterhaltspflichtige: personen,
    freigrenze: grenze,
    pfaendbar,
    unpfaendbar: runde(netto - pfaendbar),
    hoechstbetrag: HOECHSTBETRAG_MONAT,
    ueberHoechstbetrag: runde(ueberHoechstbetrag),
  };
}

function anzahl(wert) {
  if (!Number.isFinite(wert)) return 0;
  return Math.min(MAX_UNTERHALTSPFLICHTIGE, Math.max(0, Math.floor(wert)));
}

function zahl(wert) {
  return Number.isFinite(wert) ? wert : 0;
}

function runde(betrag) {
  return Math.round((betrag + Number.EPSILON) * 100) / 100;
}
