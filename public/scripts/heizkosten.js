// Heizkosten: Verbrauchskosten, CO2-Preisbestandteil und Aufteilung zwischen
// Mieter und Vermieter.
//
// Rechtsgrundlagen:
//   § 10 Abs. 2 BEHG            – Preis der Emissionszertifikate
//   EBeV 2030 Anlage 2 Teil 4   – Standardwerte für Heizwert und Emissionsfaktor
//   § 3 CO2KostAufG             – Ausweis des CO2-Preisbestandteils auf der Rechnung
//   Anlage zu §§ 5–7 CO2KostAufG – Stufenmodell für die Aufteilung bei Wohngebäuden
//
// Die Brennstoffpreise sind KEINE Rechtsgrößen, sondern Marktpreise. Sie stehen
// hier als klar datierte Annahme und sind auf allen Seiten überschreibbar.

export const HEIZKOSTEN_STAND = '2026-08';

// § 10 Abs. 2 Satz 2 BEHG: Festpreise der Einführungsphase.
export const CO2_FESTPREIS_EURO_JE_TONNE = {
  2021: 25,
  2022: 30,
  2023: 30,
  2024: 45,
  2025: 55,
};

// § 10 Abs. 1 Satz 2 BEHG: ab 2026 werden die Zertifikate versteigert.
// § 10 Abs. 2 Satz 5 BEHG: für 2026 gilt dabei ein Preiskorridor.
export const CO2_PREISKORRIDOR_2026 = { min: 55, max: 65 };

// Gerechnet wird mit dem Mindestpreis – der tatsächliche Auktionspreis steht
// erst nach der Versteigerung fest und kann bis zum Höchstpreis liegen.
export const CO2_PREIS_AKTUELL = CO2_PREISKORRIDOR_2026.min;

// § 3 Abs. 3 CO2KostAufG: der ausgewiesene Preisbestandteil enthält die
// darauf anfallende Umsatzsteuer.
export const UMSATZSTEUERSATZ = 0.19;

// EBeV 2030 Anlage 2 Teil 4. `gjJeMwh` ist der dortige Umrechnungsfaktor je
// abgerechneter Megawattstunde; bei Erdgas liegt er mit 3,2508 unter den
// physikalischen 3,6, weil Gas in Brennwert-Kilowattstunden abgerechnet wird.
export const BEHG_STANDARDWERTE = {
  gas:         { nummer: '6',  gjJeMwh: 3.2508, tCo2JeGj: 0.0558 },
  heizoel:     { nummer: '3b', gjJeMwh: 3.6,    tCo2JeGj: 0.074, gjJeTonne: 42.8, tJe1000Liter: 0.845 },
  fluessiggas: { nummer: '5b', gjJeMwh: 3.6,    tCo2JeGj: 0.0655, gjJeTonne: 46.0 },
};

const KWH_JE_GJ = 1000 / 3.6;

function runde2(betrag) {
  return Math.round(betrag * 100) / 100;
}

/**
 * Emissionsfaktor eines Brennstoffs in kg CO2 je abgerechneter Kilowattstunde.
 * Brennstoffe ohne BEHG-Pflicht (Biomasse, Strom, Wärmelieferung) ergeben 0:
 * Für sie weist der Lieferant den Bestandteil selbst aus (§ 3 Abs. 4 CO2KostAufG),
 * er lässt sich nicht pauschal berechnen.
 */
export function emissionsfaktor(brennstoff) {
  const werte = BEHG_STANDARDWERTE[brennstoff];
  if (!werte) return 0;
  return werte.gjJeMwh * werte.tCo2JeGj;
}

/** Energiegehalt eines Liters Heizöl EL nach EBeV 2030 Anlage 2 Teil 4 Nr. 3b. */
export function kwhJeLiterHeizoel() {
  const { gjJeTonne, tJe1000Liter } = BEHG_STANDARDWERTE.heizoel;
  return (gjJeTonne * tJe1000Liter * KWH_JE_GJ) / 1000;
}

/**
 * CO2-Preisbestandteil einer Brennstoffmenge – der Betrag, den der Lieferant
 * nach § 3 Abs. 1 Nr. 2 CO2KostAufG auf der Rechnung ausweist. Er ist im
 * Arbeitspreis bereits enthalten und kommt nicht obendrauf.
 */
export function co2Preisbestandteil({
  verbrauchKwh,
  brennstoff,
  preisJeTonne = CO2_PREIS_AKTUELL,
  mitUmsatzsteuer = true,
}) {
  const faktor = emissionsfaktor(brennstoff);
  const emissionenKg = verbrauchKwh * faktor;
  const kostenNetto = runde2((emissionenKg / 1000) * preisJeTonne);
  const kosten = mitUmsatzsteuer ? runde2(kostenNetto * (1 + UMSATZSTEUERSATZ)) : kostenNetto;
  const centProKwh = verbrauchKwh > 0 ? (kosten / verbrauchKwh) * 100 : 0;
  return { emissionenKg, kostenNetto, kosten, centProKwh, emissionsfaktor: faktor, preisJeTonne };
}

/**
 * Wärmepreis einer Wärmepumpe: Der Strompreis gilt je Kilowattstunde Strom,
 * die Wärmepumpe macht daraus JAZ Kilowattstunden Wärme.
 */
export function waermepreisWaermepumpe({ strompreisCent, jaz }) {
  if (!(jaz > 0)) throw new Error('Die Jahresarbeitszahl muss größer als 0 sein.');
  return strompreisCent / jaz;
}

