import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://matthiasduhrkop.github.io',
  base: '/deutschland-rechnet',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
