// Geburtstermin, Schwangerschaftswoche und Mutterschaftsgeld
//
// Rechtsstand: 2026-01-01
// Primärquellen:
//   § 3 MuSchG   – Schutzfristen vor und nach der Entbindung
//     https://www.gesetze-im-internet.de/muschg_2018/__3.html
//   § 19 MuSchG  – Anspruch auf Mutterschaftsgeld
//   § 20 MuSchG  – Zuschuss des Arbeitgebers
//     https://www.gesetze-im-internet.de/muschg_2018/__20.html
//   § 24i SGB V  – Mutterschaftsgeld, Höchstbetrag 13 Euro je Kalendertag
//     https://www.gesetze-im-internet.de/sgb_5/__24i.html
//
// Der Geburtstermin folgt der Naegele-Regel: erster Tag der letzten Periode
// plus 280 Tage. Die Schutzfrist umfasst 6 Wochen vor und 8 Wochen nach der
// Entbindung, zusammen 98 Kalendertage. Bei Früh- und Mehrlingsgeburten sind
// es nach § 3 Abs. 2 MuSchG 12 Wochen danach; dieser Fall gehört in den
// Mutterschutz-Rechner (mutterschutz.js) und wird hier nicht abgebildet.

/** Naegele-Regel: 280 Tage ab dem ersten Tag der letzten Periode. */
const TRAGZEIT_TAGE = 280;

/** § 3 Abs. 1 MuSchG – 6 Wochen vor der Entbindung. */
const SCHUTZFRIST_VOR_GEBURT_TAGE = 42;

/** § 3 Abs. 2 Satz 1 MuSchG – 8 Wochen nach der Entbindung. */
const SCHUTZFRIST_NACH_GEBURT_TAGE = 56;

/** § 24i Abs. 2 Satz 2 SGB V – Höchstbetrag der Krankenkasse je Kalendertag. */
const MUTTERSCHAFTSGELD_HOECHSTBETRAG_TAG = 13;

/**
 * Divisor, mit dem dieses Modul das Monatsnetto auf Kalendertage umrechnet.
 *
 * Eine Modellannahme, keine Gesetzesgröße: § 20 Abs. 1 Satz 2 MuSchG stellt auf
 * das durchschnittliche kalendertägliche Nettoentgelt der letzten drei
 * abgerechneten Kalendermonate ab (§ 21 MuSchG), nicht auf einen festen Teiler.
 */
const TAGE_JE_MONAT = 30;

/**
 * Kalendertage, für die gezahlt wird: die 14 Wochen Schutzfrist und zusätzlich
 * der Entbindungstag. Beide Leistungen nennen ihn ausdrücklich – § 24i Abs. 3
 * Satz 1 SGB V für das Mutterschaftsgeld, § 20 Abs. 1 Satz 1 MuSchG für den
 * Zuschuss des Arbeitgebers. Bis September 2026 rechnete dieses Modul nur mit
 * den 98 Tagen der Schutzfristen.
 */
const ZAHLTAGE = SCHUTZFRIST_VOR_GEBURT_TAGE + SCHUTZFRIST_NACH_GEBURT_TAGE + 1;

/** Ein Kalendertag in Millisekunden. */
const TAG_MS = 24 * 60 * 60 * 1000;

/**
 * Mitternacht des angegebenen Tages in UTC.
 *
 * Sommer- und Winterzeit verschieben sonst jede Differenzrechnung um eine
 * Stunde und damit an der Tagesgrenze um einen ganzen Tag.
 */
function tagesbeginnUTC(datum) {
  const d = new Date(datum);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function berechneSchwangerschaft({ letztePeriode, netto, arbeitgeberZuschuss }) {
  const lpUTC = tagesbeginnUTC(letztePeriode);
  const geburtstermin = new Date(lpUTC + TRAGZEIT_TAGE * TAG_MS);

  const heute = new Date();
  const heuteUTC = Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate());
  const tageSchwanger = Math.floor((heuteUTC - lpUTC) / TAG_MS);
  const sswochen = Math.floor(tageSchwanger / 7);
  const ssTage = tageSchwanger % 7;

  // § 24i Abs. 2 SGB V: die Krankenkasse zahlt das kalendertägliche
  // Nettoentgelt, höchstens aber 13 Euro.
  const nettoTag = netto / TAGE_JE_MONAT;
  const mutterschaftsgeldTag = Math.min(MUTTERSCHAFTSGELD_HOECHSTBETRAG_TAG, nettoTag);
  const mutterschaftsgeldVorGeburt = mutterschaftsgeldTag * SCHUTZFRIST_VOR_GEBURT_TAGE;
  const mutterschaftsgeldNachGeburt = mutterschaftsgeldTag * SCHUTZFRIST_NACH_GEBURT_TAGE;
  const mutterschaftsgeldGesamt = mutterschaftsgeldTag * ZAHLTAGE;

  // § 20 Abs. 1 MuSchG: der Arbeitgeber zahlt die Differenz zwischen 13 Euro
  // und dem kalendertäglichen Nettoentgelt – für dieselben Tage.
  const arbeitgeberTag = arbeitgeberZuschuss ? Math.max(0, nettoTag - mutterschaftsgeldTag) : 0;
  const gesamt = mutterschaftsgeldGesamt + arbeitgeberTag * ZAHLTAGE;

  return {
    geburtstermin,
    ssw: sswochen,
    sswTage: ssTage,
    mutterschaftsgeldTag: Math.round(mutterschaftsgeldTag * 100) / 100,
    mutterschaftsgeldVorGeburt: Math.round(mutterschaftsgeldVorGeburt * 100) / 100,
    mutterschaftsgeldNachGeburt: Math.round(mutterschaftsgeldNachGeburt * 100) / 100,
    mutterschaftsgeldGesamt: Math.round(mutterschaftsgeldGesamt * 100) / 100,
    zahltage: ZAHLTAGE,
    arbeitgeberzuschuss: Math.round(arbeitgeberTag * ZAHLTAGE * 100) / 100,
    gesamt: Math.round(gesamt * 100) / 100,
  };
}

export {
  berechneSchwangerschaft,
  TRAGZEIT_TAGE,
  SCHUTZFRIST_VOR_GEBURT_TAGE,
  SCHUTZFRIST_NACH_GEBURT_TAGE,
  MUTTERSCHAFTSGELD_HOECHSTBETRAG_TAG,
  TAGE_JE_MONAT,
  ZAHLTAGE,
};
