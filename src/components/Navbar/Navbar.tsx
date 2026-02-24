import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '../ui'
import styles from './Navbar.module.css'

const getLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  isActive ? `${styles.link} ${styles.active}` : styles.link

export const Navbar = (): JSX.Element => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    return currentTheme === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.links}>
        <NavLink to="/formulario" className={getLinkClassName}>
          Formulario
        </NavLink>
        <NavLink to="/report" className={getLinkClassName}>
          Report
        </NavLink>
        <NavLink to="/calendario" className={getLinkClassName}>
          Calendario
        </NavLink>
      </div>
      <Button variant="secondary" className={styles.themeToggle} onClick={toggleTheme}>
        {theme === 'light' ? 'Tema: Claro' : 'Tema: Escuro'}
      </Button>
    </nav>
  )
}
