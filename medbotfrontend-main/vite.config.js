import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/chatbot': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/conversation': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});