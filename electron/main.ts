import { app, BrowserWindow, dialog, ipcMain, type SaveDialogOptions } from 'electron'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  FinanceExportReportPdfRequest,
  FinanceExportReportPdfResponse
} from './types/finance-ipc.types'
import type { Transaction } from './types/transaction.types'

let mainWindow: BrowserWindow | null = null

const resolveWindowIconPath = (): string => {
  const iconFile = process.platform === 'win32' ? 'app.ico' : 'app.png'

  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icons', iconFile)
  }

  return path.join(__dirname, '../build/icons', iconFile)
}

const createMainWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    hasShadow: true,
    roundedCorners: true,
    thickFrame: false,
    backgroundColor: '#0b1220',
    icon: resolveWindowIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-state', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-state', false)
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    return
  }

  mainWindow.loadURL('http://localhost:5173')
}

ipcMain.handle('window:minimize', () => {
  const targetWindow = BrowserWindow.getFocusedWindow() ?? mainWindow
  targetWindow?.minimize()
})

ipcMain.handle('window:maximizeToggle', () => {
  const targetWindow = BrowserWindow.getFocusedWindow() ?? mainWindow
  if (!targetWindow) {
    return false
  }

  if (targetWindow.isMaximized()) {
    targetWindow.unmaximize()
    return false
  }

  targetWindow.maximize()
  return true
})

ipcMain.handle('window:close', () => {
  const targetWindow = BrowserWindow.getFocusedWindow() ?? mainWindow
  targetWindow?.close()
})

ipcMain.handle('window:isMaximized', () => {
  const targetWindow = BrowserWindow.getFocusedWindow() ?? mainWindow
  return targetWindow?.isMaximized() ?? false
})

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

const getSortableTimestamp = (value: string): number => {
  const normalized = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (normalized) {
    const [year, month, day] = normalized.split('-').map(Number)
    return new Date(year, month - 1, day).getTime()
  }

  const brDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brDate) {
    const [, day, month, year] = brDate
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime()
  }

  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
}

const sortTransactionsByDateAsc = (transactions: Transaction[]): Transaction[] => {
  return [...transactions].sort((a, b) => getSortableTimestamp(a.date) - getSortableTimestamp(b.date))
}

const renderRows = (transactions: Transaction[]): string => {
  if (transactions.length === 0) {
    return '<tr><td colspan="4">Nenhuma transacao neste periodo.</td></tr>'
  }

  return sortTransactionsByDateAsc(transactions)
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

const sanitizeFileName = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'relatorio-financeiro'
  }

  return trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const formatCreatedAt = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