/**
 * Abgerechnete Kilowattstunden, die für einen Wärmebedarf nötig sind – bei
 * Verbrennung mehr als der Bedarf, bei der Wärmepumpe ein Bruchteil davon.
 */
export function abgerechneteKwh({ waermebedarfKwh, nutzungsgrad }) {
  if (!(nutzungsgrad > 0)) throw new Error('Der Nutzungsgrad muss größer als 0 sein.');
  return waermebedarfKwh / nutzungsgrad;
}

// Marktannahmen (Stand siehe HEIZKOSTEN_STAND).
//
// `arbeitspreisCent` ist der Preis je ABGERECHNETER Kilowattstunde – also je
// kWh Gas, Heizöl, Pellets, gelieferter Fernwärme oder Strom, so wie er auf der
// Rechnung steht. `nutzungsgrad` gibt an, wie viel Wärme daraus wird; bei der
// Wärmepumpe übernimmt die Jahresarbeitszahl diese Rolle. Erst der Quotient aus
// beidem, der Wärmepreis, ist zwischen den Heizungsarten vergleichbar.
//
// Preise schwanken regional und je Vertrag erheblich und sind auf allen Seiten
// überschreibbar.
export const BRENNSTOFFE = {
  gas:         { label: 'Erdgas',      arbeitspreisCent: 11.0, nutzungsgrad: 0.95, grundpreisJahr: 180, behg: 'gas' },
  heizoel:     { label: 'Heizöl',      arbeitspreisCent: 10.5, nutzungsgrad: 0.92, grundpreisJahr: 0,   behg: 'heizoel' },
  fernwaerme:  { label: 'Fernwärme',   arbeitspreisCent: 14.5, nutzungsgrad: 1.0,  grundpreisJahr: 400, behg: null },
  pellets:     { label: 'Holzpellets', arbeitspreisCent: 7.0,  nutzungsgrad: 0.88, grundpreisJahr: 0,   behg: null },
  waermepumpe: {
    label: 'Wärmepumpe',
    arbeitspreisCent: 26.0, // Wärmepumpenstrom
    jaz: 3.5,
    get nutzungsgrad() { return this.jaz; },
    grundpreisJahr: 130,
    behg: null,
  },
};

/**
 * Preis je Kilowattstunde Wärme – die einzige zwischen Heizungsarten
 * vergleichbare Größe. Bei der Wärmepumpe ist der Nutzungsgrad die
 * Jahresarbeitszahl und größer als eins.
 */
export function waermepreisCent({ arbeitspreisCent, nutzungsgrad }) {
  if (!(nutzungsgrad > 0)) throw new Error('Der Nutzungsgrad muss größer als 0 sein.');
  return arbeitspreisCent / nutzungsgrad;
}

// Anlage zu den §§ 5 bis 7 CO2KostAufG: Aufteilung der CO2-Kosten bei
// Wohngebäuden nach dem spezifischen Ausstoß in kg CO2 je m² Wohnfläche und Jahr.
export const MIETERANTEIL_STUFEN = [
  { bis: 12,       mieter: 1.0,  vermieter: 0.0  },
  { bis: 17,       mieter: 0.9,  vermieter: 0.1  },
  { bis: 22,       mieter: 0.8,  vermieter: 0.2  },
  { bis: 27,       mieter: 0.7,  vermieter: 0.3  },
  { bis: 32,       mieter: 0.6,  vermieter: 0.4  },
  { bis: 37,       mieter: 0.5,  vermieter: 0.5  },
  { bis: 42,       mieter: 0.4,  vermieter: 0.6  },
  { bis: 47,       mieter: 0.3,  vermieter: 0.7  },
  { bis: 52,       mieter: 0.2,  vermieter: 0.8  },
  { bis: Infinity, mieter: 0.05, vermieter: 0.95 },
];

/** Aufteilungsverhältnis der CO2-Kosten nach der Anlage zum CO2KostAufG. */
export function mieteranteilCo2Kosten(kgProQuadratmeterJahr) {
  const stufe = MIETERANTEIL_STUFEN.find(s => kgProQuadratmeterJahr < s.bis) ?? MIETERANTEIL_STUFEN.at(-1);
  return { mieter: stufe.mieter, vermieter: stufe.vermieter, stufe: MIETERANTEIL_STUFEN.indexOf(stufe) + 1 };
}

/**
 * Jahres- und Monatskosten aus Verbrauch, Arbeitspreis und Grundpreis.
 * Ist ein BEHG-Brennstoff angegeben, wird zusätzlich ausgewiesen, welcher
 * Anteil der Kosten auf den CO2-Preis entfällt.
 */
export function berechneHeizkosten({
  verbrauchKwh,
  preisCent,
  grundpreisJahr = 0,
  brennstoff = null,
  co2PreisJeTonne = CO2_PREIS_AKTUELL,
}) {
  const arbeitskosten = Math.round(verbrauchKwh * preisCent) / 100;
  const grundpreis = runde2(grundpreisJahr);
  const kosten = runde2(arbeitskosten + grundpreis);
  const monat = runde2(kosten / 12);
  const co2Anteil = co2Preisbestandteil({ verbrauchKwh, brennstoff, preisJeTonne: co2PreisJeTonne });
  return { kosten, monat, arbeitskosten, grundpreis, co2Anteil };
}
