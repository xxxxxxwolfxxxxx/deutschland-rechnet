// Kindesunterhalt nach der Düsseldorfer Tabelle, Stand 01.01.2026
//
// Die Tabelle ist kein Gesetz, sondern eine Leitlinie des OLG Düsseldorf, der
// die Familiensenate aller Oberlandesgerichte folgen. Ihre erste Einkommens-
// gruppe ist an den Mindestunterhalt der Mindestunterhaltsverordnung gebunden;
// die übrigen vierzehn Gruppen leiten sich als Prozentsätze daraus ab. Wer die
// Sätze frei setzt, verliert genau diese Kopplung.
//
// Drei Regeln entscheiden über das Ergebnis und fehlen in Rechnern regelmäßig:
//
//   1. Die Tabelle unterstellt ZWEI Unterhaltsberechtigte. Bei einer anderen
//      Zahl wird nicht das Einkommen gekürzt, sondern die Einkommensgruppe
//      gewechselt – bei einem Berechtigten hinauf, bei dreien hinab.
//   2. Der Bedarfskontrollbetrag verteilt das Einkommen zwischen Pflichtigem
//      und Berechtigten ausgewogen. Bleibt er nicht gewahrt, wird so lange in
//      niedrigere Gruppen zurückgestuft, bis er es ist.
//   3. Der Selbstbehalt ist die absolute Untergrenze. Er ist NICHT der
//      Bedarfskontrollbetrag – der greift früher und wirkt anders.
//
// Quellen, abgerufen am 14.08.2026:
//   Düsseldorfer Tabelle Stand 01.01.2026 nebst Anmerkungen, OLG Düsseldorf
//     https://www.olg-duesseldorf.nrw.de/infos/Duesseldorfer_Tabelle/
//   Unterhaltsrechtliche Leitlinien der Familiensenate in Nordrhein-Westfalen
//     Stand 01.01.2026, Nr. 21 (Selbstbehalte)
//     https://www.olg-hamm.nrw.de/infos/Leitlinien-NRW/LL-NRW-2026.pdf
//   Siebte Verordnung zur Änderung der Mindestunterhaltsverordnung
//     vom 15.11.2024 (Mindestunterhalt 2026)
//   § 1612b BGB (Kindergeldanrechnung), § 1603 BGB (Selbstbehalt),
//   § 66 Abs. 1 EStG (Kindergeld 259 € ab 01.01.2026)
//
// NICHT abgebildet, weil das Formular die nötigen Angaben nicht erhebt:
//   Mehr- und Sonderbedarf (§§ 1610 Abs. 2, 1613 Abs. 2 BGB), Wechselmodell
//   (BGH XII ZB 565/15), anteilige Haftung beider Eltern beim volljährigen
//   Kind (§ 1606 Abs. 3 BGB) sowie die Einkommensbereinigung selbst – der
//   Rechner setzt ein bereits bereinigtes Nettoeinkommen voraus.

export const KINDERGELD = 259;

// Mindestunterhalt 2026 der ersten drei Altersstufen. Der Satz der vierten
// Stufe ist kein eigener Mindestunterhalt, sondern mit 125 % des Satzes der
// zweiten Altersstufe abgeleitet: Math.ceil(558 * 1.25) = 698.
export const MINDESTUNTERHALT = [486, 558, 653];
const BEDARF_VOLLJAEHRIG = Math.ceil(MINDESTUNTERHALT[1] * 1.25);

// Volljährige mit eigenem Hausstand haben einen von der Tabelle unabhängigen
// Festbedarf, darin 440 € Warmmiete und bis zu 100 € berufsbedingte Kosten.
export const BEDARF_EIGENER_HAUSSTAND = 990;

export const SELBSTBEHALT = {
  // § 1603 Abs. 2 BGB, gegenüber minderjährigen und diesen gleichgestellten
  // Kindern. Darin 520 € Warmmiete.
  notwendigErwerbstaetig: 1450,
  notwendigNichtErwerbstaetig: 1200,
  // § 1603 Abs. 1 BGB, gegenüber sonstigen volljährigen Kindern. Darin 650 €
  // Warmmiete. Für Erwerbstätige und Nichterwerbstätige gleich hoch.
  angemessen: 1750,
};

// Zuschlag je Einkommensgruppe auf den Mindestunterhalt: Gruppen 2 bis 5 je
// 5 Prozentpunkte, ab Gruppe 6 je 8. Aufgerundet auf volle Euro.
const PROZENTSAETZE = [100, 105, 110, 115, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200];

const OBERGRENZEN = [2100, 2500, 2900, 3300, 3700, 4100, 4500, 4900, 5300, 5700, 6400, 7200, 8200, 9700, 11200];

// Der Bedarfskontrollbetrag der ersten Gruppe ist in der Tabelle nicht als
// eigener Wert ausgewiesen, sondern entspricht dem jeweils einschlägigen
// Selbstbehalt. Deshalb hier null – er wird zur Laufzeit eingesetzt.
const KONTROLLBETRAEGE = [null, 1750, 1850, 1950, 2050, 2150, 2250, 2350, 2450, 2550, 2850, 3250, 3750, 4350, 5050];

export const DT_2026 = OBERGRENZEN.map((bis, i) => ({
  gruppe: i + 1,
  bis,
  saetze: [...MINDESTUNTERHALT, BEDARF_VOLLJAEHRIG].map(
    basis => Math.ceil((basis * PROZENTSAETZE[i]) / 100),
  ),
  bedarfskontrollbetrag: KONTROLLBETRAEGE[i],
}));

