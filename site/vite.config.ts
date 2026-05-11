import path from 'node:path';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite 8 + ES2024 output baseline (2026-era evergreen browsers).
 * Type-checking is `tsc -b` (see tsconfig.*.json); bundling uses esbuild.
 */
export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    target: 'es2024',
    sourcemap: true,
    reportCompressedSize: true,
  },
});
