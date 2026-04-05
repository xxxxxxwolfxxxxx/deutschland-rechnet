// Blutalkohol nach Widmark-Formel
// r: Verteilungsfaktor (m=0.7, f=0.6)
// Abbau: 0.15 ‰/h (Richtwert)

export function berechnePromille({ getraenke, gewichtKg, geschlecht, stundenNachBeginn }) {
  const r = geschlecht === 'w' ? 0.6 : 0.7;
  // Gesamter reiner Alkohol in Gramm
  const alkoholGramm = getraenke.reduce((sum, g) => {
    return sum + (g.mengeML * g.volProzent / 100 * 0.8);
  }, 0);
  const rohWert = alkoholGramm / (gewichtKg * r);
  const abbau = Math.max(0, stundenNachBeginn * 0.15);
  const bak = Math.max(0, Math.round((rohWert - abbau) * 100) / 100);
  return {
    bak,
    alkoholGramm: Math.round(alkoholGramm * 10) / 10,
    abbau: Math.round(abbau * 100) / 100,
    rohWert: Math.round(rohWert * 100) / 100,
  };
}

export const GETRAENKE_VORLAGEN = [
  { label: 'Bier (0,5 L)',       mengeML: 500, volProzent: 5   },
  { label: 'Wein (0,2 L)',       mengeML: 200, volProzent: 12  },
  { label: 'Sekt (0,1 L)',       mengeML: 100, volProzent: 11  },
  { label: 'Schnaps (4 cl)',     mengeML:  40, volProzent: 40  },
  { label: 'Cocktail (0,2 L)',   mengeML: 200, volProzent: 8   },
];
