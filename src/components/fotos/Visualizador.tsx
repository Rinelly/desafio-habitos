import { useEffect, useState } from 'react'
import { formatarDia } from '../../lib/desafio'
import { linksEmCache, obterLinks } from '../../lib/links'
import type { Foto } from '../../types'
import { Comentarios } from './Comentarios'
import styles from './Visualizador.module.scss'

interface Props {
  fotos: Foto[]
  atual: Foto
  links: Record<string, string>
  nomes: Record<string, string>
  cores: Record<string, string>
  meuId: string
  /** avisa quando a quantidade de comentários da foto muda */
  onContagem?: (fotoId: string, delta: number) => void
  onTrocar: (foto: Foto) => void
  onFechar: () => void
  onApagar: (foto: Foto) => void
}

/** Foto em tela cheia, com setas (← →), Esc para fechar e opção de apagar as minhas. */
export function Visualizador({
  fotos,
  atual,
  links,
  nomes,
  cores,
  meuId,
  onContagem,
  onTrocar,
  onFechar,
  onApagar,
}: Props) {
  // A foto grande só é baixada aqui, ao ampliar; enquanto carrega, mostra a miniatura
  const [grandes, setGrandes] = useState<Record<string, string>>(() => linksEmCache([atual.caminho]))
  useEffect(() => {
    let cancelado = false
    obterLinks([atual.caminho])
      .then((l) => !cancelado && setGrandes((g) => ({ ...g, ...l })))
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [atual.caminho])
  const src =
    grandes[atual.caminho] ?? links[atual.caminho] ?? (atual.miniatura ? links[atual.miniatura] : undefined)

  const i = fotos.findIndex((f) => f.id === atual.id)
  const anterior = i > 0 ? fotos[i - 1] : null
  const proxima = i < fotos.length - 1 ? fotos[i + 1] : null

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
      // setas no campo de comentário movem o cursor, não trocam a foto
      if ((e.target as HTMLElement).tagName === 'INPUT') return
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
        <div className={styles.imagem}>
          <img src={src} alt={atual.legenda ?? ''} />
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

        <Comentarios
          key={atual.id}
          fotoId={atual.id}
          meuId={meuId}
          nomes={nomes}
          cores={cores}
          onContagem={onContagem ? (d) => onContagem(atual.id, d) : undefined}
        />
      </figure>
    </div>
  )
}
