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
  /** "true" merges local fixture listings into the catalog (dev only). */
  readonly VITE_ENABLE_FIXTURE_DATA?: string;
  /** "true" re-enables the Walrus read/publish path (off while S3 is active). */
  readonly VITE_ENABLE_WALRUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
