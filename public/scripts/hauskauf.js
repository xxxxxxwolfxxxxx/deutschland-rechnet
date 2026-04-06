const GRUNDERWERB_STEUER = {
  BW: 0.05, BY: 0.035, BE: 0.06, BB: 0.065, 
  HB: 0.05, HH: 0.0625, HE: 0.06, MV: 0.05,
  NI: 0.065, NW: 0.065, RP: 0.05, SL: 0.0665,
  SN: 0.05, ST: 0.05, SH: 0.065, TH: 0.05,
};

const NOTAR_KOSTEN = 0.02;
const MAKLER_KOSTEN = 0.0357;

function berechneHauskauf({ kaufpreis, bundesland, eigenkapital, zins, tilgung, laufzeit, makler }) {
  const grunderwerbsteuer = kaufpreis * (GRUNDERWERB_STEUER[bundesland] || 0.065);
  const notarKosten = kaufpreis * NOTAR_KOSTEN;
  const maklerKosten = makler ? kaufpreis * MAKLER_KOSTEN : 0;
  const nebenkosten = grunderwerbsteuer + notarKosten + maklerKosten;
  const gesamtkosten = kaufpreis + nebenkosten;
  const darlehen = Math.max(0, kaufpreis - eigenkapital);
  const monatlicheRate = darlehen * ((zins / 100 / 12) + (tilgung / 100 / 12));
  const zinsaufwand = monatlicheRate * laufzeit * 12 - darlehen;
  const tilgungszeit = Math.log((monatlicheRate * 12 / darlehen) / ((zins / 100 / 12) + (tilgung / 100 / 12))) / Math.log(1 + (zins / 100 / 12));
  
  return {
    kaufpreis: Math.round(kaufpreis * 100) / 100,
    nebenkosten: Math.round(nebenkosten * 100) / 100,
    gesamtkosten: Math.round(gesamtkosten * 100) / 100,
    darlehen: Math.round(darlehen * 100) / 100,
    monatlicheRate: Math.round(monatlicheRate * 100) / 100,
    zinsaufwand: Math.round(zinsaufwand * 100) / 100,
    tilgungszeit: Math.round(tilgungszeit * 10) / 10,
  };
}

export { berechneHauskauf };
