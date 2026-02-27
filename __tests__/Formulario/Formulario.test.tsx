import { render, screen } from '@testing-library/react'
import { Formulario } from '../../src/pages/Formulario/Formulario'

jest.mock('../../src/pages/Dashboard/Dashboard', () => ({
  Dashboard: () => <h1>Dashboard Executiva</h1>
}))

describe('Formulario', () => {
  it('renderiza a pagina Dashboard encapsulada', () => {
    render(<Formulario />)
    expect(screen.getByRole('heading', { name: 'Dashboard Executiva' })).toBeInTheDocument()
  })
})
