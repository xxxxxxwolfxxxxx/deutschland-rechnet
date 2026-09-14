// Schutzfristen nach § 3 MuSchG
//
// Quelle: https://www.gesetze-im-internet.de/muschg_2018/__3.html (abgerufen am 14.09.2026)
//
// - Abs. 1 Satz 1: sechs Wochen vor der Entbindung. Maßgeblich ist der
//   voraussichtliche Tag der Entbindung (Satz 4); entbindet die Frau nicht an
//   diesem Tag, verkürzt oder verlängert sich die Frist vor der Entbindung (Satz 5).
// - Abs. 2 Satz 1: acht Wochen nach der Entbindung.
// - Abs. 2 Satz 2: zwölf Wochen bei Frühgeburten, Mehrlingsgeburten und wenn
//   vor Ablauf von acht Wochen eine Behinderung des Kindes ärztlich festgestellt wird.
// - Abs. 2 Satz 3: Bei vorzeitiger Entbindung verlängert sich die Frist nach
//   der Entbindung um den Zeitraum, um den sich die Frist davor verkürzt hat.

export const SCHUTZFRIST_VOR_TAGE = 42;
export const SCHUTZFRIST_NACH_TAGE = 56;
export const SCHUTZFRIST_NACH_VERLAENGERT_TAGE = 84;

const TAG_MS = 24 * 60 * 60 * 1000;
const datum = (s) => new Date(`${s}T00:00:00Z`);
const iso = (d) => d.toISOString().split('T')[0];
const plusTage = (d, n) => new Date(d.getTime() + n * TAG_MS);

/**
 * @param {object} p
 * @param {string} p.geburtstermin voraussichtlicher Entbindungstag (YYYY-MM-DD)
 * @param {string} [p.entbindung] tatsächlicher Entbindungstag, falls schon bekannt
 * @param {boolean} [p.verlaengert] Früh- oder Mehrlingsgeburt oder festgestellte Behinderung
 * @param {boolean} [p.fruehgeburt] ältere Schnittstelle, gleichbedeutend mit verlaengert
 */
export function berechneMutterschutz({ geburtstermin, entbindung, verlaengert = false, fruehgeburt = false }) {
  const termin = datum(geburtstermin);
  const geburt = entbindung ? datum(entbindung) : termin;
  const schutzNachGeburt = verlaengert || fruehgeburt ? SCHUTZFRIST_NACH_VERLAENGERT_TAGE : SCHUTZFRIST_NACH_TAGE;

  const beginn = plusTage(termin, -SCHUTZFRIST_VOR_TAGE);
  const verkuerzung = Math.max(0, Math.round((termin - geburt) / TAG_MS));
  const ende = plusTage(geburt, schutzNachGeburt + verkuerzung);

  return {
    beginn: iso(beginn),
    entbindung: iso(geburt),
    ende: iso(ende),
    schutzvorGeburt: SCHUTZFRIST_VOR_TAGE,
    schutzNachGeburt,
    verkuerzung,
    tageGesamt: Math.round((ende - beginn) / TAG_MS),
  };
}
