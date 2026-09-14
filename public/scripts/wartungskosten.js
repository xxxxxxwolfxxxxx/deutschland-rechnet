// Werkstattkosten eines Autos aus den eigenen Rechnungen
//
// Früher enthielt dieses Modul sechs Fahrzeugklassen mit Wartungs-, Verschleiß-
// und Reifenwerten und einen Altersfaktor (0,5 plus 0,12 je Jahr). Keine dieser
// Zahlen hatte eine Quelle; die Seite schrieb die Größenordnungen dem ADAC zu.
// Werkstattpreise hängen an Modell, Region und Werkstatt – eine belastbare
// Durchschnittstabelle nach Klasse und Alter gibt es nicht.
//
// Das Modul rechnet deshalb nur mit Beträgen und Intervallen, die der Nutzer aus
// Rechnungen, Serviceheft und Herstellervorgaben kennt: Jeder Posten wird so oft
// im Jahr fällig, wie es das Kilometer- oder das Zeitintervall verlangt – je
// nachdem, welches zuerst erreicht wird.
//
// Belegt ist nur das Intervall der Hauptuntersuchung: Anlage VIII Nr. 2.1.2.1
// StVZO, https://www.gesetze-im-internet.de/stvzo_2012/anlage_viii.html
// (abgerufen am 14.09.2026).

/** Anlage VIII Nr. 2.1.2.1 StVZO: Pkw erstmals nach 36, danach alle 24 Monate */
export const HU_ERSTE_NACH_MONATEN = 36;
export const HU_ABSTAND_MONATE = 24;

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);
const runde = (n) => Math.round(n * 100) / 100;

/**
 * Wie oft ein Posten im Jahr fällig wird.
 *
 * @param {{ alleKm?: number, alleMonate?: number }} posten
 * @param {number} kmProJahr
 * @returns {number} Fälligkeiten je Jahr (auch Bruchteile)
 */
export function faelligkeitenProJahr({ alleKm = 0, alleMonate = 0 }, kmProJahr) {
  const nachKm = zahl(alleKm) > 0 ? zahl(kmProJahr) / zahl(alleKm) : 0;
  const nachZeit = zahl(alleMonate) > 0 ? 12 / zahl(alleMonate) : 0;
  return Math.max(nachKm, nachZeit);
}

/**
 * @param {object} p
 * @param {number} p.kmProJahr
 * @param {{ name: string, betrag: number, alleKm?: number, alleMonate?: number }[]} p.posten
 */
export function berechneWartungskosten({ kmProJahr, posten = [] }) {
  const km = zahl(kmProJahr);
  const einzeln = posten.map((p) => {
    const haeufigkeit = faelligkeitenProJahr(p, km);
    return { name: p.name, haeufigkeit: runde(haeufigkeit), proJahr: runde(zahl(p.betrag) * haeufigkeit) };
  });
  const gesamt = einzeln.reduce((summe, p) => summe + p.proJahr, 0);
  return {
    posten: einzeln,
    gesamtProJahr: runde(gesamt),
    gesamtProMonat: runde(gesamt / 12),
    centProKm: km > 0 ? runde((gesamt / km) * 100) : null,
  };
}
