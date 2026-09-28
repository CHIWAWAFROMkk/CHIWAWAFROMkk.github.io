import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chiwawafromkk.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
