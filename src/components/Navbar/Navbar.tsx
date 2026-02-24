import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FiCalendar, FiClipboard, FiFileText, FiLogOut, FiMoon, FiSun } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import styles from './Navbar.module.css'

const getLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  isActive ? `${styles.link} ${styles.active}` : styles.link

export const Navbar = (): JSX.Element => {
  const { userName, logout } = useAuth()
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
    <aside className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>CF</span>
        <div>
          <strong className={styles.brandTitle}>ChatFinancial</strong>
          <p className={styles.brandUser}>{userName ? `Ola, ${userName}` : 'Painel financeiro'}</p>
        </div>
      </div>

      <nav className={styles.links}>
        <NavLink to="/formulario" className={getLinkClassName}>
          <FiClipboard className={styles.linkIcon} aria-hidden />
          <span>Formulario</span>
        </NavLink>
        <NavLink to="/report" className={getLinkClassName}>
          <FiFileText className={styles.linkIcon} aria-hidden />
          <span>Report</span>
        </NavLink>
        <NavLink to="/calendario" className={getLinkClassName}>
          <FiCalendar className={styles.linkIcon} aria-hidden />
          <span>Calendario</span>
        </NavLink>
      </nav>

      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={toggleTheme}>
          {theme === 'light' ? <FiMoon className={styles.linkIcon} aria-hidden /> : <FiSun className={styles.linkIcon} aria-hidden />}
          <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
        </button>
        <button type="button" className={`${styles.actionButton} ${styles.logoutButton}`} onClick={logout}>
          <FiLogOut className={styles.linkIcon} aria-hidden />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
