/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OBJECT_ID?: string;
  readonly VITE_PACKAGE_ID?: string;
  readonly VITE_REGISTRY_ID?: string;
  readonly VITE_SUI_NETWORK?: string;
  readonly VITE_UPLOAD_API_BASE?: string;
  /** Public CDN origin for listing media (default: dapp-media.evefrontier.com). */
  readonly VITE_MEDIA_CDN_BASE?: string;
  readonly VITE_WALRUS_AGGREGATOR_URL?: string;
  readonly VITE_WALRUS_UPLOAD_RELAY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
