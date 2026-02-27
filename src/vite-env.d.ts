/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    api?: {
      exportReportPdf: (
        payload: import('./types/report-export.types').ExportReportPdfPayload
      ) => Promise<import('./types/report-export.types').ExportReportPdfResult>
    }
  }
}

export {}
