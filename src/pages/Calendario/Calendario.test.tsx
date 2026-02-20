import { render, screen } from '@testing-library/react'
import { Calendario } from './Calendario'
import { financeService } from '../../services/finance.service'

jest.mock('../../services/finance.service', () => ({
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

  it('deve renderizar somas de entradas e saidas por dia', async () => {
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

    expect(screen.getByText(/Entradas do mês:/i)).toBeInTheDocument()
    expect(screen.getByText(/Saídas do mês:/i)).toBeInTheDocument()
  })

  it('deve considerar saida com custo mensal em todos os meses no mesmo dia', async () => {
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
      },
      {
        id: '2',
        type: 'saida',
        amount: 15,
        category: 'Cafe',
        description: 'Avulso',
        date: '2026-02-05',
        isMonthlyCost: false
      }
    ])

    render(<Calendario />)

    await screen.findByText('Dom')
    expect(screen.getByText(/^março$/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Ano')).toHaveValue('2026')

    expect(
      screen.getByText((content) => content.includes('Saídas do mês:') && content.includes('40,00'))
    ).toBeInTheDocument()
  })

  it('deve listar anos anteriores no seletor quando existirem transacoes', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-10T12:00:00.000Z'))
    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        amount: 100,
        category: 'Salario',
        description: 'Recebimento',
        date: '2024-06-20',
        isMonthlyCost: false
      }
    ])

    render(<Calendario />)

    await screen.findByText('Dom')

    expect(screen.getByRole('option', { name: '2026' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '2025' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '2024' })).toBeInTheDocument()
  })

  it('deve ocultar linhas zeradas nos cards do calendario', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-10T12:00:00.000Z'))

    mockedGetTransactions.mockResolvedValue([
      {
        id: '1',
        type: 'entrada',
        amount: 100,
        category: 'Salario',
        description: 'Recebimento',
        date: '2026-02-20',
        isMonthlyCost: false
      }
    ])

    render(<Calendario />)

    await screen.findByText('Dom')

    expect(screen.getByText(/^Entradas:/i)).toBeInTheDocument()
    expect(screen.queryByText(/^Saídas:/i)).not.toBeInTheDocument()
  })

  it('deve marcar visualmente o card do dia atual', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-10T12:00:00.000Z'))
    mockedGetTransactions.mockResolvedValue([])

    const { container } = render(<Calendario />)

    await screen.findByText('Dom')

    const todayCard = container.querySelector('[data-date="2026-02-10"]')
    expect(todayCard).not.toBeNull()
    expect(todayCard?.className).toContain('todayCell')
  })
})


