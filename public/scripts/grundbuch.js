// Kosten einer Grundbucheintragung
//
// Der Rechner arbeitete mit festen Prozentsätzen (1 % Notar, 0,5 % Grundbuch,
// 20 € Beglaubigung). Tatsächlich sind das Wertgebühren nach Tabelle B des
// GNotKG, deren Gebührensätze im Kostenverzeichnis (Anlage 1 GNotKG) je
// Eintragungsart einzeln festgelegt sind.
//
// Quelle: https://www.gesetze-im-internet.de/gnotkg/ (Stand 06.05.2026)
import { gebuehrB } from './gnotkg.js';

// KV 32014: Umsatzsteuer auf die Notarkosten. Die Grundbuchgebühren selbst
// sind Gerichtsgebühren und damit nicht umsatzsteuerbar.
const UMSATZSTEUERSATZ = 0.19;

/**
 * Eintragungsarten mit ihren Positionen aus dem Kostenverzeichnis.
 *
 * `grundbuch` ist die Gerichtsgebühr des Grundbuchamts, `notar` die davon
 * getrennte notarielle Gebühr für die zugrunde liegende Beurkundung bzw.
 * Beglaubigung. `festbetrag` steht für Positionen, die nicht nach dem
 * Geschäftswert, sondern als feste Gebühr erhoben werden.
 */
export const EINTRAGUNGSARTEN = {
  eigentuemer: {
    label: 'Eigentümer eintragen (Kauf)',
    wertLabel: 'Kaufpreis',
    wertGrundlage: 'Kaufpreis (§ 47 GNotKG)',
    grundbuch: { kv: '14110', bezeichnung: 'Eintragung des Eigentümers', satz: 1.0 },
    notar: { kv: '21100', bezeichnung: 'Beurkundung Kaufvertrag mit Auflassung', satz: 2.0, mindestbetrag: 120 },
  },
  auflassungsvormerkung: {
    label: 'Auflassungsvormerkung eintragen',
    wertLabel: 'Kaufpreis',
    wertGrundlage: 'Kaufpreis (§ 47 GNotKG)',
    grundbuch: { kv: '14150', bezeichnung: 'Eintragung einer Vormerkung', satz: 0.5 },
    notar: { kv: '21201', bezeichnung: 'Beurkundung der Bewilligung nach GBO', satz: 0.5, mindestbetrag: 30 },
  },
  grundschuldBuch: {
    label: 'Grundschuld/Hypothek als Buchrecht',
    wertLabel: 'Darlehensbetrag',
    wertGrundlage: 'Nennbetrag der Schuld (§ 53 Abs. 1 GNotKG)',
    grundbuch: { kv: '14121', bezeichnung: 'Eintragung eines sonstigen Rechts', satz: 1.0 },
    notar: { kv: '21200', bezeichnung: 'Beurkundung der Grundschuldbestellung', satz: 1.0, mindestbetrag: 60 },
  },
  grundschuldBrief: {
    label: 'Grundschuld/Hypothek als Briefrecht',
    wertLabel: 'Darlehensbetrag',
    wertGrundlage: 'Nennbetrag der Schuld (§ 53 Abs. 1 GNotKG)',
    grundbuch: { kv: '14120', bezeichnung: 'Eintragung einer Briefgrundschuld', satz: 1.3 },
    notar: { kv: '21200', bezeichnung: 'Beurkundung der Grundschuldbestellung', satz: 1.0, mindestbetrag: 60 },
  },
  loeschungVormerkung: {
    label: 'Vormerkung löschen',
    wertLabel: 'Wert des vorgemerkten Rechts',
    wertGrundlage: 'Wert des vorgemerkten Rechts',
    grundbuch: { kv: '14152', bezeichnung: 'Löschung einer Vormerkung', festbetrag: 25 },
    notar: { kv: '25100', bezeichnung: 'Beglaubigung der Löschungsbewilligung', satz: 0.2, mindestbetrag: 20, hoechstbetrag: 70 },
  },
};

const STANDARD_ART = 'eigentuemer';

function rundeAufCent(betrag) {
  return Math.round(betrag * 100) / 100;
}

function berechnePosition(position, geschaeftswert) {
  const betrag = position.festbetrag !== undefined
    ? position.festbetrag
    : gebuehrB(geschaeftswert, position.satz, position.mindestbetrag, position.hoechstbetrag);
  return { ...position, betrag };
}

/**
 * Kosten einer Grundbucheintragung nach GNotKG.
 *
 * @param {object} eingabe
 * @param {number} eingabe.geschaeftswert Geschäftswert in Euro
 * @param {string} eingabe.art Schlüssel aus EINTRAGUNGSARTEN
 * @returns {{art: string, geschaeftswert: number, grundbuch: object,
 *   notar: object, umsatzsteuer: number, notarBrutto: number, gesamt: number,
 *   gesamtProzent: number|null}}
 */
export function berechneGrundbuchkosten({ geschaeftswert, art }) {
  const artSchluessel = EINTRAGUNGSARTEN[art] ? art : STANDARD_ART;
  const eintragungsart = EINTRAGUNGSARTEN[artSchluessel];
  const wert = Number.isFinite(Number(geschaeftswert)) ? Math.max(Number(geschaeftswert), 0) : 0;

  const grundbuch = berechnePosition(eintragungsart.grundbuch, wert);
  const notar = berechnePosition(eintragungsart.notar, wert);
  const umsatzsteuer = rundeAufCent(notar.betrag * UMSATZSTEUERSATZ);
  const gesamt = rundeAufCent(grundbuch.betrag + notar.betrag + umsatzsteuer);

  return {
    art: artSchluessel,
    label: eintragungsart.label,
    wertGrundlage: eintragungsart.wertGrundlage,
    geschaeftswert: wert,
    grundbuch,
    notar,
    umsatzsteuer,
    notarBrutto: rundeAufCent(notar.betrag + umsatzsteuer),
    gesamt,
    gesamtProzent: wert > 0 ? Math.round((gesamt / wert) * 1000) / 10 : null,
  };
}
