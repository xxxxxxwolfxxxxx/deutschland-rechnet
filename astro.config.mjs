import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { buildLastModifiedMap, lookupLastModified } from './src/utils/lastModified.mjs';

const lastModified = buildLastModifiedMap();

export default defineConfig({
  site: 'https://deutschland-rechnet.de',
  base: '/',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // Der Filter schloss zwei Meta-Refresh-Stub-Seiten aus. Die sind entfallen
      // und laufen jetzt als 301 über netlify.toml – es gibt nichts mehr zu filtern.
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
