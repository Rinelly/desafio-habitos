import { useState } from 'react'
import { formatarDia } from '../../lib/desafio'
import { POSES, primeiraFoto, ultimaFoto, type Pose } from '../../lib/medidas'
import type { Medicao } from '../../types'
import styles from './FotosAntesDepois.module.scss'

/** Primeira × última foto de cada pose, lado a lado. */
export function FotosAntesDepois({ medicoes, links }: { medicoes: Medicao[]; links: Record<string, string> }) {
  const disponiveis = POSES.filter((p) => primeiraFoto(medicoes, p.chave))
  const [pose, setPose] = useState<Pose | null>(null)
  const [ampliada, setAmpliada] = useState<string | null>(null)

  if (!disponiveis.length) return <p className={styles.vazio}>Nenhuma foto ainda.</p>

  const atual = pose && disponiveis.some((p) => p.chave === pose) ? pose : disponiveis[0].chave
  const antes = primeiraFoto(medicoes, atual)!
  const depois = ultimaFoto(medicoes, atual)!
  const mesma = antes.caminho === depois.caminho

  return (
    <div className={styles.bloco}>
      <div className={styles.poses} role="tablist">
        {disponiveis.map((p) => (
          <button key={p.chave} role="tab" aria-selected={p.chave === atual} onClick={() => setPose(p.chave)}>
            {p.rotulo}
          </button>
        ))}
      </div>

      <div className={styles.par} data-uma={mesma}>
        {[
          { rotulo: 'Antes', foto: antes },
          ...(mesma ? [] : [{ rotulo: 'Depois', foto: depois }]),
        ].map(({ rotulo, foto }) => (
          <figure key={rotulo}>
            <button onClick={() => setAmpliada(links[foto.caminho] ?? null)} aria-label={`Ampliar foto ${rotulo}`}>
              {links[foto.caminho] ? <img src={links[foto.caminho]} alt={rotulo} /> : <span />}
            </button>
            <figcaption>
              <strong>{rotulo}</strong> · {formatarDia(foto.dia, { weekday: undefined })}
            </figcaption>
          </figure>
        ))}
      </div>
      {mesma && <p className={styles.vazio}>A foto de "depois" aparece quando houver um registro mais novo.</p>}

      {ampliada && (
        <div className={styles.ampliada} onClick={() => setAmpliada(null)} role="dialog" aria-modal="true">
          <img src={ampliada} alt="" />
        </div>
      )}
    </div>
  )
}
