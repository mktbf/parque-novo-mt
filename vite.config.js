import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'dist',
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: '../build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'dist/index.html'),
        admin: resolve(__dirname, 'dist/admin.html'),
      },
    },
  },
});
