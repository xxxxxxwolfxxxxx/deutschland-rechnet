// Immobilienkauf-Nebenkosten
const GRUNDERWERBSTEUER = {
  bw: 5.0, by: 3.5, be: 6.0, bb: 6.5, hb: 5.0, hh: 5.5,
  he: 6.0, mv: 6.0, ni: 5.0, nw: 6.5, rp: 5.0, sl: 6.5,
  sn: 5.5, st: 5.0, sh: 6.5, th: 6.5,
};

export function berechneImmokaufNebenkosten({ kaufpreis, bundesland, mitMakler = true, maklerProvisionProzent = 3.57 }) {
  const gewSatz = GRUNDERWERBSTEUER[bundesland] ?? 5.0;
  const grunderwerbsteuer = Math.round(kaufpreis * gewSatz / 100 * 100) / 100;
  const notar = Math.round(kaufpreis * 0.015 * 100) / 100; // ca. 1,5 % (Notar + Grundbuch)
  const makler = mitMakler ? Math.round(kaufpreis * maklerProvisionProzent / 100 * 119 / 100 * 100) / 100 : 0;
  // Makler: Provision inkl. 19% USt, Käufer zahlt halbe Provision (§ 656c BGB)
  const maklerKaeufer = mitMakler ? Math.round(kaufpreis * (maklerProvisionProzent / 100) * 1.19 / 2 * 100) / 100 : 0;
  const gesamt = Math.round((grunderwerbsteuer + notar + maklerKaeufer) * 100) / 100;
  const gesamtProzent = Math.round(gesamt / kaufpreis * 1000) / 10;
  return { grunderwerbsteuer, notar, maklerKaeufer, gesamt, gesamtProzent, gewSatz };
}
