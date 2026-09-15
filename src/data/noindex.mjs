// Seiten, die Suchmaschinen nicht indexieren sollen.
//
// Die Liste wird an zwei Stellen gelesen: Layout.astro setzt für diese Pfade
// <meta name="robots" content="noindex, follow">, und die Sitemap in
// astro.config.mjs lässt sie weg. Eine Seite in der Sitemap, die zugleich
// noindex trägt, wäre ein widersprüchliches Signal.
//
// Aufgenommen wird eine Seite, die für Nutzer brauchbar ist, aber zu wenig
// eigene Substanz hat, um in der Suche zu stehen.

export const NOINDEX_PFADE = [
  // Städtetabelle mit erfundenen Preisen entfernt (14.09.2026); was bleibt,
  // ist eine Division mit WoFlV-Flächenrechnung.
  '/wohnen/quadratmeterpreis-vergleich/',
  // Kategorieseiten mit zwei Werkzeugen bzw. reinen Umrechnern ohne eigenen
  // Text (14.09.2026): Die Unterseiten bleiben indexierbar.
  '/vorlagen/',
  '/einheiten/',
];

export function istNoindex(pfad) {
  return NOINDEX_PFADE.includes(pfad);
}
