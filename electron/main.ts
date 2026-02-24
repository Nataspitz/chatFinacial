import { app, BrowserWindow, ipcMain } from 'electron'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  FinanceDeleteRequest,
  FinanceDeleteResponse,
  FinanceExportReportPdfRequest,
  FinanceExportReportPdfResponse,
  FinanceGetAllResponse,
  FinanceSaveRequest,
  FinanceSaveResponse,
  FinanceUpdateRequest,
  FinanceUpdateResponse
} from './types/finance-ipc.types'
import {
  deleteTransactionFromDb,
  getAllTransactionsFromDb,
  getFinanceDbPath,
  getFinanceReportsDirectoryPath,
  saveTransactionToDb,
  updateTransactionInDb
} from './services/finance-json.service'
import type { Transaction } from './types/transaction.types'

const createMainWindow = (): void => {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, '../dist/index.html'))
    return
  }

  window.loadURL('http://localhost:5173')
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)

const formatDate = (value: string): string => {
  const normalized = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (!normalized) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
  }

  const [year, month, day] = normalized.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day))
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const renderRows = (transactions: Transaction[]): string => {
  if (transactions.length === 0) {
    return '<tr><td colspan="4">Nenhuma transacao neste periodo.</td></tr>'
  }

  return transactions
    .map(
      (transaction) => `
      <tr>
        <td>${escapeHtml(formatDate(transaction.date))}</td>
        <td>${escapeHtml(transaction.category)}</td>
        <td>${escapeHtml(transaction.description)}</td>
        <td>${escapeHtml(formatCurrency(transaction.amount))}</td>
      </tr>
    `
    )
    .join('')
}

const buildReportHtml = (payload: FinanceExportReportPdfRequest): string => {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Relatorio Financeiro</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      h1 { margin: 0 0 8px 0; font-size: 20px; }
      p { margin: 0 0 12px 0; font-size: 12px; color: #4b5563; }
      .summary { display: flex; gap: 16px; margin: 16px 0; font-size: 12px; font-weight: 600; }
      .section { margin-top: 16px; }
      .section h2 { margin: 0 0 8px 0; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #d1d5db; text-align: left; padding: 6px; }
      tfoot td { font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>Relatorio Financeiro</h1>
    <p>Periodo selecionado: ${escapeHtml(payload.periodLabel)}</p>

    <div class="summary">
      <span>Total entradas: ${escapeHtml(formatCurrency(payload.totalEntries))}</span>
      <span>Total saidas: ${escapeHtml(formatCurrency(payload.totalOutcomes))}</span>
      <span>Resultado: ${escapeHtml(formatCurrency(payload.resultBalance))}</span>
    </div>

    <section class="section">
      <h2>Entradas</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Categoria</th>
            <th>Descricao</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>${renderRows(payload.entries)}</tbody>
      </table>
    </section>

    <section class="section">
      <h2>Saidas</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Categoria</th>
            <th>Descricao</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>${renderRows(payload.outcomes)}</tbody>
      </table>
    </section>
  </body>
</html>`
}

const buildReportPdfFileName = (): string => {
  const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
  return `relatorio-financeiro-${timestamp}.pdf`
}

ipcMain.handle('finance:save', async (_event, payload: FinanceSaveRequest): Promise<FinanceSaveResponse> => {
  try {
    const financeDbPath = getFinanceDbPath(app.getPath('desktop'))
    await saveTransactionToDb(financeDbPath, payload.transaction)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao salvar transacao.'
    return {
      ok: false,
      error: {
        code: 'FINANCE_SAVE_ERROR',
        message
      }
    }
  }
})

ipcMain.handle('finance:getAll', async (): Promise<FinanceGetAllResponse> => {
  try {
    const financeDbPath = getFinanceDbPath(app.getPath('desktop'))
    const transactions = await getAllTransactionsFromDb(financeDbPath)
    return {
      ok: true,
      data: transactions
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao buscar transacoes.'
    return {
      ok: false,
      error: {
        code: 'FINANCE_GET_ALL_ERROR',
        message
      }
    }
  }
})

ipcMain.handle('finance:delete', async (_event, payload: FinanceDeleteRequest): Promise<FinanceDeleteResponse> => {
  try {
    const financeDbPath = getFinanceDbPath(app.getPath('desktop'))
    await deleteTransactionFromDb(financeDbPath, payload.id)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao apagar transacao.'
    return {
      ok: false,
      error: {
        code: 'FINANCE_DELETE_ERROR',
        message
      }
    }
  }
})

ipcMain.handle('finance:update', async (_event, payload: FinanceUpdateRequest): Promise<FinanceUpdateResponse> => {
  try {
    const financeDbPath = getFinanceDbPath(app.getPath('desktop'))
    await updateTransactionInDb(financeDbPath, payload.transaction)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao editar transacao.'
    return {
      ok: false,
      error: {
        code: 'FINANCE_UPDATE_ERROR',
        message
      }
    }
  }
})

ipcMain.handle(
  'finance:exportReportPdf',
  async (_event, payload: FinanceExportReportPdfRequest): Promise<FinanceExportReportPdfResponse> => {
    let pdfWindow: BrowserWindow | null = null

    try {
      const reportsDir = getFinanceReportsDirectoryPath(app.getPath('desktop'))
      const filePath = path.join(reportsDir, buildReportPdfFileName())
      await mkdir(reportsDir, { recursive: true })

      pdfWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          sandbox: true
        }
      })

      const html = buildReportHtml(payload)
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

      const pdfBuffer = await pdfWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4'
      })

      await writeFile(filePath, pdfBuffer)

      return {
        ok: true,
        canceled: false,
        filePath
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao exportar relatorio em PDF.'
      return {
        ok: false,
        error: {
          code: 'FINANCE_EXPORT_REPORT_PDF_ERROR',
          message
        }
      }
    } finally {
      if (pdfWindow && !pdfWindow.isDestroyed()) {
        pdfWindow.destroy()
      }
    }
  }
)

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
