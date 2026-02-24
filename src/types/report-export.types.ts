import type { Transaction } from './transaction.types'

export interface ExportReportPdfPayload {
  periodLabel: string
  entries: Transaction[]
  outcomes: Transaction[]
  totalEntries: number
  totalOutcomes: number
  resultBalance: number
}

export interface ExportReportPdfResult {
  canceled: boolean
  filePath?: string
}
