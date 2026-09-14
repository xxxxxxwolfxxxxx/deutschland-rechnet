import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { buildLastModifiedMap, lookupLastModified } from './src/utils/lastModified.mjs';
import { NOINDEX_PFADE } from './src/data/noindex.mjs';

const lastModified = buildLastModifiedMap();

export default defineConfig({
  site: 'https://deutschland-rechnet.de',
  base: '/',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // Seiten mit noindex gehören nicht in die Sitemap (Liste in src/data/noindex.mjs).
      filter: (page) => !NOINDEX_PFADE.some((pfad) => new URL(page).pathname === pfad),
      serialize: (item) => {
        // Echtes Commit-Datum statt Build-Datum: sonst meldet jeder Deploy alle
        // Seiten als geändert und Google ignoriert das Signal. Ist das Datum
        // unbekannt, bleibt lastmod weg – kein Datum schlägt ein falsches.
        const lastmod = lookupLastModified(lastModified, item.url);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});
