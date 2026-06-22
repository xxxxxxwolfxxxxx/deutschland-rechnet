import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const redirectPages = [
  'https://deutschland-rechnet.de/auto/leasingrechner/',
  'https://deutschland-rechnet.de/familie/unterhalt-rechner/',
];

export default defineConfig({
  site: 'https://deutschland-rechnet.de',
  base: '/',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !redirectPages.includes(page),
      serialize: (item) => ({
        ...item,
        lastmod: new Date().toISOString().split('T')[0],
      }),
    }),
  ],
});
