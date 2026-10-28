import { useState, type CSSProperties } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFotos } from '../hooks/useFotos'
import { INICIO, diaPadrao, formatarDia, numeroDoDia } from '../lib/desafio'
import { Carregando } from '../components/Carregando'
import { GradeFotos } from '../components/fotos/GradeFotos'
import { AdicionarFoto } from '../components/fotos/AdicionarFoto'
import { Visualizador } from '../components/fotos/Visualizador'
import type { Foto } from '../types'
import styles from './Fotos.module.scss'

/** Galeria com todas as fotos do desafio, agrupadas por dia. */
export function Fotos() {
  const { participantes, eu } = useAuth()
  const meuId = eu!.user_id!
  const hojeDesafio = diaPadrao()
  const { fotos, links, carregando, enviando, erro, enviar, apagar, ajustarContagem } = useFotos(
    INICIO,
    hojeDesafio,
    meuId,
  )
  const [filtro, setFiltro] = useState<string>('todas') // 'todas' ou user_id
  const [aberta, setAberta] = useState<Foto | null>(null)

  const nomes = Object.fromEntries(participantes.map((p) => [p.user_id ?? '', p.nome]))
  const cores = Object.fromEntries(participantes.map((p) => [p.user_id ?? '', p.cor]))
  const visiveis = filtro === 'todas' ? fotos : fotos.filter((f) => f.user_id === filtro)

  // agrupa por dia (já vem do mais recente para o mais antigo)
  const porDia = new Map<string, Foto[]>()
  for (const f of visiveis) porDia.set(f.dia, [...(porDia.get(f.dia) ?? []), f])

  return (
    <section>
      <div className={styles.topo}>
        <h2>Fotos</h2>
        <div className={styles.filtros}>
          <button aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>
            Todas
          </button>
          {participantes.map((p) => (
            <button
              key={p.email}
              aria-pressed={filtro === p.user_id}
              onClick={() => setFiltro(p.user_id ?? '')}
              style={{ '--cor': p.cor } as CSSProperties}
            >
              {p.nome}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.adicionar}>
        <AdicionarFoto enviando={enviando} onEnviar={(a, l) => enviar(hojeDesafio, a, l)} />
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <Carregando />
      ) : porDia.size === 0 ? (
        <div className={styles.vazio}>
          <p>📸</p>
          <p>Nenhuma foto ainda. Que tal registrar o prato de hoje?</p>
        </div>
      ) : (
        [...porDia].map(([dia, lista]) => (
          <div key={dia} className={styles.dia}>
            <h3>
              {formatarDia(dia)} <span>· dia {numeroDoDia(dia)}</span>
            </h3>
            <GradeFotos fotos={lista} links={links} onAbrir={setAberta} corPorUsuaria={cores} />
          </div>
        ))
      )}

      {aberta && (
        <Visualizador
          fotos={visiveis}
          atual={aberta}
          links={links}
          nomes={nomes}
          cores={cores}
          meuId={meuId}
          onContagem={ajustarContagem}
          onTrocar={setAberta}
          onFechar={() => setAberta(null)}
          onApagar={apagar}
        />
      )}
    </section>
  )
}
