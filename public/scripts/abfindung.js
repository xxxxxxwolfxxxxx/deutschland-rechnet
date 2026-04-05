// Abfindung nach § 1a KSchG: 0,5 Monatsgehälter je Beschäftigungsjahr
// Angefangene Jahre werden aufgerundet (BAG-Rechtsprechung)
export function berechneAbfindung({ bruttoMonat, dienstjahre }) {
  const abfindung = Math.round(bruttoMonat * dienstjahre * 0.5 * 100) / 100;
  const steuerfrei = 0; // Abfindungen sind grundsätzlich steuerpflichtig
  return { abfindung, monatsgehaelter: dienstjahre * 0.5 };
}
