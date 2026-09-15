// Jahresenergieverbrauch und -kosten aus den eigenen Abrechnungen
//
// Die frühere Seite schätzte Strom, Heizung und Wasser aus Personenzahl,
// Baujahr und festen Preisen (750 kWh je Person, 0,42 €/kWh, 0,12 €/kWh) und
// stellte einen erfundenen „Durchschnitt“ daneben. Der Verbrauch steht aber
// auf der Jahresabrechnung. Dieses Modul rechnet mit diesen Mengen und
// Preisen und ordnet den Heizenergieverbrauch so ein, wie es der
// Energieverbrauchsausweis tut:
//
//   § 82 Abs. 2 GModG  – Endenergieverbrauch für Heizung und Warmwasser je m²
//                      Gebäudenutzfläche; ist sie unbekannt, 1,35 × Wohnfläche
//                      (bis zwei Wohneinheiten mit beheiztem Keller) oder
//                      1,2 × Wohnfläche; bei dezentraler Warmwasserbereitung
//                      mit unbekanntem Verbrauch + 20 kWh/m²
//   Anlage 10 GModG    – Energieeffizienzklassen A+ bis H
//
// Nicht nachgebildet ist die Witterungsbereinigung nach § 82 Abs. 3 GModG. Die
// Klasse ist deshalb eine Einordnung des einzelnen Jahres, kein Ausweiswert.
// Das Gesetz heißt seit dem Änderungsgesetz vom 23.07.2026
// Gebäudemodernisierungsgesetz; Paragrafen und Anlagen sind unverändert
// (siehe energieausweis.js). Abgerufen am 15.09.2026.

import { kwhJeLiterHeizoel } from './heizkosten.js';

export const EFFIZIENZKLASSEN = Object.freeze([
  { klasse: 'A+', bis: 30 },
  { klasse: 'A', bis: 50 },
  { klasse: 'B', bis: 75 },
  { klasse: 'C', bis: 100 },
  { klasse: 'D', bis: 130 },
  { klasse: 'E', bis: 160 },
  { klasse: 'F', bis: 200 },
  { klasse: 'G', bis: 250 },
  { klasse: 'H', bis: Infinity },
]);

export const NUTZFLAECHE_FAKTOR = Object.freeze({ mitBeheiztemKeller: 1.35, sonstige: 1.2 });
export const ZUSCHLAG_DEZENTRALES_WARMWASSER = 20;

// Einheit, in der die Abrechnung die Menge ausweist, und der Faktor auf kWh.
export const HEIZENERGIETRAEGER = Object.freeze({
  gas: { label: 'Erdgas', einheit: 'kWh', kwhJeEinheit: () => 1 },
  heizoel: { label: 'Heizöl', einheit: 'Liter', kwhJeEinheit: kwhJeLiterHeizoel },
  fernwaerme: { label: 'Fernwärme', einheit: 'kWh', kwhJeEinheit: () => 1 },
  waermepumpe: { label: 'Wärmepumpe (Strom)', einheit: 'kWh', kwhJeEinheit: () => 1 },
});

const aufCent = (betrag) => Math.round(betrag * 100) / 100;

function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Effizienzklasse nach Anlage 10 GModG für einen Kennwert in kWh/(m²·a). */
export function effizienzklasse(kwhJeQm) {
  return EFFIZIENZKLASSEN.find((k) => kwhJeQm <= k.bis).klasse;
}

/** Gebäudenutzfläche aus der Wohnfläche nach § 82 Abs. 2 Satz 4 GModG. */
export function nutzflaecheAusWohnflaeche(wohnflaeche, mitBeheiztemKeller = false) {
  const faktor = mitBeheiztemKeller ? NUTZFLAECHE_FAKTOR.mitBeheiztemKeller : NUTZFLAECHE_FAKTOR.sonstige;
  return zahl(wohnflaeche) * faktor;
}

/**
 * @param {object} e
 * @param {{kwh: number, preisCent: number, grundpreisJahr?: number}} e.strom Haushaltsstrom ohne Wärmepumpe
 * @param {{traeger: keyof HEIZENERGIETRAEGER, menge: number, preisCentJeEinheit: number, grundpreisJahr?: number}} e.heizung
 * @param {{m3?: number, preisJeM3?: number, grundpreisJahr?: number}} [e.wasser]
 * @param {number} [e.wohnflaeche]
 * @param {boolean} [e.mitBeheiztemKeller] nur bei höchstens zwei Wohneinheiten
 * @param {boolean} [e.dezentralesWarmwasser] Warmwasser nicht über die Heizung
 */
export function berechneJahresenergie({
  strom, heizung, wasser = {}, wohnflaeche = 0, mitBeheiztemKeller = false, dezentralesWarmwasser = false,
}) {
  const stromKosten = (zahl(strom?.kwh) * zahl(strom?.preisCent)) / 100 + zahl(strom?.grundpreisJahr);

  const traeger = HEIZENERGIETRAEGER[heizung?.traeger] ?? HEIZENERGIETRAEGER.gas;
  const heizKwh = zahl(heizung?.menge) * traeger.kwhJeEinheit();
  const heizKosten = (zahl(heizung?.menge) * zahl(heizung?.preisCentJeEinheit)) / 100 + zahl(heizung?.grundpreisJahr);

  const wasserErfasst = zahl(wasser.m3) > 0 && zahl(wasser.preisJeM3) > 0;
  const wasserKosten = wasserErfasst ? zahl(wasser.m3) * zahl(wasser.preisJeM3) + zahl(wasser.grundpreisJahr) : 0;

  const nutzflaeche = nutzflaecheAusWohnflaeche(wohnflaeche, mitBeheiztemKeller);
  let kennwert = null;
  if (nutzflaeche > 0 && heizKwh > 0) {
    const roh = heizKwh / nutzflaeche + (dezentralesWarmwasser ? ZUSCHLAG_DEZENTRALES_WARMWASSER : 0);
    kennwert = { kwhJeQm: Math.round(roh), klasse: effizienzklasse(Math.round(roh)), nutzflaeche: Math.round(nutzflaeche * 10) / 10 };
  }

  const gesamt = stromKosten + heizKosten + wasserKosten;
  return {
    strom: { kwh: zahl(strom?.kwh), kosten: aufCent(stromKosten) },
    heizung: { kwh: Math.round(heizKwh), kosten: aufCent(heizKosten), einheit: traeger.einheit },
    wasser: wasserErfasst ? { m3: zahl(wasser.m3), kosten: aufCent(wasserKosten) } : null,
    gesamt: aufCent(gesamt),
    monat: aufCent(gesamt / 12),
    kennwert,
  };
}
