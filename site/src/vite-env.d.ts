/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OBJECT_ID?: string;
  /** Public CDN origin for listing media (default: dapp-media.evefrontier.com). */
  readonly VITE_MEDIA_CDN_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
