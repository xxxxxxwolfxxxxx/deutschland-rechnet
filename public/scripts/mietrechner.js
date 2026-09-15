// Warmmiete aus Inserat oder Mietvertrag – und die Einordnung der Vorauszahlung
//
// Bis September 2026 schätzte dieses Modul Heiz- und Betriebskosten aus
// Baujahr, Heizart und Personenzahl mit Tabellenwerten, die keine Quelle
// hatten; die Seite schrieb sie dem Deutschen Mieterbund zu. Die Warmmiete
// steht aber im Inserat oder im Vertrag: Kaltmiete plus die vereinbarten
// Vorauszahlungen. Das Modul addiert deshalb nur, was der Nutzer einträgt.
//
// Die Einordnung gegen den Betriebskostenspiegel des Deutschen Mieterbundes
// kommt aus ./nebenkosten.js, wo die Werte mit Abrechnungsjahr gepflegt
// werden. Der Spiegel enthält Heizung und Warmwasser – verglichen wird
// deshalb die Summe beider Vorauszahlungen.
//
// Rechtsrahmen: Vorauszahlungen nur in angemessener Höhe (§ 556 Abs. 2 Satz 2
// BGB), jährliche Abrechnung (§ 556 Abs. 3 BGB), Anpassung nach Abrechnung
// (§ 560 Abs. 4 BGB).

import { einordnung, pruefeVorauszahlung } from './nebenkosten.js';

const aufCent = (betrag) => Math.round(betrag * 100) / 100;

function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * @param {object} e
 * @param {number} e.kaltmiete Nettokaltmiete je Monat
 * @param {number} e.flaeche Wohnfläche in m²
 * @param {number} e.betriebskosten Vorauszahlung Betriebskosten ohne Heizung je Monat
 * @param {number} e.heizkosten Vorauszahlung Heizung und Warmwasser je Monat
 * @param {number} [e.sonstiges] z. B. Stellplatz oder Küchenmiete je Monat
 * @param {boolean} [e.aufzug]
 * @param {boolean} [e.garten]
 * @param {boolean} [e.hauswart]
 */
export function berechneMietrechner({
  kaltmiete, flaeche, betriebskosten, heizkosten, sonstiges = 0,
  aufzug = false, garten = false, hauswart = false,
}) {
  const qm = zahl(flaeche);
  const vorauszahlung = zahl(betriebskosten) + zahl(heizkosten);
  const warmmiete = zahl(kaltmiete) + vorauszahlung;
  const gesamt = warmmiete + zahl(sonstiges);

  const ergebnis = {
    warmmiete: aufCent(warmmiete),
    gesamt: aufCent(gesamt),
    vorauszahlung: aufCent(vorauszahlung),
    jahr: aufCent(gesamt * 12),
    kaltProQm: qm > 0 ? aufCent(zahl(kaltmiete) / qm) : 0,
    warmProQm: qm > 0 ? aufCent(warmmiete / qm) : 0,
    vorauszahlungProQm: qm > 0 ? aufCent(vorauszahlung / qm) : 0,
    einordnung: null,
    spiegel: null,
  };
  if (qm === 0) return ergebnis;

  ergebnis.einordnung = einordnung(ergebnis.vorauszahlungProQm);
  const p = pruefeVorauszahlung({ vorauszahlungMonat: aufCent(vorauszahlung), flaeche: qm, aufzug, garten, hauswart });
  ergebnis.spiegel = {
    erwartetMonat: p.erwartetMonat,
    differenzMonat: p.differenzMonat,
    differenzJahr: aufCent(p.differenzMonat * 12),
  };
  return ergebnis;
}
