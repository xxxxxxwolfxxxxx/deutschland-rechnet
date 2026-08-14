// Ehegattenunterhalt – Trennungsunterhalt (§ 1361 BGB) und nachehelicher
// Unterhalt (§§ 1569 ff. BGB), Stand 01.01.2026
//
// Die verbreitete "3/7-Regel" ist überholt. Sie stammt aus der Zeit, als dem
// Erwerbstätigen ein Bonus von 1/7 seines Einkommens vorweg zustand; daraus
// ergaben sich die bekannten 3/7 der Differenz. Die Familiensenate haben den
// Bonus auf 1/10 gesenkt – in Nordrhein-Westfalen zum 01.01.2022, in
// Süddeutschland und Frankfurt gilt er ebenfalls. Aus 3/7 (42,86 %) der
// Differenz werden damit 45 %.
//
// Gerechnet wird nicht "3/7 der Differenz", sondern in zwei Schritten:
//   1. Bedarf = die Hälfte der Summe beider bonusbereinigter Einkommen
//      (Halbteilungsgrundsatz).
//   2. Unterhalt = Bedarf abzüglich des eigenen bonusbereinigten Einkommens
//      des Berechtigten.
// Bei beidseitigem Erwerbseinkommen fällt das mit 45 % der Differenz zusammen;
// sobald eine Seite Nicht-Erwerbseinkommen bezieht (Rente, Kapital, Miete),
// tut es das nicht mehr – deshalb die zwei Schritte statt einer Quote.
//
// Zwei Fallstricke, die Rechner regelmäßig übersehen:
//   - Der Bonus gilt NUR bei der Bedarfsermittlung, nicht bei der Prüfung der
//     Leistungsfähigkeit. Dort zählt das volle bereinigte Einkommen.
//   - Der Kindesunterhalt geht im Rang vor (§ 1609 BGB) und wird mit seinem
//     Zahlbetrag abgezogen, BEVOR der Bonus gebildet wird.
//
// Quellen, abgerufen am 14.08.2026:
//   Unterhaltsrechtliche Leitlinien der Familiensenate in Nordrhein-Westfalen
//     Stand 01.01.2026, Nr. 15.2 (Halbteilung und Erwerbstätigenbonus), Nr. 21
//     https://www.olg-hamm.nrw.de/infos/Leitlinien-NRW/LL-NRW-2026.pdf
//   Unterhaltsrechtliche Leitlinien der Familiensenate in Süddeutschland
//     Stand 01.01.2026, Nr. 15.2, Nr. 21.4
//     https://www.justiz.bayern.de/media/pdf/lebenslagen/suedl_2026.pdf
//   Unterhaltsgrundsätze des OLG Frankfurt Stand 01.01.2026, Nr. 15.2, Nr. 21.4
//
// NICHT abgebildet: Vorsorgeunterhalt (Alters- und Krankenvorsorge als
// eigener Bedarfsposten), Wohnvorteil, Begrenzung und Befristung nach
// § 1578b BGB, Dreiteilung bei mehreren Berechtigten sowie die
// Einkommensbereinigung selbst – erwartet werden bereinigte Nettoeinkommen.

// Nr. 15.2 der Leitlinien: Vorwegabzug vom Erwerbseinkommen als Erwerbsanreiz.
export const ERWERBSTAETIGENBONUS = 0.1;

// Mindestselbstbehalt gegenüber getrennt lebenden und geschiedenen Ehegatten,
// darin 580 € Warmmiete. Nr. 21.4 der Leitlinien.
export const SELBSTBEHALT_EHEGATTE = {
  erwerbstaetig: 1600,
  nichtErwerbstaetig: 1475,
};

