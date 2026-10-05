import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chiwawafromkk.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Cache and measure the shared animation engine (GSAP + registration) apart from the
  // site's own small motion enhancers, which are measured against their own budget.
  vite: {
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'gsap', priority: 20, test: /(?:node_modules[\\/]gsap[\\/]|src[\\/]scripts[\\/]motion[\\/]gsap\.ts$)/ },
              { name: 'text-motion', priority: 10, test: /src[\\/]scripts[\\/]motion[\\/](?:tokens|reveal|split-title)\.ts$/ },
            ],
          },
        },
      },
    },
  },
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
