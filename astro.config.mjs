import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify/functions';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [
    tailwind(),
    react(),
    netlify()  // Removed excludedPath which might be causing issues
  ],
  site: 'https://star-trek-timelines.netlify.app',
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