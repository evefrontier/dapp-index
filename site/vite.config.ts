import path from 'node:path';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Dev + `vite preview`: same-origin Walrus metadata (aggregator CORS blocks localhost). */
const walrusAggregatorDevProxy = {
  '/walrus-aggregator-testnet': {
    target: 'https://aggregator.walrus-testnet.walrus.space',
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => p.replace(/^\/walrus-aggregator-testnet/, ''),
  },
  '/walrus-aggregator-mainnet': {
    target: 'https://aggregator.walrus-mainnet.walrus.space',
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => p.replace(/^\/walrus-aggregator-mainnet/, ''),
  },
} as const;

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
    sourcemap: false,
    reportCompressedSize: true,
  },
  server: {
    proxy: { ...walrusAggregatorDevProxy },
  },
  preview: {
    proxy: { ...walrusAggregatorDevProxy },
  },
});
