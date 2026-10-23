import type { Status } from '../../types'
import styles from './LinhaMeta.module.scss'

interface Props {
  titulo: string
  detalhe?: string
  status: Status | null
  editavel: boolean
  onMarcar: (status: Status | null) => void
}

/** Uma meta com os botões Cumpriu / Falhou. Tocar de novo no mesmo botão desmarca. */
export function LinhaMeta({ titulo, detalhe, status, editavel, onMarcar }: Props) {
  const alternar = (s: Status) => onMarcar(status === s ? null : s)

  return (
    <div className={styles.linha} data-status={status ?? 'vazio'}>
      <div className={styles.texto}>
        <span className={styles.titulo}>{titulo}</span>
        {detalhe && <span className={styles.detalhe}>{detalhe}</span>}
      </div>

      {editavel ? (
        <div className={styles.botoes}>
          <button
            className={styles.cumpriu}
            aria-pressed={status === 'cumpriu'}
            onClick={() => alternar('cumpriu')}
            title="Cumpriu"
          >
            ✓<span>Cumpri</span>
          </button>
          <button
            className={styles.falhou}
            aria-pressed={status === 'falhou'}
            onClick={() => alternar('falhou')}
            title="Falhou"
          >
            ✕<span>Falhei</span>
          </button>
        </div>
      ) : (
        <span className={styles.selo}>
          {status === 'cumpriu' ? '✓ Cumpriu' : status === 'falhou' ? '✕ Falhou' : '—'}
        </span>
      )}
    </div>
  )
}
