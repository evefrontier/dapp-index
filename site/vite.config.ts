import path from 'node:path';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import {
  WALRUS_AGGREGATOR_MAINNET_URL,
  WALRUS_AGGREGATOR_PROXY_MAINNET,
  WALRUS_AGGREGATOR_PROXY_TESTNET,
  WALRUS_AGGREGATOR_TESTNET_URL,
} from './src/constants';

/** Dev + `vite preview`: same-origin Walrus metadata (aggregator CORS blocks localhost). */
function stripProxyPrefix(prefix: string, pathname: string): string {
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
}

const walrusAggregatorDevProxy = {
  [WALRUS_AGGREGATOR_PROXY_TESTNET]: {
    target: WALRUS_AGGREGATOR_TESTNET_URL,
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => stripProxyPrefix(WALRUS_AGGREGATOR_PROXY_TESTNET, p),
  },
  [WALRUS_AGGREGATOR_PROXY_MAINNET]: {
    target: WALRUS_AGGREGATOR_MAINNET_URL,
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => stripProxyPrefix(WALRUS_AGGREGATOR_PROXY_MAINNET, p),
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
