import styles from './Carregando.module.scss'

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className={styles.carregando} role="status">
      <span className={styles.spinner} aria-hidden />
      <p>{texto}</p>
    </div>
  )
}
