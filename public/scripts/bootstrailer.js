// Führerscheinklasse für Bootstrailer-Gespanne (§ 6 FeV)
//
// Maßgeblich ist immer die zulässige Gesamtmasse (zGM) aus den Fahrzeugpapieren,
// nicht das tatsächlich gewogene Gewicht. Wer ein 900-kg-Boot auf einem Trailer
// mit 1.300 kg zGM fährt, wird nach 1.300 kg beurteilt.
//
// Rechtslage seit 19.01.2013:
//   B    – Anhänger bis 750 kg zGM immer; darüber nur, wenn die Kombination
//          (Zugfahrzeug zGM + Anhänger zGM) 3.500 kg nicht überschreitet.
//   B96  – Schlüsselzahl 96: Kombination über 3.500 kg bis 4.250 kg.
//          Keine Prüfung, nur eine Fahrerschulung (7 Zeitstunden).
//   BE   – Anhänger bis 3.500 kg zGM, Zugfahrzeug bis 3.500 kg zGM.
//
// Das Zugfahrzeug selbst muss in jedem Fall unter Klasse B fallen (≤ 3.500 kg),
// sonst ist man bei C1/C1E — das deckt dieser Rechner bewusst nicht ab.

/** Zugfahrzeug-Obergrenze der Klasse B in kg. */
const ZUGFAHRZEUG_MAX_KG = 3500;
/** Anhänger bis hierhin sind mit B immer erlaubt. */
const ANHAENGER_FREI_KG = 750;
/** Obergrenze der Kombination für die reine Klasse B. */
const KOMBINATION_B_KG = 3500;
/** Obergrenze der Kombination mit Schlüsselzahl 96. */
const KOMBINATION_B96_KG = 4250;
/** Anhänger-Obergrenze der Klasse BE. */
const ANHAENGER_BE_KG = 3500;

/**
 * Ermittelt die nötige Führerscheinklasse für ein Trailergespann.
 *
 * @param {object} eingabe
 * @param {number} eingabe.zugfahrzeugKg  zulässige Gesamtmasse des Zugfahrzeugs
 * @param {number} eingabe.anhaengerKg    zulässige Gesamtmasse des Trailers (inkl. Boot)
 * @returns {{
 *   kombinationKg: number,
 *   klasse: 'B' | 'B96' | 'BE' | 'C1E',
 *   erlaubtMitB: boolean,
 *   zugfahrzeugZuSchwer: boolean,
 *   anhaengerZuSchwer: boolean,
 *   spielraumKg: number,
 *   hinweis: string
 * }}
 */
export function berechneBootstrailer({ zugfahrzeugKg, anhaengerKg }) {
  const zug = Number(zugfahrzeugKg) || 0;
  const haenger = Number(anhaengerKg) || 0;
  const kombinationKg = zug + haenger;

  const zugfahrzeugZuSchwer = zug > ZUGFAHRZEUG_MAX_KG;
  const anhaengerZuSchwer = haenger > ANHAENGER_BE_KG;

  // Ein Zugfahrzeug über 3,5 t verlässt den Bereich der Klasse B vollständig.
  if (zugfahrzeugZuSchwer || anhaengerZuSchwer) {
    return {
      kombinationKg,
      klasse: 'C1E',
      erlaubtMitB: false,
      zugfahrzeugZuSchwer,
      anhaengerZuSchwer,
      spielraumKg: 0,
      hinweis: zugfahrzeugZuSchwer
        ? 'Das Zugfahrzeug überschreitet 3.500 kg zGM und fällt nicht mehr unter Klasse B. Hier greift C1/C1E.'
        : 'Der Anhänger überschreitet 3.500 kg zGM. Auch BE reicht dafür nicht aus.',
    };
  }

  // Anhänger bis 750 kg sind mit B ohne Rücksicht auf die Kombination erlaubt.
  if (haenger <= ANHAENGER_FREI_KG) {
    return {
      kombinationKg,
      klasse: 'B',
      erlaubtMitB: true,
      zugfahrzeugZuSchwer: false,
      anhaengerZuSchwer: false,
      spielraumKg: ANHAENGER_FREI_KG - haenger,
      hinweis: 'Anhänger bis 750 kg zGM sind mit Klasse B immer erlaubt — unabhängig vom Zugfahrzeug.',
    };
  }

  if (kombinationKg <= KOMBINATION_B_KG) {
    return {
      kombinationKg,
      klasse: 'B',
      erlaubtMitB: true,
      zugfahrzeugZuSchwer: false,
      anhaengerZuSchwer: false,
      spielraumKg: KOMBINATION_B_KG - kombinationKg,
      hinweis: 'Die Kombination bleibt unter 3.500 kg zGM — Klasse B genügt.',
    };
  }

  if (kombinationKg <= KOMBINATION_B96_KG) {
    return {
      kombinationKg,
      klasse: 'B96',
      erlaubtMitB: false,
      zugfahrzeugZuSchwer: false,
      anhaengerZuSchwer: false,
      spielraumKg: KOMBINATION_B96_KG - kombinationKg,
      hinweis: 'Für 3.500–4.250 kg Kombination reicht die Schlüsselzahl 96: eine siebenstündige Schulung ohne Prüfung.',
    };
  }

  return {
    kombinationKg,
    klasse: 'BE',
    erlaubtMitB: false,
    zugfahrzeugZuSchwer: false,
    anhaengerZuSchwer: false,
    spielraumKg: ZUGFAHRZEUG_MAX_KG + ANHAENGER_BE_KG - kombinationKg,
    hinweis: 'Über 4.250 kg Kombination ist die Klasse BE mit praktischer Prüfung erforderlich.',
  };
}
