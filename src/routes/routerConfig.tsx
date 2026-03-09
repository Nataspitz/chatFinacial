import { createBrowserRouter, createHashRouter, Navigate, type RouteObject } from 'react-router-dom'
import { Layout } from '../components/Layout/Layout'
import { LoadingState } from '../components/organisms/LoadingState/LoadingState'
import { useAuth } from '../contexts/AuthContext'
import { Calendario } from '../pages/Calendario/Calendario'
import { Formulario } from '../pages/Formulario/Formulario'
import { Login } from '../pages/Login/Login'
import { Report } from '../pages/Report/Report'
import { ProtectedRoute } from './ProtectedRoute'

const RootRedirect = (): JSX.Element => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingState label="Carregando sessao..." centered />
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

const routes: RouteObject[] = [
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
            path: '/dashboard',
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
]

const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:'

export const router = isFileProtocol ? createHashRouter(routes) : createBrowserRouter(routes)
