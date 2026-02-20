import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import type {
  FinanceDeleteRequest,
  FinanceDeleteResponse,
  FinanceGetAllResponse,
  FinanceSaveRequest,
  FinanceSaveResponse,
  FinanceUpdateRequest,
  FinanceUpdateResponse
} from './types/finance-ipc.types'
import {
  deleteTransactionFromJson,
  getAllTransactionsFromJson,
  getFinanceFilePath,
  saveTransactionToJson,
  updateTransactionInJson
} from './services/finance-json.service'

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

ipcMain.handle('finance:save', async (_event, payload: FinanceSaveRequest): Promise<FinanceSaveResponse> => {
  try {
    const financeFilePath = getFinanceFilePath(app.getPath('userData'), {
      isPackaged: app.isPackaged,
      projectRoot: process.cwd()
    })
    await saveTransactionToJson(financeFilePath, payload.transaction)
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
    const financeFilePath = getFinanceFilePath(app.getPath('userData'), {
      isPackaged: app.isPackaged,
      projectRoot: process.cwd()
    })
    const transactions = await getAllTransactionsFromJson(financeFilePath)
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
    const financeFilePath = getFinanceFilePath(app.getPath('userData'), {
      isPackaged: app.isPackaged,
      projectRoot: process.cwd()
    })
    await deleteTransactionFromJson(financeFilePath, payload.id)
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
    const financeFilePath = getFinanceFilePath(app.getPath('userData'), {
      isPackaged: app.isPackaged,
      projectRoot: process.cwd()
    })
    await updateTransactionInJson(financeFilePath, payload.transaction)
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
