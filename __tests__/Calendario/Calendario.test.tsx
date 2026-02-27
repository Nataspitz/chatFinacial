import { render, screen } from '@testing-library/react'
import { Calendario } from '../../src/pages/Calendario/Calendario'
import { financeService } from '../../src/services/finance.service'

jest.mock('../../src/services/finance.service', () => ({
  financeService: {
    getTransactions: jest.fn()
  }
}))

const mockedGetTransactions = jest.mocked(financeService.getTransactions)

describe('Calendario', () => {
  beforeEach(() => {
    mockedGetTransactions.mockReset()
    jest.useRealTimers()
  })

  it('renderiza agregacoes do mes', async () => {
    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        amount: 100,
        category: 'Salario',
        description: 'Recebimento',
        date: '2026-02-20',
        isMonthlyCost: false
      },
      {
        id: '2',
        type: 'saida',
        amount: 40,
        category: 'Mercado',
        description: 'Compras',
        date: '2026-02-20',
        isMonthlyCost: false
      }
    ])

    render(<Calendario />)

    await screen.findByText('Dom')
    expect(screen.getByText((content) => content.toLowerCase().includes('entradas do m'))).toBeInTheDocument()
    expect(screen.getByText((content) => content.toLowerCase().includes('sa') && content.toLowerCase().includes('do m'))).toBeInTheDocument()
  })

  it('aplica recorrencia de custo mensal', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-10T12:00:00.000Z'))

    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'saida',
        amount: 40,
        category: 'Internet',
        description: 'Plano',
        date: '2026-01-20',
        isMonthlyCost: true
      }
    ])

    render(<Calendario />)

    await screen.findByText('Dom')
    expect(screen.getByText((content) => content.includes('40,00') && content.toLowerCase().includes('do m'))).toBeInTheDocument()
  })
})
