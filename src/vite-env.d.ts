/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare global {
  interface Window {
    api?: {
      saveTransaction: (transaction: import('./types/transaction.types').Transaction) => Promise<void>
      getTransactions: () => Promise<import('./types/transaction.types').Transaction[]>
      deleteTransaction: (id: string) => Promise<void>
      updateTransaction: (transaction: import('./types/transaction.types').Transaction) => Promise<void>
      exportReportPdf: (
        payload: import('./types/report-export.types').ExportReportPdfPayload
      ) => Promise<import('./types/report-export.types').ExportReportPdfResult>
    }
  }
}

export {}
