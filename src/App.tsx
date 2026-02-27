import RouterMain from './routes/RouterMain'
import AppProviders from './contexts/AppProviders'
import { JSX } from 'react'
import { DesktopTitleBar } from './components/DesktopTitleBar/DesktopTitleBar'

const App = (): JSX.Element => {
  return (
    <AppProviders>
      <DesktopTitleBar />
      <RouterMain />
    </AppProviders>
  )
}

export default App
