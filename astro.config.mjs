import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://USERNAME_PLACEHOLDER.github.io',
  base: '/deutschland-rechnet',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
