// Einkommensteuertarif nach § 32a Abs. 1 EStG
//
// Rechtsstand: Veranlagungszeitraum 2026
// Primärquelle: https://www.gesetze-im-internet.de/estg/__32a.html
//
// Dieses Modul ist die einzige Stelle im Projekt, an der der Tarif steht.
// Alle Rechner, die Lohn- oder Einkommensteuer brauchen, importieren ihn hier.
// Keine zweite Kopie anlegen – sonst laufen die Rechner auseinander.

export const TARIF_STAND = '2026-01-01';

/** Grundfreibetrag in Euro (§ 32a Abs. 1 Satz 2 Nr. 1 EStG). */
export const GRUNDFREIBETRAG = 12348;

/** Obergrenze der ersten Progressionszone (§ 32a Abs. 1 Satz 2 Nr. 2 EStG). */
export const ZONE_2_OBERGRENZE = 17799;

/** Ab dem nächsten Euro greift der Spitzensteuersatz von 42 % (§ 32a Abs. 1 Satz 2 Nr. 3 EStG). */
export const ZONE_3_OBERGRENZE = 69878;

/** Ab dem nächsten Euro greift der Steuersatz von 45 % (§ 32a Abs. 1 Satz 2 Nr. 4 EStG). */
export const ZONE_4_OBERGRENZE = 277825;

/**
 * Tarifliche Einkommensteuer auf ein zu versteuerndes Einkommen.
 *
 * Erwartet das zu versteuernde Einkommen (zvE), nicht den Bruttolohn: Der
 * Grundfreibetrag ist im Tarif bereits enthalten und darf vorher nicht noch
 * einmal abgezogen werden.
 *
 * @param {number} zvE zu versteuerndes Einkommen in Euro
 * @returns {number} Einkommensteuer in vollen Euro (abgerundet)
 */
export function einkommensteuer(zvE) {
  if (!Number.isFinite(zvE) || zvE <= GRUNDFREIBETRAG) return 0;

  // § 32a Abs. 1 Satz 1 EStG: Bemessung nach dem auf volle Euro abgerundeten zvE.
  const x = Math.floor(zvE);
  if (x <= GRUNDFREIBETRAG) return 0;

  let steuer;
  if (x <= ZONE_2_OBERGRENZE) {
    const y = (x - GRUNDFREIBETRAG) / 10000;
    steuer = (914.51 * y + 1400) * y;
  } else if (x <= ZONE_3_OBERGRENZE) {
    const z = (x - ZONE_2_OBERGRENZE) / 10000;
    steuer = (173.10 * z + 2397) * z + 1034.87;
  } else if (x <= ZONE_4_OBERGRENZE) {
    steuer = 0.42 * x - 11135.63;
  } else {
    steuer = 0.45 * x - 19470.38;
  }

  // § 32a Abs. 1 Satz 6 EStG: auf den nächsten vollen Euro-Betrag abrunden.
  return Math.max(0, Math.floor(steuer));
}
