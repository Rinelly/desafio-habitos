import styles from './Lembrete.module.scss'

interface Props {
  titulo: string
  feito: boolean
  editavel: boolean
  onAlternar: (feito: boolean) => void
}

/** Lembrete diário (ex.: vacuum): só "fiz" ou não — não tem falha e não conta pontos. */
export function Lembrete({ titulo, feito, editavel, onAlternar }: Props) {
  if (!editavel) {
    return (
      <div className={styles.lembrete} data-feito={feito}>
        <span className={styles.caixa} aria-hidden>
          {feito ? '✓' : ''}
        </span>
        <span className={styles.titulo}>{titulo}</span>
        <span className={styles.estado}>{feito ? 'Feito' : '—'}</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={feito}
      className={styles.lembrete}
      data-feito={feito}
      onClick={() => onAlternar(!feito)}
    >
      <span className={styles.caixa} aria-hidden>
        {feito ? '✓' : ''}
      </span>
      <span className={styles.titulo}>{titulo}</span>
      <span className={styles.estado}>{feito ? 'Feito 🙌' : 'Toque para marcar'}</span>
    </button>
  )
}