// Oberhalb des höchsten Einkommens der Düsseldorfer Tabelle (11.200 €) trägt
// die Quotenmethode nicht mehr: Es gilt die tatsächliche Vermutung, dass alles
// verbraucht wird, nicht mehr. Der Bedarf muss dann konkret dargelegt werden.
const HOECHSTES_TABELLENEINKOMMEN = 11200;
export const QUOTENUNTERHALT_HOECHSTBEDARF =
  (HOECHSTES_TABELLENEINKOMMEN * (1 - ERWERBSTAETIGENBONUS)) / 2;

function euro(betrag) {
  return Math.round(betrag * 100) / 100;
}

/**
 * @param {object} eingabe
 * @param {number} eingabe.einkommenPflichtig  bereinigtes Nettoeinkommen
 * @param {number} [eingabe.einkommenBerechtigt=0]  bereinigtes Nettoeinkommen
 * @param {boolean} [eingabe.erwerbseinkommenPflichtig=true]  Erwerbseinkommen? Steuert Bonus und Selbstbehalt
 * @param {boolean} [eingabe.erwerbseinkommenBerechtigt=true]  Erwerbseinkommen? Steuert den Bonus
 * @param {number} [eingabe.kindesunterhalt=0]  Summe der Zahlbeträge vorrangiger Kinder
 */
export function berechneEhegattenunterhalt({
  einkommenPflichtig,
  einkommenBerechtigt = 0,
  erwerbseinkommenPflichtig = true,
  erwerbseinkommenBerechtigt = true,
  kindesunterhalt = 0,
}) {
  const e1Roh = Math.max(0, einkommenPflichtig || 0);
  const e2 = Math.max(0, einkommenBerechtigt || 0);
  const ku = Math.max(0, kindesunterhalt || 0);

  // § 1609 BGB: Der Kindesunterhalt geht vor und mindert das Einkommen des
  // Pflichtigen, bevor der Ehegattenbedarf gebildet wird.
  const e1 = Math.max(0, e1Roh - ku);

  const bonus = einkommen => einkommen * (1 - ERWERBSTAETIGENBONUS);
  const e1Bonus = erwerbseinkommenPflichtig ? bonus(e1) : e1;
  const e2Bonus = erwerbseinkommenBerechtigt ? bonus(e2) : e2;

  // Halbteilungsgrundsatz: Der Bedarf jedes Ehegatten ist die Hälfte des
  // gemeinsamen bonusbereinigten Einkommens.
  const bedarfRoh = (e1Bonus + e2Bonus) / 2;
  const konkreteBedarfsberechnung = bedarfRoh > QUOTENUNTERHALT_HOECHSTBEDARF;
  const bedarf = Math.min(bedarfRoh, QUOTENUNTERHALT_HOECHSTBEDARF);

  const anspruch = Math.max(0, bedarf - e2Bonus);

  // Nr. 21.4: Bei der Leistungsfähigkeit bleibt der Erwerbstätigenbonus außer
  // Betracht – maßgeblich ist das volle Einkommen abzüglich Selbstbehalt.
  const selbstbehalt = erwerbseinkommenPflichtig
    ? SELBSTBEHALT_EHEGATTE.erwerbstaetig
    : SELBSTBEHALT_EHEGATTE.nichtErwerbstaetig;
  const leistungsfaehigkeit = Math.max(0, e1 - selbstbehalt);

  const mangelfall = anspruch > leistungsfaehigkeit;
  const unterhalt = mangelfall ? leistungsfaehigkeit : anspruch;

  return {
    unterhalt: euro(unterhalt),
    bedarf: euro(bedarf),
    anspruchVorLeistungsfaehigkeit: euro(anspruch),
    einkommenPflichtigNachKindesunterhalt: euro(e1),
    einkommenPflichtigBonus: euro(e1Bonus),
    einkommenBerechtigtBonus: euro(e2Bonus),
    kindesunterhalt: euro(ku),
    selbstbehalt,
    leistungsfaehigkeit: euro(leistungsfaehigkeit),
    mangelfall,
    konkreteBedarfsberechnung,
  };
}