const renderDashboardRows = (rows: Array<{ label: string; value: string }>): string => {
  if (rows.length === 0) {
    return '<tr><td colspan="2">Sem dados da dashboard para o periodo.</td></tr>'
  }

  return rows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.label)}</td>
        <td>${escapeHtml(row.value)}</td>
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
      :root {
        --brand-700: #1b3cb3;
        --brand-500: #3366ff;
        --brand-100: #dbe6ff;
        --text-primary: #111827;
        --text-secondary: #4b5563;
        --border: #d1d5db;
        --surface: #f8faff;
        --success: #16c784;
        --danger: #ef4444;
      }
      body {
        font-family: "Segoe UI", Arial, sans-serif;
        margin: 20px;
        color: var(--text-primary);
        background: #ffffff;
        font-size: 12px;
      }
      .report {
        border: 1px solid var(--border);
        border-radius: 14px;
        overflow: hidden;
      }
      .header {
        padding: 18px 20px;
        background: linear-gradient(120deg, var(--brand-700), var(--brand-500));
        color: #ffffff;
      }
      h1 { margin: 0; font-size: 22px; }
      .meta {
        margin-top: 10px;
        display: grid;
        gap: 4px;
      }
      .meta p {
        margin: 0;
        color: rgba(255, 255, 255, 0.94);
      }
      .content { padding: 14px 18px 18px; }
      .summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 14px;
      }
      .summary-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 8px 10px;
      }
      .summary-card strong { display: block; color: var(--text-secondary); font-size: 11px; margin-bottom: 3px; }
      .summary-card span { font-size: 14px; font-weight: 700; }
      .summary-card.result span { color: ${payload.resultBalance >= 0 ? 'var(--success)' : 'var(--danger)'}; }
      .section { margin-top: 14px; }
      h2 {
        margin: 0 0 7px 0;
        font-size: 14px;
        color: var(--brand-700);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        border: 1px solid var(--border);
        border-radius: 8px;
        overflow: hidden;
      }
      th {
        background: var(--brand-100);
        color: #0e1f5c;
        text-align: left;
        padding: 7px 8px;
        border-bottom: 1px solid var(--border);
      }
      td {
        border-top: 1px solid var(--border);
        padding: 7px 8px;
      }
      tbody tr:nth-child(even) td {
        background: #fafcff;
      }
      tfoot td {
        background: #eef4ff;
        font-weight: 700;
      }
      .result {
        margin-top: 16px;
        font-size: 15px;
        font-weight: 700;
        color: var(--brand-700);
      }
    </style>
  </head>
  <body>
    <main class="report">
      <header class="header">
        <h1>Relatorio Financeiro</h1>
        <div class="meta">
          <p><strong>Arquivo:</strong> ${escapeHtml(payload.fileName)}</p>
          <p><strong>Empresa:</strong> ${escapeHtml(payload.companyName)}</p>
          <p><strong>Data de criacao:</strong> ${escapeHtml(formatCreatedAt(payload.createdAt))}</p>
          <p><strong>Periodo selecionado:</strong> ${escapeHtml(payload.periodLabel)}</p>
        </div>
      </header>

      <section class="content">
        <div class="summary">
          <div class="summary-card">
            <strong>Total entradas</strong>
            <span>${escapeHtml(formatCurrency(payload.totalEntries))}</span>
          </div>
          <div class="summary-card">
            <strong>Total saidas</strong>
            <span>${escapeHtml(formatCurrency(payload.totalOutcomes))}</span>
          </div>
          <div class="summary-card result">
            <strong>Resultado</strong>
            <span>${escapeHtml(formatCurrency(payload.resultBalance))}</span>
          </div>
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
        <tfoot>
          <tr>
            <td colspan="3">Soma total das entradas</td>
            <td>${escapeHtml(formatCurrency(payload.totalEntries))}</td>
          </tr>
        </tfoot>
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
        <tfoot>
          <tr>
            <td colspan="3">Soma total das saidas</td>
            <td>${escapeHtml(formatCurrency(payload.totalOutcomes))}</td>
          </tr>
        </tfoot>
          </table>
        </section>

        <section class="section">
          <h2>Mini tabela de dados da dashboard</h2>
          <table>
        <thead>
          <tr>
            <th>Indicador</th>
            <th>Valor</th>
          </tr>
        </thead>
            <tbody>${renderDashboardRows(payload.dashboardMetrics)}</tbody>
          </table>
        </section>

        <p class="result">Resultado final do periodo: ${escapeHtml(formatCurrency(payload.resultBalance))}</p>
      </section>
    </main>
  </body>
</html>`
}

const buildReportPdfFileName = (baseName: string): string => {
  const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
  return `${sanitizeFileName(baseName)}-${timestamp}.pdf`
}

ipcMain.handle(
  'finance:exportReportPdf',
  async (_event, payload: FinanceExportReportPdfRequest): Promise<FinanceExportReportPdfResponse> => {
    let pdfWindow: BrowserWindow | null = null

    try {
      const reportsDir = path.join(app.getPath('desktop'), 'chatfinacial', 'reports')
      await mkdir(reportsDir, { recursive: true })

      const defaultPath = path.join(reportsDir, buildReportPdfFileName(payload.fileName))
      const parentWindow = mainWindow && !mainWindow.isDestroyed() ? mainWindow : BrowserWindow.getFocusedWindow()
      const dialogOptions: SaveDialogOptions = {
        title: 'Salvar relatorio em PDF',
        defaultPath,
        buttonLabel: 'Salvar PDF',
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        properties: ['showOverwriteConfirmation']
      }

      let filePath = parentWindow
        ? dialog.showSaveDialogSync(parentWindow, dialogOptions)
        : dialog.showSaveDialogSync(dialogOptions)

      if (!filePath) {
        const fallback = parentWindow
          ? await dialog.showSaveDialog(parentWindow, dialogOptions)
          : await dialog.showSaveDialog(dialogOptions)
        filePath = fallback.filePath
      }

      if (!filePath) {
        return {
          ok: true,
          canceled: true
        }
      }

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
  app.setName('ChatFinacial')
  app.setAppUserModelId('com.chatfinacial.app')
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
