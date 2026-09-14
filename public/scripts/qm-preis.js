// Quadratmeterpreis aus Kaufpreis und Wohnfläche nach der Wohnflächenverordnung
//
// Quelle: §§ 2 und 4 WoFlV, https://www.gesetze-im-internet.de/woflv/
// (abgerufen am 14.09.2026)
//
// Früher stand hier eine Tabelle mit Quadratmeterpreisen für zwölf Städte,
// die Gutachterausschüssen und Destatis zugeschrieben war, aber aus keiner
// dieser Quellen stammte. Sie ist entfernt. Das Modul rechnet jetzt nur mit
// dem, was der Nutzer aus dem Exposé kennt – und zeigt, wie sehr der Preis je
// Quadratmeter davon abhängt, welche Fläche man zugrunde legt.
//
// § 4 WoFlV: Grundflächen von Räumen mit mindestens zwei Metern lichter Höhe
// zählen vollständig, mit einem bis unter zwei Metern zur Hälfte, unter einem
// Meter gar nicht. Unbeheizte Wintergärten zählen zur Hälfte. Balkone, Loggien,
// Dachgärten und Terrassen "in der Regel zu einem Viertel, höchstens jedoch
// zur Hälfte". Keller, Garagen und andere Zubehörräume gehören nach § 2 Abs. 3
// nicht zur Wohnfläche.

/** § 4 WoFlV – Anrechnungsfaktoren je Flächenart */
export const ANRECHNUNG = Object.freeze({
  voll: 1, // lichte Höhe mindestens 2 m
  halb: 0.5, // lichte Höhe 1 m bis unter 2 m
  keine: 0, // lichte Höhe unter 1 m
  wintergarten: 0.5, // unbeheizt
  balkonRegel: 0.25, // Balkon, Loggia, Dachgarten, Terrasse – in der Regel
  balkonHoechst: 0.5, // … höchstens
});

const zahl = (wert) => (Number.isFinite(Number(wert)) ? Math.max(0, Number(wert)) : 0);
const runde = (n, stellen = 2) => {
  const f = 10 ** stellen;
  return Math.round(n * f) / f;
};

/**
 * Wohnfläche nach § 4 WoFlV aus Grundflächen.
 *
 * @param {object} p Grundflächen in m²
 * @param {number} [p.vollHoch] Räume ab 2 m lichter Höhe
 * @param {number} [p.halbHoch] Flächen mit 1 m bis unter 2 m lichter Höhe
 * @param {number} [p.niedrig] Flächen unter 1 m lichter Höhe
 * @param {number} [p.wintergarten] unbeheizte Wintergärten
 * @param {number} [p.balkon] Balkone, Loggien, Dachgärten, Terrassen
 * @param {boolean} [p.balkonZurHaelfte] Balkon mit dem Höchstsatz statt der Regel anrechnen
 */
export function wohnflaecheNachWoFlV({
  vollHoch = 0,
  halbHoch = 0,
  niedrig = 0,
  wintergarten = 0,
  balkon = 0,
  balkonZurHaelfte = false,
}) {
  const balkonFaktor = balkonZurHaelfte ? ANRECHNUNG.balkonHoechst : ANRECHNUNG.balkonRegel;
  const anteile = {
    vollHoch: zahl(vollHoch) * ANRECHNUNG.voll,
    halbHoch: zahl(halbHoch) * ANRECHNUNG.halb,
    niedrig: zahl(niedrig) * ANRECHNUNG.keine,
    wintergarten: zahl(wintergarten) * ANRECHNUNG.wintergarten,
    balkon: zahl(balkon) * balkonFaktor,
  };
  const grundflaeche = zahl(vollHoch) + zahl(halbHoch) + zahl(niedrig) + zahl(wintergarten) + zahl(balkon);
  const wohnflaeche = Object.values(anteile).reduce((a, b) => a + b, 0);
  return {
    grundflaeche: runde(grundflaeche),
    wohnflaeche: runde(wohnflaeche),
    nichtAngerechnet: runde(grundflaeche - wohnflaeche),
    balkonFaktor,
  };
}

/**
 * Preis je Quadratmeter.
 *
 * @param {object} p
 * @param {number} p.kaufpreis in Euro
 * @param {number} p.flaeche in m²
 * @returns {number|null} Euro je m², auf Cent gerundet; null ohne Fläche
 */
export function quadratmeterpreis({ kaufpreis, flaeche }) {
  const f = zahl(flaeche);
  if (f <= 0) return null;
  return runde(zahl(kaufpreis) / f);
}

/**
 * Vergleich: Preis je m² nach der beworbenen Fläche und nach WoFlV.
 *
 * @param {object} p
 * @param {number} p.kaufpreis
 * @param {number} p.beworbeneFlaeche Fläche laut Exposé
 * @param {object} p.flaechen Grundflächen wie bei wohnflaecheNachWoFlV
 */
export function berechneQmPreis({ kaufpreis, beworbeneFlaeche, flaechen }) {
  const woflv = wohnflaecheNachWoFlV(flaechen || {});
  const preisBeworben = quadratmeterpreis({ kaufpreis, flaeche: beworbeneFlaeche });
  const preisWoFlV = quadratmeterpreis({ kaufpreis, flaeche: woflv.wohnflaeche });
  const aufschlagProzent =
    preisBeworben && preisWoFlV ? runde((preisWoFlV / preisBeworben - 1) * 100, 1) : null;
  return { ...woflv, preisBeworben, preisWoFlV, aufschlagProzent };
}
