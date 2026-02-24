import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import styles from './Login.module.css'

interface LocationState {
  from?: {
    pathname?: string
  }
}

export const Login = (): JSX.Element => {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const redirectPath = locationState?.from?.pathname ?? '/formulario'
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/formulario" replace />
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!userName.trim() || !password.trim()) {
      setError('Preencha usuario e senha para continuar.')
      return
    }

    login(userName)
    navigate(redirectPath, { replace: true })
  }

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <header>
          <h1 className={styles.title}>Entrar</h1>
          <p className={styles.subtitle}>Acesse o painel financeiro com sua conta.</p>
        </header>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-user">
              Usuario
            </label>
            <Input
              id="login-user"
              autoComplete="username"
              placeholder="Seu usuario"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              Senha
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button type="submit" fullWidth>
            Entrar
          </Button>
        </form>
      </div>
    </section>
  )
}
