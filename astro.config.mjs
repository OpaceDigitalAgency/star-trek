import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  integrations: [
    tailwind(),
    react()
  ],
  site: 'https://star-trek-timelines.netlify.app',
  // Prerender first 48 character pages, rest handled at runtime
  prefetch: true,
  srcDir: './src',
  vite: {
    resolve: {
      alias: {
        '@data': '/src/data'
      }
    },
    // Removed potentially problematic build options
  },
});