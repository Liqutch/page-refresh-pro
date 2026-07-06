import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  server: {
    // CRXJS dev modu popup/service worker URL'lerini bu porta göre üretir.
    port: 5173,
    strictPort: true,
    host: 'localhost',
  },
});
