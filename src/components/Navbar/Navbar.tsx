import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const getLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  isActive ? `${styles.link} ${styles.active}` : styles.link

export const Navbar = (): JSX.Element => {
  return (
    <nav className={styles.navbar}>
      <NavLink to="/formulario" className={getLinkClassName}>
        Formulario
      </NavLink>
      <NavLink to="/report" className={getLinkClassName}>
        Report
      </NavLink>
      <NavLink to="/calendario" className={getLinkClassName}>
        Calendario
      </NavLink>
    </nav>
  )
}
