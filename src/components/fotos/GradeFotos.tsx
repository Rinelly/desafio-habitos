import type { Foto } from '../../types'
import styles from './GradeFotos.module.scss'

interface Props {
  fotos: Foto[]
  links: Record<string, string>
  onAbrir: (foto: Foto) => void
  /** cor da borda (cor da pessoa); opcional */
  corPorUsuaria?: Record<string, string>
}

export function GradeFotos({ fotos, links, onAbrir, corPorUsuaria }: Props) {
  return (
    <div className={styles.grade}>
      {fotos.map((f) => (
        <button
          key={f.id}
          className={styles.miniatura}
          onClick={() => onAbrir(f)}
          style={corPorUsuaria ? { borderColor: corPorUsuaria[f.user_id] } : undefined}
          aria-label={f.legenda ? `Abrir foto: ${f.legenda}` : 'Abrir foto'}
        >
          {links[f.miniatura ?? f.caminho] ? (
            <img src={links[f.miniatura ?? f.caminho]} alt={f.legenda ?? ''} loading="lazy" />
          ) : (
            <span className={styles.placeholder} />
          )}
          {!!f.n_comentarios && (
            <span className={styles.contador} aria-label={`${f.n_comentarios} comentários`}>
              💬 {f.n_comentarios}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