const ALTERSSTUFEN_LABEL = ['0–5 Jahre', '6–11 Jahre', '12–17 Jahre', 'ab 18 Jahre'];

function altersstufeIndex(alter) {
  if (alter <= 5) return 0;
  if (alter <= 11) return 1;
  if (alter <= 17) return 2;
  return 3;
}

function euro(betrag) {
  return Math.round(betrag * 100) / 100;
}

/**
 * @param {object} eingabe
 * @param {number} eingabe.nettoEinkommen  bereinigtes Nettoeinkommen des Pflichtigen
 * @param {number} eingabe.alterKind
 * @param {number} [eingabe.anzahlBerechtigte=2]  alle Unterhaltsberechtigten, nicht nur dieses Kind
 * @param {boolean} [eingabe.erwerbstaetig=true]
 * @param {boolean} [eingabe.eigenerHausstand=false]  volljährig und außerhalb des Elternhaushalts
 * @param {boolean} [eingabe.schulausbildung=false]  in allgemeiner Schulausbildung
 */
export function berechneKindesunterhalt({
  nettoEinkommen,
  alterKind,
  anzahlBerechtigte = 2,
  erwerbstaetig = true,
  eigenerHausstand = false,
  schulausbildung = false,
}) {
  const einkommen = Math.max(0, nettoEinkommen || 0);
  const berechtigte = Math.max(1, anzahlBerechtigte || 1);
  const stufe = altersstufeIndex(alterKind);
  const volljaehrig = alterKind >= 18;

  // § 1603 Abs. 2 Satz 2 BGB stellt unverheiratete Kinder bis 21 im Haushalt
  // eines Elternteils, die noch zur Schule gehen, minderjährigen Kindern
  // gleich. Für sie gilt der niedrigere notwendige Selbstbehalt.
  const privilegiert = volljaehrig && alterKind < 21 && !eigenerHausstand && schulausbildung;
  const wieMinderjaehrig = !volljaehrig || privilegiert;

  const selbstbehalt = wieMinderjaehrig
    ? (erwerbstaetig ? SELBSTBEHALT.notwendigErwerbstaetig : SELBSTBEHALT.notwendigNichtErwerbstaetig)
    : SELBSTBEHALT.angemessen;

  // § 1612b BGB: Das Kindergeld mindert den Barbedarf bei minderjährigen
  // Kindern zur Hälfte, weil der andere Elternteil den Betreuungsunterhalt
  // erbringt. Beim volljährigen Kind entfällt dieser Ausgleich.
  const kindergeldAnrechnung = volljaehrig ? KINDERGELD : KINDERGELD / 2;

  let bedarf;
  let einkommensgruppe = null;
  let einkommensgruppeVorRueckstufung = null;
  let rueckstufung = false;
  let ueberTabelle = false;

  if (volljaehrig && eigenerHausstand) {
    bedarf = BEDARF_EIGENER_HAUSSTAND;
  } else {
    ueberTabelle = einkommen > OBERGRENZEN[OBERGRENZEN.length - 1];

    let idx = OBERGRENZEN.findIndex(grenze => einkommen <= grenze);
    if (idx === -1) idx = DT_2026.length - 1;

    // Anmerkung A der Tabelle: Ab- und Zuschläge bei abweichender Zahl der
    // Berechtigten erfolgen über die Einstufung, nicht über das Einkommen.
    idx = Math.min(DT_2026.length - 1, Math.max(0, idx + (2 - berechtigte)));
    einkommensgruppeVorRueckstufung = idx + 1;

    // Rückstufung, solange dem Pflichtigen der Bedarfskontrollbetrag nach
    // Abzug sämtlicher Zahlbeträge nicht verbleibt. Unterstellt gleich hohe
    // Zahlbeträge für alle Berechtigten – bei stark unterschiedlichem Alter
    // der Kinder ist das eine Näherung.
    while (idx > 0) {
      const zahlbetragTest = Math.max(0, DT_2026[idx].saetze[stufe] - kindergeldAnrechnung);
      const kontrolle = DT_2026[idx].bedarfskontrollbetrag ?? selbstbehalt;
      if (einkommen - zahlbetragTest * berechtigte >= kontrolle) break;
      idx -= 1;
      rueckstufung = true;
    }

    bedarf = DT_2026[idx].saetze[stufe];
    einkommensgruppe = idx + 1;
  }

  let zahlbetrag = Math.max(0, bedarf - kindergeldAnrechnung);

  // § 1603 BGB: Unterhalb des Selbstbehalts ist der Pflichtige nicht
  // leistungsfähig. Der verbleibende Betrag wird auf alle Berechtigten
  // verteilt (Mangelfall).
  const verteilbar = Math.max(0, einkommen - selbstbehalt);
  const gesamtlast = zahlbetrag * berechtigte;
  const mangelfall = gesamtlast > verteilbar;
  if (mangelfall) zahlbetrag = verteilbar / berechtigte;

  return {
    bedarf: euro(bedarf),
    zahlbetrag: euro(zahlbetrag),
    kindergeldAnrechnung: euro(kindergeldAnrechnung),
    einkommensgruppe,
    einkommensgruppeVorRueckstufung,
    rueckstufung,
    ueberTabelle,
    altersstufe: stufe + 1,
    altersstufeLabel: ALTERSSTUFEN_LABEL[stufe],
    selbstbehalt,
    verteilbar: euro(verteilbar),
    mangelfall,
    volljaehrig,
    privilegiert,
    anzahlBerechtigte: berechtigte,
    bedarfskontrollbetrag: einkommensgruppe
      ? (DT_2026[einkommensgruppe - 1].bedarfskontrollbetrag ?? selbstbehalt)
      : null,
  };
}
