// Grunderwerbsteuersätze der Bundesländer – Stand 10.08.2026
//
// Die Grunderwerbsteuer ist eine Ländersteuer: jedes Bundesland legt seinen
// Satz per eigenem Gesetz fest, es gibt keine Bundestabelle. Änderungen sind
// selten, aber sie kommen (zuletzt Bremen 07/2025) – wer hier etwas anfasst,
// prüft gegen die jeweilige Landesquelle, nicht gegen einen Vergleichsportal-
// Aggregator; die widersprechen sich regelmäßig.
//
// `gueltigSeit` ist das Datum des Inkrafttretens des aktuellen Satzes. Es wird
// im Ratgeberartikel ausgewiesen, damit Leser die Aktualität einordnen können.
export const BUNDESLAENDER = {
  bw: { name: 'Baden-Württemberg',      satz: 5.0, gueltigSeit: '2011-11-05' },
  by: { name: 'Bayern',                 satz: 3.5, gueltigSeit: '1997-01-01' },
  be: { name: 'Berlin',                 satz: 6.0, gueltigSeit: '2014-01-01' },
  bb: { name: 'Brandenburg',            satz: 6.5, gueltigSeit: '2015-07-01' },
  hb: { name: 'Bremen',                 satz: 5.5, gueltigSeit: '2025-07-01' },
  hh: { name: 'Hamburg',                satz: 5.5, gueltigSeit: '2023-01-01' },
  he: { name: 'Hessen',                 satz: 6.0, gueltigSeit: '2014-08-01' },
  mv: { name: 'Mecklenburg-Vorpommern', satz: 6.0, gueltigSeit: '2019-07-01' },
  ni: { name: 'Niedersachsen',          satz: 5.0, gueltigSeit: '2014-01-01' },
  nw: { name: 'Nordrhein-Westfalen',    satz: 6.5, gueltigSeit: '2015-01-01' },
  rp: { name: 'Rheinland-Pfalz',        satz: 5.0, gueltigSeit: '2012-03-01' },
  sl: { name: 'Saarland',               satz: 6.5, gueltigSeit: '2015-01-01' },
  sn: { name: 'Sachsen',                satz: 5.5, gueltigSeit: '2023-01-01' },
  st: { name: 'Sachsen-Anhalt',         satz: 5.0, gueltigSeit: '2012-03-01' },
  sh: { name: 'Schleswig-Holstein',     satz: 6.5, gueltigSeit: '2014-01-01' },
  th: { name: 'Thüringen',              satz: 5.0, gueltigSeit: '2024-01-01' },
};

// Abgeleitet, nicht zweitgepflegt: ein zweiter handgepflegter Satz-Datensatz
// wäre genau die Stelle, an der die beiden Zahlen wieder auseinanderlaufen.
export const STEUERSAETZE = Object.fromEntries(
  Object.entries(BUNDESLAENDER).map(([kuerzel, land]) => [kuerzel, land.satz])
);

export function berechneGrunderwerbsteuer({ kaufpreis, bundesland }) {
  const satz = STEUERSAETZE[bundesland] ?? 5.0;
  const steuer = Math.round(kaufpreis * satz / 100);
  return { steuer, satz };
}
