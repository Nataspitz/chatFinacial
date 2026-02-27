import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../../src/pages/Dashboard/Dashboard'
import { businessService } from '../../src/services/business.service'
import { financeService } from '../../src/services/finance.service'

jest.mock('../../src/services/finance.service', () => ({
  financeService: {
    getTransactions: jest.fn()
  }
}))

jest.mock('../../src/services/business.service', () => ({
  businessService: {
    getBusinessSettings: jest.fn()
  }
}))

const mockedGetTransactions = jest.mocked(financeService.getTransactions)
const mockedGetBusinessSettings = jest.mocked(businessService.getBusinessSettings)

describe('Dashboard', () => {
  beforeEach(() => {
    mockedGetTransactions.mockReset()
    mockedGetBusinessSettings.mockReset()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(min-width: 901px)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn()
      })
    })
  })

  it('renderiza estado vazio quando nao ha transacoes', async () => {
    mockedGetTransactions.mockResolvedValue([])
    mockedGetBusinessSettings.mockRejectedValue(new Error('not found'))

    render(<Dashboard />)

    await screen.findByText('Nenhuma transacao encontrada')
    expect(screen.getByText('Registre transacoes para visualizar crescimento, margem, ROI e tendencias.')).toBeInTheDocument()
  })

  it('abre e fecha painel de ajuda flutuante', async () => {
    mockedGetTransactions.mockResolvedValue([])
    mockedGetBusinessSettings.mockRejectedValue(new Error('not found'))
    const user = userEvent.setup()

    render(<Dashboard />)

    await screen.findByText('Nenhuma transacao encontrada')
    await user.click(screen.getByRole('button', { name: 'Abrir painel de ajuda da dashboard' }))
    expect(screen.getByRole('dialog', { name: 'Ajuda da dashboard' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog', { name: 'Ajuda da dashboard' })).not.toBeInTheDocument()
  })

  it('mostra feedback de erro quando falha ao carregar dados', async () => {
    mockedGetTransactions.mockRejectedValue(new Error('network'))
    mockedGetBusinessSettings.mockRejectedValue(new Error('not found'))

    render(<Dashboard />)

    await screen.findByText('Nao foi possivel carregar os dados da dashboard.')
  })
})
