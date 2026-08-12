// Emissionsfaktoren, die keine Rechtsgröße sind, sondern gemessene Statistik.
//
// Für die Brennstoffe der CO2-Bepreisung gibt es gesetzliche Standardwerte –
// die stehen in `heizkosten.js` (EBeV 2030 Anlage 2 Teil 4) und gehören nicht
// hierher. Der Strommix dagegen ändert sich jedes Jahr mit dem Kraftwerkspark
// und wird vom Umweltbundesamt nachträglich ermittelt.
//
// Quelle: Umweltbundesamt, "CO2-Emissionen pro Kilowattstunde Strom 2025 nur
// leicht gesunken", veröffentlicht am 23.03.2026, abgerufen am 12.08.2026.
// https://www.umweltbundesamt.de/themen/co2-emissionen-pro-kilowattstunde-strom-2025-nur

export const STROMMIX_QUELLE =
  'Umweltbundesamt, CO2-Emissionen pro Kilowattstunde Strom, ' +
  'veröffentlicht am 23.03.2026, abgerufen am 12.08.2026';

// Das UBA veröffentlicht den Wert für ein Jahr erst im März des übernächsten
// Frühjahrs. Zum nächsten Update ist hier das Jahr mitzuziehen.
export const STROMMIX_JAHR = 2025;

// Gramm CO2 je Kilowattstunde des in Deutschland VERBRAUCHTEN Stroms,
// einschließlich Netzverlusten und Importsaldo.
export const STROMMIX_HISTORIE = {
  2023: 379,
  2024: 353,
  2025: 344,
};

export const STROMMIX_GRAMM_JE_KWH = STROMMIX_HISTORIE[STROMMIX_JAHR];

/**
 * Strommix-Emissionsfaktor in kg CO2 je Kilowattstunde – die Einheit, in der
 * die Rechenmodule arbeiten. Kein fester Naturwert: er sinkt mit dem Ausbau
 * der Erneuerbaren, seit 2023 um rund 9 Gramm pro Jahr.
 */
export const STROMMIX_KG_JE_KWH = STROMMIX_GRAMM_JE_KWH / 1000;
