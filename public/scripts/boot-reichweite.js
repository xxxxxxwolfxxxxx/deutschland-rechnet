// Reichweite, Fahrzeit und Spritkosten eines Bootes
//
// Anders als beim Auto rechnet man auf dem Wasser nicht in l/100 km, sondern in
// Litern pro Stunde. Der Verbrauch hängt an der Drehzahl, nicht an der Strecke:
// Gegenstrom, Wind und Welle kosten Zeit, und Zeit kostet Sprit.
//
// Die Drittelregel ist seemännische Praxis: ein Drittel des Tanks für den Hinweg,
// ein Drittel für zurück, ein Drittel bleibt Reserve. Wer sie ernst nimmt, plant
// mit einer nutzbaren Tankmenge von zwei Dritteln.

/** Faustformel Verbrauch bei Dauermarschfahrt, Liter je PS und Stunde. */
const VERBRAUCH_JE_PS = {
  benzin: 0.35,
  diesel: 0.22,
};

/**
 * Schätzt den Stundenverbrauch aus der Motorleistung.
 *
 * Grobe Faustformel für Marschfahrt (etwa 75 % Last). Ein konkreter Motor kann
 * deutlich abweichen — sie ersetzt keine gemessenen Werte aus dem Bordbuch.
 *
 * @param {number} ps
 * @param {'benzin'|'diesel'} kraftstoff
 * @returns {number} Liter pro Stunde, auf eine Nachkommastelle gerundet
 */
export function schaetzeVerbrauchProStunde(ps, kraftstoff = 'benzin') {
  const faktor = VERBRAUCH_JE_PS[kraftstoff] ?? VERBRAUCH_JE_PS.benzin;
  return Math.round(Number(ps) * faktor * 0.75 * 10) / 10;
}

/**
 * Berechnet Reichweite, Fahrzeit und Kosten einer Bootsfahrt.
 *
 * @param {object} eingabe
 * @param {number} eingabe.tankLiter          Tankinhalt in Litern
 * @param {number} eingabe.verbrauchProStunde Verbrauch in l/h
 * @param {number} eingabe.geschwindigkeitKn  Marschgeschwindigkeit in Knoten
 * @param {number} [eingabe.reserveProzent]   Anteil, der als Reserve im Tank bleibt
 * @param {number} [eingabe.preisProLiter]    Kraftstoffpreis in €/l
 * @returns {{
 *   nutzbarLiter: number,
 *   fahrzeitStunden: number,
 *   reichweiteSm: number,
 *   reichweiteKm: number,
 *   verbrauchProSm: number,
 *   kostenProSm: number,
 *   kostenTankfuellung: number
 * }}
 */
export function berechneBootReichweite({
  tankLiter,
  verbrauchProStunde,
  geschwindigkeitKn,
  reserveProzent = 33,
  preisProLiter = 0,
}) {
  const tank = Math.max(0, Number(tankLiter) || 0);
  const verbrauch = Math.max(0, Number(verbrauchProStunde) || 0);
  const speed = Math.max(0, Number(geschwindigkeitKn) || 0);
  const reserve = Math.min(100, Math.max(0, Number(reserveProzent) || 0));
  const preis = Math.max(0, Number(preisProLiter) || 0);

  const nutzbarLiter = Math.round(tank * (1 - reserve / 100) * 10) / 10;

  // Ohne Verbrauch gäbe es eine Division durch null — dann bleibt alles bei null.
  const fahrzeitStunden = verbrauch > 0 ? nutzbarLiter / verbrauch : 0;
  const reichweiteSm = fahrzeitStunden * speed;
  const verbrauchProSm = speed > 0 ? verbrauch / speed : 0;

  return {
    nutzbarLiter,
    fahrzeitStunden: Math.round(fahrzeitStunden * 10) / 10,
    reichweiteSm: Math.round(reichweiteSm * 10) / 10,
    // 1 Seemeile = 1,852 km
    reichweiteKm: Math.round(reichweiteSm * 1.852 * 10) / 10,
    verbrauchProSm: Math.round(verbrauchProSm * 100) / 100,
    kostenProSm: Math.round(verbrauchProSm * preis * 100) / 100,
    kostenTankfuellung: Math.round(tank * preis * 100) / 100,
  };
}
