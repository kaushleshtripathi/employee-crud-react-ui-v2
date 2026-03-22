/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the employee API (e.g. http://localhost:8080/api/v1) */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
