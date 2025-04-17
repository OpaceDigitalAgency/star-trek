import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify/functions';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [
    tailwind(),
    react(),
    netlify({
      excludedPath: ['/api/*']
    })
  ],
  site: 'https://star-trek-timelines.netlify.app',
  vite: {
    resolve: {
      alias: {
        'astro/runtime/server': 'astro/dist/runtime/server/index.js'
      }
    },
    build: {
      rollupOptions: {
        external: ['astro/runtime/server']
      }
    }
  },
});