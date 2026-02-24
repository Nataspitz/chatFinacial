import type { Transaction } from './transaction.types'

export interface FinanceSaveRequest {
  transaction: Transaction
}

export interface FinanceSaveSuccessResponse {
  ok: true
}

export interface FinanceErrorResponse {
  ok: false
  error: {
    code: string
    message: string
  }
}

export type FinanceSaveResponse = FinanceSaveSuccessResponse | FinanceErrorResponse

export interface FinanceGetAllSuccessResponse {
  ok: true
  data: Transaction[]
}

export type FinanceGetAllResponse = FinanceGetAllSuccessResponse | FinanceErrorResponse

export interface FinanceDeleteRequest {
  id: string
}

export interface FinanceDeleteSuccessResponse {
  ok: true
}

export type FinanceDeleteResponse = FinanceDeleteSuccessResponse | FinanceErrorResponse

export interface FinanceUpdateRequest {
  transaction: Transaction
}

export interface FinanceUpdateSuccessResponse {
  ok: true
}

export type FinanceUpdateResponse = FinanceUpdateSuccessResponse | FinanceErrorResponse

export interface FinanceExportReportPdfRequest {
  periodLabel: string
  entries: Transaction[]
  outcomes: Transaction[]
  totalEntries: number
  totalOutcomes: number
  resultBalance: number
}

export interface FinanceExportReportPdfSuccessResponse {
  ok: true
  canceled: boolean
  filePath?: string
}

export type FinanceExportReportPdfResponse = FinanceExportReportPdfSuccessResponse | FinanceErrorResponse
