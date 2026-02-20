import { Outlet } from 'react-router-dom'
import { Navbar } from '../Navbar/Navbar'
import styles from './Layout.module.css'

export const Layout = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}