import type { ReactNode } from 'react'
import { cx } from '../../ui/utils'
import styles from './PageIntro.module.css'

interface PageIntroProps {
  title: string
  description: string
  titleTag?: 'h1' | 'h2'
  action?: ReactNode
}

export const PageIntro = ({ title, description, titleTag = 'h1', action }: PageIntroProps): JSX.Element => {
  const TitleTag = titleTag

  if (action) {
    return (
      <header className={cx(styles.header, styles.headerWithAction)}>
        <div>
          <TitleTag>{title}</TitleTag>
          <p className={styles.description}>{description}</p>
        </div>
        {action}
      </header>
    )
  }

  return (
    <header className={styles.header}>
      <TitleTag>{title}</TitleTag>
      <p className={styles.description}>{description}</p>
    </header>
  )
}
