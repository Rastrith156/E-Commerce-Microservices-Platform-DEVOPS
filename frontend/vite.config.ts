import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/catalog': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/cart': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/orders': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
