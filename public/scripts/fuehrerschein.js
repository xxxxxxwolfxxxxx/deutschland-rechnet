// Führerschein Klasse B: Kosten aus der Preisliste der eigenen Fahrschule
//
// Was eine Fahrschule verlangt, legt kein Gesetz fest. § 32 FahrlG schreibt
// aber vor, welche Entgelte ihr Preisaushang je Klasse nennen muss:
// Grundbetrag, Vorstellungsentgelte für theoretische und praktische Prüfung,
// die Fahrstunde zu 45 Minuten und die besonderen Ausbildungsfahrten. Genau
// diese Beträge trägt der Nutzer ein. Fest vorgegeben sind nur zwei Dinge:
//
//   1. Die besonderen Ausbildungsfahrten nach § 5 Abs. 3 und Anlage 4
//      FahrschAusbO: für Klasse B 5 Überland-, 4 Autobahn- und 3 Fahrten bei
//      Dämmerung oder Dunkelheit, je 45 Minuten. Sie kommen zu den
//      Übungsstunden hinzu; ihre Zahl ist ein Minimum, keine Schätzung.
//   2. Die amtlichen Gebühren nach der Anlage zur GebOSt: Erteilung der
//      Fahrerlaubnis (Nr. 202.1), theoretische Prüfung (Nr. 401.1 und
//      Zuschlag „Prüfung am PC“ nach Nr. 401.3) und praktische Prüfung
//      Klasse B (Nr. 402.3). Die Prüfstelle darf nach § 1 Abs. 3 GebOSt
//      Umsatzsteuer hinzurechnen, sofern die Prüfung ihr unterliegt.
//
// Stand der Normen: FahrschAusbO zuletzt geändert am 18.03.2022, GebOSt
// zuletzt geändert am 12.08.2026 (abgerufen am 15.09.2026).
//
// Nicht enthalten: Wiederholungsprüfungen, Sehtest (§ 12 FeV), Erste-Hilfe-
// Schulung (§ 19 FeV), Lichtbild und Lernmaterial – die Kosten dafür trägt
// der Nutzer als „Sonstiges“ ein, weil sie frei kalkuliert werden.

export const SONDERFAHRTEN_B = Object.freeze({ ueberland: 5, autobahn: 4, dunkelheit: 3 });
export const MINUTEN_JE_AUSBILDUNGSFAHRT = 45;

export const GEBUEHREN = Object.freeze({
  erteilung: 35.7, // Nr. 202.1
  theorie: 11.1, // Nr. 401.1
  theorieAmPc: 9.9, // Nr. 401.3
  praxisB: 109.1, // Nr. 402.3
});

export const UMSATZSTEUERSATZ = 0.19;

const aufCent = (betrag) => Math.round(betrag * 100) / 100;

function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function anzahlSonderfahrten() {
  return SONDERFAHRTEN_B.ueberland + SONDERFAHRTEN_B.autobahn + SONDERFAHRTEN_B.dunkelheit;
}

/**
 * Amtliche Prüfungsgebühren, auf Wunsch mit Umsatzsteuer.
 * @param {number} versuche Zahl der Prüfungsversuche je Teil (mindestens 1)
 */
export function pruefgebuehren({ mitUmsatzsteuer = true, versucheTheorie = 1, versuchePraxis = 1 } = {}) {
  const faktor = mitUmsatzsteuer ? 1 + UMSATZSTEUERSATZ : 1;
  const theorieJe = aufCent((GEBUEHREN.theorie + GEBUEHREN.theorieAmPc) * faktor);
  const praxisJe = aufCent(GEBUEHREN.praxisB * faktor);
  const vt = Math.max(1, Math.floor(zahl(versucheTheorie)) || 1);
  const vp = Math.max(1, Math.floor(zahl(versuchePraxis)) || 1);
  return {
    theorieJe,
    praxisJe,
    theorie: aufCent(theorieJe * vt),
    praxis: aufCent(praxisJe * vp),
    erteilung: GEBUEHREN.erteilung,
  };
}

/**
 * Gesamtkosten Klasse B aus der Preisliste der Fahrschule.
 *
 * @param {object} e
 * @param {number} e.grundbetrag Grundbetrag der Fahrschule (Theorieunterricht)
 * @param {number} e.uebungsstunden Zahl der Übungsstunden zu 45 Minuten, ohne Sonderfahrten
 * @param {number} e.preisUebungsstunde Preis je Übungsstunde
 * @param {number} e.preisSonderfahrt Preis je besondere Ausbildungsfahrt (45 Minuten)
 * @param {number} e.vorstellungTheorie Entgelt der Fahrschule für die Vorstellung zur Theorieprüfung
 * @param {number} e.vorstellungPraxis Entgelt der Fahrschule für die Vorstellung zur praktischen Prüfung
 * @param {number} e.sonstiges Sehtest, Erste Hilfe, Lichtbild, Lernmaterial
 * @param {number} [e.versucheTheorie=1]
 * @param {number} [e.versuchePraxis=1]
 * @param {boolean} [e.mitUmsatzsteuer=true]
 */
export function berechneFuehrerschein({
  grundbetrag,
  uebungsstunden,
  preisUebungsstunde,
  preisSonderfahrt,
  vorstellungTheorie,
  vorstellungPraxis,
  sonstiges,
  versucheTheorie = 1,
  versuchePraxis = 1,
  mitUmsatzsteuer = true,
}) {
  const gebuehren = pruefgebuehren({ mitUmsatzsteuer, versucheTheorie, versuchePraxis });
  const vt = Math.max(1, Math.floor(zahl(versucheTheorie)) || 1);
  const vp = Math.max(1, Math.floor(zahl(versuchePraxis)) || 1);

  const sonderfahrten = anzahlSonderfahrten();
  const posten = {
    grundbetrag: aufCent(zahl(grundbetrag)),
    uebungsstunden: aufCent(Math.floor(zahl(uebungsstunden)) * zahl(preisUebungsstunde)),
    sonderfahrten: aufCent(sonderfahrten * zahl(preisSonderfahrt)),
    vorstellungen: aufCent(vt * zahl(vorstellungTheorie) + vp * zahl(vorstellungPraxis)),
    amtlich: aufCent(gebuehren.theorie + gebuehren.praxis + gebuehren.erteilung),
    sonstiges: aufCent(zahl(sonstiges)),
  };
  const fahrschule = aufCent(posten.grundbetrag + posten.uebungsstunden + posten.sonderfahrten + posten.vorstellungen);
  const gesamt = aufCent(fahrschule + posten.amtlich + posten.sonstiges);

  return {
    posten,
    gebuehren,
    sonderfahrten,
    fahrstundenGesamt: Math.floor(zahl(uebungsstunden)) + sonderfahrten,
    fahrschule,
    gesamt,
    anteilFahrschule: gesamt > 0 ? Math.round((fahrschule / gesamt) * 100) : 0,
  };
}
