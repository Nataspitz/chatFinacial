import type { Transaction } from './transaction.types'

export interface FinanceErrorResponse {
  ok: false
  error: {
    code: string
    message: string
  }
}

export interface FinanceExportReportPdfRequest {
  fileName: string
  companyName: string
  createdAt: string
  periodLabel: string
  entries: Transaction[]
  outcomes: Transaction[]
  totalEntries: number
  totalOutcomes: number
  resultBalance: number
  dashboardMetrics: Array<{
    label: string
    value: string
  }>
}

export interface FinanceExportReportPdfSuccessResponse {
  ok: true
  canceled: boolean
  filePath?: string
}

export type FinanceExportReportPdfResponse = FinanceExportReportPdfSuccessResponse | FinanceErrorResponse
