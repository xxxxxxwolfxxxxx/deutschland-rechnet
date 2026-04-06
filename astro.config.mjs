import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://deutschland-rechnet.de',
  base: '/',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
