import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://chiwawafromkk.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react()],
  // Cache and measure the shared animation engine independently of React islands.
  // Only vendor GSAP + registration are excluded from the React/component budget.
  // Co-locating React's runtime modules avoids paying gzip overhead for tiny chunks.
  vite: {
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'gsap', priority: 20, test: /(?:node_modules[\\/]gsap[\\/]|src[\\/]scripts[\\/]motion[\\/]gsap\.ts$)/ },
              { name: 'react', priority: 20, test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/ },
              { name: 'text-motion', priority: 10, test: /src[\\/](?:components[\\/]rb[\\/](?:SplitText|ScrollReveal)\.tsx|scripts[\\/]motion[\\/](?:tokens|reveal)\.ts)$/ },
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
