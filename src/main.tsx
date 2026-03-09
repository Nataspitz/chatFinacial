import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles/globals.css'

const savedTheme = window.localStorage.getItem('theme')
const initialTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light'
document.documentElement.setAttribute('data-theme', initialTheme)

const isElectronRuntime = navigator.userAgent.toLowerCase().includes('electron')

if (!isElectronRuntime) {
  registerSW({ immediate: true })
}

window.addEventListener('error', (event) => {
  // Forward runtime errors to Electron main process diagnostics via console logging.
  console.error('[renderer-error]', event.message, event.filename, event.lineno, event.colno)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[renderer-unhandledrejection]', event.reason)
})

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
