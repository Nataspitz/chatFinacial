import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  FiAlertCircle,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiFileText,
  FiLogOut,
  FiMoon,
  FiSettings,
  FiSun
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { MobileMenuButton } from './components/MobileMenuButton'
import { AccountSettingsModal } from './components/AccountSettingsModal'
import styles from './Navbar.module.css'

const getLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  isActive ? `${styles.link} ${styles.active}` : styles.link

const isAccountSetupComplete = (user: ReturnType<typeof useAuth>['user']): boolean => {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>

  const fullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : ''
  const phone = typeof meta.phone === 'string' ? meta.phone.trim() : ''
  const companyName = typeof meta.company_name === 'string' ? meta.company_name.trim() : ''
  const preferredCurrency = typeof meta.preferred_currency === 'string' ? meta.preferred_currency.trim() : ''

  const noInitialInvestment = Boolean(meta.no_initial_investment)
  const investmentBase =
    typeof meta.investment_base_amount === 'number'
      ? meta.investment_base_amount
      : typeof meta.investment_base_amount === 'string'
        ? Number(meta.investment_base_amount.replace(',', '.'))
        : Number.NaN

  const hasValidInvestmentBase = Number.isFinite(investmentBase) && investmentBase >= 0
  const investmentConfigured = noInitialInvestment || hasValidInvestmentBase

  return Boolean(fullName && phone && companyName && preferredCurrency.length === 3 && investmentConfigured)
}

export const Navbar = (): JSX.Element => {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(() => {
    const saved = window.localStorage.getItem('sidebar.desktop.collapsed')
    return saved === 'true'
  })
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    return currentTheme === 'dark' ? 'dark' : 'light'
  })
  const isSetupComplete = isAccountSetupComplete(user)
  const fullName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : ''
  const greetingLabel = fullName || user?.email || 'Painel financeiro'

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

  useEffect(() => {
    const applyDesktopSidebarWidth = (): void => {
      const isMobile = window.matchMedia('(max-width: 900px)').matches
      if (isMobile) {
        document.documentElement.style.setProperty('--sidebar-desktop-width', '248px')
        return
      }

      document.documentElement.style.setProperty('--sidebar-desktop-width', isDesktopCollapsed ? '84px' : '248px')
    }

    applyDesktopSidebarWidth()
    window.addEventListener('resize', applyDesktopSidebarWidth)

    return () => {
      window.removeEventListener('resize', applyDesktopSidebarWidth)
    }
  }, [isDesktopCollapsed])

  useEffect(() => {
    window.localStorage.setItem('sidebar.desktop.collapsed', String(isDesktopCollapsed))
  }, [isDesktopCollapsed])

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const closeMenu = (): void => {
    setIsMenuOpen(false)
  }

  return (
    <aside className={isDesktopCollapsed ? `${styles.navbar} ${styles.navbarCollapsed}` : styles.navbar}>
      <button
        type="button"
        className={styles.desktopCollapseButton}
        aria-label={isDesktopCollapsed ? 'Expandir sidebar' : 'Minimizar sidebar'}
        onClick={() => setIsDesktopCollapsed((prev) => !prev)}
      >
        {isDesktopCollapsed ? <FiChevronRight aria-hidden /> : <FiChevronLeft aria-hidden />}
      </button>

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
            <p className={styles.brandUser}>{`Ola, ${greetingLabel}`}</p>
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
              <p className={styles.brandUser}>{`Ola, ${greetingLabel}`}</p>
            </div>
          </div>
          <MobileMenuButton className={`${styles.menuToggle} ${styles.menuClose}`} isOpen onToggle={closeMenu} />
        </div>

        {!isSetupComplete ? (
          <section className={styles.setupAlert} role="alert">
            <div className={styles.setupAlertHeader}>
              <FiAlertCircle className={styles.linkIcon} aria-hidden />
              <strong>Configuracao pendente</strong>
            </div>
            <p>No primeiro acesso, complete os dados da empresa para habilitar os indicadores.</p>
            <button
              type="button"
              className={styles.setupAlertButton}
              onClick={() => {
                closeMenu()
                setIsSettingsOpen(true)
              }}
            >
              Configurar agora
            </button>
          </section>
        ) : null}

        <nav className={styles.links}>
          <NavLink to="/dashboard" className={getLinkClassName} onClick={closeMenu} title="Dashboard">
            <FiClipboard className={styles.linkIcon} aria-hidden />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/report" className={getLinkClassName} onClick={closeMenu} title="Report">
            <FiFileText className={styles.linkIcon} aria-hidden />
            <span>Report</span>
          </NavLink>
          <NavLink to="/calendario" className={getLinkClassName} onClick={closeMenu} title="Calendario">
            <FiCalendar className={styles.linkIcon} aria-hidden />
            <span>Calendario</span>
          </NavLink>
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => {
              closeMenu()
              setIsSettingsOpen(true)
            }}
            title="Configuracoes da conta"
          >
            <FiSettings className={styles.linkIcon} aria-hidden />
            <span>Configuracoes da conta</span>
          </button>
          <button type="button" className={styles.actionButton} onClick={toggleTheme} title="Alterar tema">
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
            title="Sair"
          >
            <FiLogOut className={styles.linkIcon} aria-hidden />
            <span>Sair</span>
          </button>
        </div>
      </div>
      <AccountSettingsModal open={isSettingsOpen} user={user} onClose={() => setIsSettingsOpen(false)} />
    </aside>
  )
}
