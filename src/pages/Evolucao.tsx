import { useState, type CSSProperties } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMedicoes } from '../hooks/useMedicoes'
import { formatarDia, hoje } from '../lib/desafio'
import { POSES, formatarNumero } from '../lib/medidas'
import { Carregando } from '../components/Carregando'
import { Comparativo } from '../components/evolucao/Comparativo'
import { FotosAntesDepois } from '../components/evolucao/FotosAntesDepois'
import { FormularioMedidas } from '../components/evolucao/FormularioMedidas'
import type { Medicao } from '../types'
import styles from './Evolucao.module.scss'

/** Antes e depois: peso, medidas e fotos de cada uma. */
export function Evolucao() {
  const { participantes, eu } = useAuth()
  const meuId = eu!.user_id!
  const { medicoes, links, erro, salvando, salvar, apagar } = useMedicoes(meuId)
  const [vendo, setVendo] = useState(meuId)
  const [formAberto, setFormAberto] = useState<{ existente: Medicao | null } | null>(null)

  if (!medicoes) return <Carregando />

  const pessoa = participantes.find((p) => p.user_id === vendo) ?? eu!
  const souEu = vendo === meuId
  const daPessoa = medicoes.filter((m) => m.user_id === vendo) // já vem em ordem de data

  return (
    <section>
      <div className={styles.topo}>
        <h2>Evolução</h2>
        {souEu && (
          <button className={styles.novo} onClick={() => setFormAberto({ existente: null })}>
            + Registrar medidas
          </button>
        )}
      </div>

      <div className={styles.pessoas} role="tablist">
        {participantes.map((p) => (
          <button
            key={p.email}
            role="tab"
            aria-selected={vendo === p.user_id}
            onClick={() => p.user_id && setVendo(p.user_id)}
            disabled={!p.user_id}
            style={{ '--cor': p.cor } as CSSProperties}
          >
            {p === eu ? `${p.nome} (você)` : p.nome}
          </button>
        ))}
      </div>

      {erro && !formAberto && <p className={styles.erro}>{erro}</p>}

      {daPessoa.length === 0 ? (
        <div className={styles.cartao} style={{ textAlign: 'center' }}>
          <p className={styles.emoji}>📏</p>
          {souEu ? (
            <>
              <p>Registre seu ponto de partida: peso, medidas e fotos.</p>
              <button className={styles.novo} onClick={() => setFormAberto({ existente: null })}>
                Registrar medidas iniciais
              </button>
            </>
          ) : (
            <p>{pessoa.nome} ainda não registrou medidas.</p>
          )}
        </div>
      ) : (
        <>
          <article className={styles.cartao}>
            <h3>📊 Medidas</h3>
            <Comparativo medicoes={daPessoa} />
          </article>

          <article className={styles.cartao}>
            <h3>📸 Antes e depois</h3>
            <FotosAntesDepois medicoes={daPessoa} links={links} />
          </article>

          <article className={styles.cartao}>
            <h3>🗓️ Registros</h3>
            <ul className={styles.historico}>
              {[...daPessoa].reverse().map((m, i) => {
                const nFotos = POSES.filter((p) => m[p.chave]).length
                const ehInicio = i === daPessoa.length - 1
                return (
                  <li key={m.id}>
                    <div>
                      <strong>{formatarDia(m.dia)}</strong>
                      {ehInicio && <span className={styles.tag}>início</span>}
                      <p>
                        {m.peso != null && `${formatarNumero(m.peso, 2)} kg · `}
                        {nFotos} {nFotos === 1 ? 'foto' : 'fotos'}
                        {m.observacao && ` · ${m.observacao}`}
                      </p>
                    </div>
                    {souEu && (
                      <span className={styles.acoes}>
                        <button onClick={() => setFormAberto({ existente: m })}>Editar</button>
                        <button
                          className={styles.apagar}
                          onClick={() => window.confirm('Apagar este registro e as fotos dele?') && apagar(m)}
                        >
                          Apagar
                        </button>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </article>
        </>
      )}

      {formAberto && (
        <FormularioMedidas
          diaInicial={hoje()}
          existente={formAberto.existente}
          links={links}
          salvando={salvando}
          erro={erro}
          onSalvar={salvar}
          onFechar={() => setFormAberto(null)}
        />
      )}
    </section>
  )
}
