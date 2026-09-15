// Energiekosten verschiedener Antriebe nebeneinander
//
// Kosten je 100 km = Verbrauch je 100 km × Preis je Liter oder kWh. Mehr steckt
// nicht dahinter – und gerade deshalb darf die Seite keine festen
// Vergleichswerte daneben stellen, die mit anderen Preisen gerechnet sind als
// die Eingaben. Die frühere Fassung verglich mit 32 ct/kWh, während der
// Strompreis-Modul 37 ct nennt.
//
// Ein Antrieb ohne Verbrauch oder ohne Preis wird nicht gewertet, statt mit
// 0 € als der günstigste zu erscheinen.

const aufCent = (betrag) => Math.round(betrag * 100) / 100;

function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function kostenJe100km({ verbrauch, preis }) {
  return aufCent(zahl(verbrauch) * zahl(preis));
}

/**
 * @param {object} e
 * @param {number} e.kmProJahr
 * @param {{name: string, verbrauch: number, preis: number}[]} e.antriebe
 */
export function vergleicheAntriebe({ kmProJahr, antriebe }) {
  const km = zahl(kmProJahr);
  const gewertet = antriebe
    .filter((a) => zahl(a.verbrauch) > 0 && zahl(a.preis) > 0)
    .map((a) => {
      const je100 = zahl(a.verbrauch) * zahl(a.preis);
      return { name: a.name, je100km: aufCent(je100), jahr: aufCent((km / 100) * je100), monat: aufCent((km / 100) * je100 / 12) };
    });
  const guenstigster = gewertet.reduce((best, a) => (best === null || a.jahr < best.jahr ? a : best), null);
  return {
    antriebe: gewertet.map((a) => ({ ...a, mehrkostenJahr: aufCent(a.jahr - guenstigster.jahr) })),
    guenstigster: guenstigster ? guenstigster.name : null,
  };
}
