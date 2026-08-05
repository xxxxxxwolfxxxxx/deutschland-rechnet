import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { buildLastModifiedMap, lookupLastModified } from './src/utils/lastModified.mjs';

const redirectPages = [
  'https://deutschland-rechnet.de/auto/leasingrechner/',
  'https://deutschland-rechnet.de/familie/unterhalt-rechner/',
];

const lastModified = buildLastModifiedMap();

export default defineConfig({
  site: 'https://deutschland-rechnet.de',
  base: '/',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !redirectPages.includes(page),
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
