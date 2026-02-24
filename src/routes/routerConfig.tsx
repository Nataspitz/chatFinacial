import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '../components/Layout/Layout'
import { useAuth } from '../contexts/AuthContext'
import { Calendario } from '../pages/Calendario/Calendario'
import { Formulario } from '../pages/Formulario/Formulario'
import { Login } from '../pages/Login/Login'
import { Report } from '../pages/Report/Report'
import { ProtectedRoute } from './ProtectedRoute'

const RootRedirect = (): JSX.Element => {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/formulario' : '/login'} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/formulario',
            element: <Formulario />
          },
          {
            path: '/report',
            element: <Report />
          },
          {
            path: '/calendario',
            element: <Calendario />
          }
        ]
      }
    ]
  }
])
