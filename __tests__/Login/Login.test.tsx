import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { Login } from '../../src/pages/Login/Login'

const mockedNavigate = jest.fn()
const mockedSignIn = jest.fn()
const mockedSignUp = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
    useLocation: () => ({ state: null })
  }
})

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    signIn: mockedSignIn,
    signUp: mockedSignUp
  })
}))

describe('Login', () => {
  beforeEach(() => {
    mockedNavigate.mockReset()
    mockedSignIn.mockReset()
    mockedSignUp.mockReset()
  })

  it('faz signin e redireciona para dashboard', async () => {
    mockedSignIn.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<Login />)

    await user.type(screen.getByLabelText('Email'), 'user@test.com')
    await user.type(screen.getByLabelText('Senha'), '123456')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith('user@test.com', '123456')
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('faz signup e redireciona para dashboard', async () => {
    mockedSignUp.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<Login />)

    await user.click(screen.getByRole('button', { name: 'Criar nova conta' }))
    await user.type(screen.getByLabelText('Email'), 'new@test.com')
    await user.type(screen.getByLabelText('Senha'), '123456')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => {
      expect(mockedSignUp).toHaveBeenCalledWith('new@test.com', '123456')
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('mostra feedback quando campos obrigatorios nao sao preenchidos', async () => {
    const user = userEvent.setup()
    render(<Login />)

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Preencha email e senha para continuar.')).toBeInTheDocument()
    expect(mockedSignIn).not.toHaveBeenCalled()
  })

  it('mostra feedback de erro em falha de autenticacao', async () => {
    mockedSignIn.mockRejectedValueOnce(new Error('Credenciais invalidas'))
    const user = userEvent.setup()

    render(<Login />)
    await user.type(screen.getByLabelText('Email'), 'user@test.com')
    await user.type(screen.getByLabelText('Senha'), 'senha')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await screen.findByText('Credenciais invalidas')
  })
})
