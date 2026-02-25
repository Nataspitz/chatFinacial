import { render, screen } from '@testing-library/react'
import { Formulario } from '../../../src/pages/Formulario/Formulario'

describe('Dashboard page', () => {
  it('deve renderizar pagina Dashboard sem formulario', () => {
    render(<Formulario />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar transacao' })).not.toBeInTheDocument()
  })
})
