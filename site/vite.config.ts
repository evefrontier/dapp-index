import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite 8 + ES2024 output baseline (2026-era evergreen browsers).
 * Type-checking is `tsc -b` (see tsconfig.*.json); bundling uses esbuild.
 */
export default defineConfig({
  plugins: [react()],
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
