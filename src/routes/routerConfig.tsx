import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '../components/Layout/Layout'
import { Calendario } from '../pages/Calendario/Calendario'
import { Formulario } from '../pages/Formulario/Formulario'
import { Report } from '../pages/Report/Report'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/formulario" replace />
  },
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
])
