import { useEffect } from 'react'
import { formatarDia } from '../../lib/desafio'
import type { Foto } from '../../types'
import styles from './Visualizador.module.scss'

interface Props {
  fotos: Foto[]
  atual: Foto
  links: Record<string, string>
  nomes: Record<string, string>
  meuId: string
  onTrocar: (foto: Foto) => void
  onFechar: () => void
  onApagar: (foto: Foto) => void
}

/** Foto em tela cheia, com setas (← →), Esc para fechar e opção de apagar as minhas. */
export function Visualizador({ fotos, atual, links, nomes, meuId, onTrocar, onFechar, onApagar }: Props) {
  const i = fotos.findIndex((f) => f.id === atual.id)
  const anterior = i > 0 ? fotos[i - 1] : null
  const proxima = i < fotos.length - 1 ? fotos[i + 1] : null

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
      if (e.key === 'ArrowLeft' && anterior) onTrocar(anterior)
      if (e.key === 'ArrowRight' && proxima) onTrocar(proxima)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [anterior, proxima, onFechar, onTrocar])

  function apagar() {
    if (window.confirm('Apagar esta foto?')) {
      onApagar(atual)
      if (proxima) onTrocar(proxima)
      else if (anterior) onTrocar(anterior)
      else onFechar()
    }
  }

  return (
    <div className={styles.fundo} onClick={onFechar} role="dialog" aria-modal="true">
      <button className={styles.fechar} onClick={onFechar} aria-label="Fechar">
        ✕
      </button>

      <figure className={styles.figura} onClick={(e) => e.stopPropagation()}>
        <img src={links[atual.caminho]} alt={atual.legenda ?? ''} />
        <figcaption>
          <div>
            <strong>{nomes[atual.user_id] ?? ''}</strong> · {formatarDia(atual.dia)}
            {atual.legenda && <p>{atual.legenda}</p>}
          </div>
          {atual.user_id === meuId && (
            <button className={styles.apagar} onClick={apagar}>
              Apagar
            </button>
          )}
        </figcaption>
      </figure>

      {anterior && (
        <button
          className={`${styles.seta} ${styles.esq}`}
          onClick={(e) => (e.stopPropagation(), onTrocar(anterior))}
          aria-label="Foto anterior"
        >
          ‹
        </button>
      )}
      {proxima && (
        <button
          className={`${styles.seta} ${styles.dir}`}
          onClick={(e) => (e.stopPropagation(), onTrocar(proxima))}
          aria-label="Próxima foto"
        >
          ›
        </button>
      )}
    </div>
  )
}
