import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formulario } from './Formulario'
import { financeService } from '../../services/finance.service'

jest.mock('../../services/finance.service', () => ({
  financeService: {
    saveTransaction: jest.fn()
  }
}))

const mockedSaveTransaction = jest.mocked(financeService.saveTransaction)

describe('Formulario', () => {
  beforeEach(() => {
    mockedSaveTransaction.mockReset()
  })

  it('deve salvar transacao valida e mostrar feedback de sucesso', async () => {
    mockedSaveTransaction.mockResolvedValue(undefined)

    render(<Formulario />)
    const user = userEvent.setup()

    await user.selectOptions(screen.getByRole('combobox'), 'entrada')
    await user.type(screen.getByPlaceholderText('0.00'), '123.45')
    await user.click(screen.getByRole('button', { name: 'Outra data' }))
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement | null
    expect(dateInput).not.toBeNull()
    await user.type(dateInput as HTMLInputElement, '2026-02-20')
    await user.type(screen.getByPlaceholderText('Ex: Alimentacao'), 'Salario')
    await user.type(screen.getByPlaceholderText('Descreva a transacao'), 'Recebimento mensal')

    await user.click(screen.getByRole('button', { name: 'Salvar transacao' }))

    expect(mockedSaveTransaction).toHaveBeenCalledTimes(1)
    expect(mockedSaveTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'entrada',
        amount: 123.45,
        date: '2026-02-20',
        category: 'Salario',
        description: 'Recebimento mensal',
        isMonthlyCost: false
      })
    )

    expect(screen.getByText('Transacao registrada com sucesso (entrada).')).toBeInTheDocument()
  })

  it('nao deve salvar quando valor for invalido', async () => {
    render(<Formulario />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('0.00'), '0')
    await user.click(screen.getByRole('button', { name: 'Salvar transacao' }))

    expect(mockedSaveTransaction).not.toHaveBeenCalled()
    expect(screen.getByText('Informe um valor valido maior que zero.')).toBeInTheDocument()
  })

  it('deve permitir salvar saida como custo mensal', async () => {
    mockedSaveTransaction.mockResolvedValue(undefined)

    render(<Formulario />)
    const user = userEvent.setup()

    await user.selectOptions(screen.getByRole('combobox'), 'saida')
    await user.type(screen.getByPlaceholderText('0.00'), '300')
    await user.type(screen.getByPlaceholderText('Ex: Alimentacao'), 'Internet')
    await user.type(screen.getByPlaceholderText('Descreva a transacao'), 'Plano de internet')
    await user.click(screen.getByRole('checkbox', { name: 'Marcar como custo mensal' }))
    await user.click(screen.getByRole('button', { name: 'Salvar transacao' }))

    expect(mockedSaveTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'saida',
        isMonthlyCost: true
      })
    )
  })
})
