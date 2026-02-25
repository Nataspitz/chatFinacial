import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FiCalendar, FiClipboard, FiFileText, FiLogOut, FiMoon, FiSun } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { MobileMenuButton } from './components/MobileMenuButton'
import styles from './Navbar.module.css'

const getLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  isActive ? `${styles.link} ${styles.active}` : styles.link

export const Navbar = (): JSX.Element => {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    return currentTheme === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 900px)').matches
    if (!isMobile) return

    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const closeMenu = (): void => {
    setIsMenuOpen(false)
  }

  return (
    <aside className={styles.navbar}>
      <div className={styles.brand}>
        <MobileMenuButton
          className={`${styles.menuToggle} ${styles.menuLauncher}`}
          isOpen={false}
          onToggle={() => setIsMenuOpen(true)}
        />
        <div className={styles.brandInfo}>
          <span className={styles.brandIcon}>CF</span>
          <div>
            <strong className={styles.brandTitle}>ChatFinancial</strong>
            <p className={styles.brandUser}>{user?.email ? `Ola, ${user.email}` : 'Painel financeiro'}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Fechar menu"
        className={`${styles.mobileBackdrop} ${isMenuOpen ? styles.mobileBackdropOpen : ''}`}
        onClick={closeMenu}
      />

      <div className={`${styles.mobileDrawer} ${isMenuOpen ? styles.mobileDrawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <div className={styles.brandInfo}>
            <span className={styles.brandIcon}>CF</span>
            <div>
              <strong className={styles.brandTitle}>ChatFinancial</strong>
              <p className={styles.brandUser}>{user?.email ? `Ola, ${user.email}` : 'Painel financeiro'}</p>
            </div>
          </div>
          <MobileMenuButton className={`${styles.menuToggle} ${styles.menuClose}`} isOpen onToggle={closeMenu} />
        </div>

        <nav className={styles.links}>
          <NavLink to="/dashboard" className={getLinkClassName} onClick={closeMenu}>
            <FiClipboard className={styles.linkIcon} aria-hidden />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/report" className={getLinkClassName} onClick={closeMenu}>
            <FiFileText className={styles.linkIcon} aria-hidden />
            <span>Report</span>
          </NavLink>
          <NavLink to="/calendario" className={getLinkClassName} onClick={closeMenu}>
            <FiCalendar className={styles.linkIcon} aria-hidden />
            <span>Calendario</span>
          </NavLink>
        </nav>

        <div className={styles.actions}>
          <button type="button" className={styles.actionButton} onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon className={styles.linkIcon} aria-hidden /> : <FiSun className={styles.linkIcon} aria-hidden />}
            <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.logoutButton}`}
            onClick={() => {
              closeMenu()
              void signOut()
            }}
          >
            <FiLogOut className={styles.linkIcon} aria-hidden />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
