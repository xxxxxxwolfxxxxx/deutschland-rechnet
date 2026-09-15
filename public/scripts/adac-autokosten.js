// Fahrzeugdaten aus der ADAC Autokostenübersicht Frühjahr/Sommer 2026
// (Stand 04/2026): zwei Varianten desselben Modells, damit sich Benziner und
// Elektroauto ohne Ausstattungsunterschied vergleichen lassen.
// https://assets.adac.de/Autodatenbank/Autokosten/autokostenuebersicht.pdf
//
// Die ADAC-Werte sind Monatsbeträge bei 15.000 km im Jahr und fünf Jahren
// Haltedauer. Sie stehen hier an einem Ort, weil der Artikel
// „Elektroauto gegen Verbrenner“ und der TCO-Rechner sie beide verwenden.

export const ADAC_STAND = 'Frühjahr/Sommer 2026';
export const ADAC_QUELLE_URL = 'https://assets.adac.de/Autodatenbank/Autokosten/autokostenuebersicht.pdf';
export const ADAC_HALTEDAUER_MONATE = 60;
export const ADAC_KM_PRO_JAHR = 15_000;
export const BENZINPREIS = 1.92;
export const ADAC_STROMPREIS = 0.44;
export const ADAC_PFLEGEPAUSCHALE_PRO_JAHR = 250;

export const corsaBenzin = Object.freeze({
  name: 'Opel Corsa 1.2 DI Turbo Edition',
  kurz: 'Corsa Benziner',
  grundpreis: 22_890,
  fix: 147, werkstatt: 76, betrieb: 144, wertverlust: 264, gesamt: 632,
  hubraum: 1199, co2: 124,
});

export const corsaElektro = Object.freeze({
  name: 'Opel Corsa Electric (50 kWh)',
  kurz: 'Corsa Electric',
  grundpreis: 29_990,
  fix: 127, werkstatt: 64, betrieb: 107, wertverlust: 384, gesamt: 682,
  gesamtgewicht: 1905,
});

/**
 * Verbrauch je 100 km, aus den ADAC-Betriebskosten zurückgerechnet. Die
 * Pflegepauschale hängt nicht am Antrieb und wird vorher abgezogen.
 * @param {{betrieb: number}} fahrzeug
 * @param {number} preisJeEinheit Euro je Liter oder je kWh, wie vom ADAC angesetzt
 */
export function adacVerbrauchJe100km(fahrzeug, preisJeEinheit) {
  const pflegeProMonat = ADAC_PFLEGEPAUSCHALE_PRO_JAHR / 12;
  const kmProMonat = ADAC_KM_PRO_JAHR / 12;
  return ((fahrzeug.betrieb - pflegeProMonat) / preisJeEinheit / kmProMonat) * 100;
}
