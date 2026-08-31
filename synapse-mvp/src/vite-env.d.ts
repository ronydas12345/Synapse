/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional YouTube Data API v3 key. Restrict it to this origin in Google Cloud. */
  readonly VITE_YOUTUBE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
