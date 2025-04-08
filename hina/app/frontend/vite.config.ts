import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: ['all'],
    proxy: {
      // // Proxy for local development
      // '/api': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // }
      // Proxy for cloud run development
      '/api': 'http://localhost:8000'
    },
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', 'dist/**'],
    },
  }
});
