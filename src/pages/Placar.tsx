import type { CSSProperties } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMetas } from '../hooks/useMetas'
import { useTodosRegistros } from '../hooks/useTodosRegistros'
import { diaPadrao, hoje } from '../lib/desafio'
import { BONUS_SEMANA_TREINO, calcularPlacar } from '../lib/placar'
import { Carregando } from '../components/Carregando'
import styles from './Placar.module.scss'

export function Placar() {
  const { participantes } = useAuth()
  const { metas } = useMetas()
  const { registros, erro } = useTodosRegistros()

  if (erro) return <p className={styles.erro}>{erro}</p>
  if (!metas || !registros) return <Carregando />

  const ultimo = diaPadrao()
  const placares = participantes.map((p) => ({
    p,
    placar: calcularPlacar(
      metas,
      registros.filter((r) => r.user_id === p.user_id),
      ultimo,
      hoje(),
    ),
  }))

  const [a, b] = placares
  const diferenca = a && b ? a.placar.pontos - b.placar.pontos : 0
  const lider = diferenca > 0 ? a : diferenca < 0 ? b : null

  return (
    <section>
      <h2 className={styles.titulo}>Placar</h2>

      <div className={styles.faixa} style={{ '--cor': lider?.p.cor ?? '#6c5ce7' } as CSSProperties}>
        {lider ? (
          <>
            🏆 <strong>{lider.p.nome}</strong> está na frente por{' '}
            <strong>{Math.abs(diferenca)}</strong> {Math.abs(diferenca) === 1 ? 'ponto' : 'pontos'}
          </>
        ) : (
          <>🤝 Empate! Ninguém solta a mão de ninguém</>
        )}
      </div>

      <div className={styles.cartoes}>
        {placares.map(({ p, placar }) => (
          <article key={p.email} className={styles.cartao} style={{ '--cor': p.cor } as CSSProperties}>
            <h3>{p.nome}</h3>
            <p className={styles.pontos}>
              {placar.pontos}
              <small>pontos</small>
            </p>
            <p className={styles.semana}>+{placar.pontosSemana} nesta semana</p>

            <dl className={styles.numeros}>
              <div>
                <dt>🔥 Sequência</dt>
                <dd>
                  {placar.sequenciaAtual} {placar.sequenciaAtual === 1 ? 'dia' : 'dias'}
                </dd>
              </div>
              <div>
                <dt>⭐ Recorde</dt>
                <dd>
                  {placar.recorde} {placar.recorde === 1 ? 'dia' : 'dias'}
                </dd>
              </div>
              <div>
                <dt>✅ Dias perfeitos</dt>
                <dd>{placar.diasPerfeitos}</dd>
              </div>
              <div>
                <dt>📈 Acertos</dt>
                <dd>{placar.aproveitamento}%</dd>
              </div>
              <div>
                <dt>💪 Semanas 5/5</dt>
                <dd>
                  {placar.semanasTreinoBatidas}/{placar.semanasPassadas}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <article className={styles.metas}>
        <h3>Meta por meta</h3>
        <p className={styles.sub}>% de cumprimento desde 23/10 (treino: comparado a 5 por semana)</p>
        {metas.map((m) => (
          <div key={m.chave} className={styles.meta}>
            <span className={styles.nomeMeta}>{m.titulo}</span>
            {placares.map(({ p, placar }) => {
              const item = placar.porMeta.find((x) => x.meta.chave === m.chave)!
              return (
                <div key={p.email} className={styles.linhaBarra} style={{ '--cor': p.cor } as CSSProperties}>
                  <span className={styles.inicial}>{p.nome[0]}</span>
                  <div className={styles.barra}>
                    <div style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className={styles.pct}>{item.pct}%</span>
                </div>
              )
            })}
          </div>
        ))}
      </article>

      <p className={styles.regras}>
        Como funciona: 1 ponto por meta cumprida (cada treino também conta) + {BONUS_SEMANA_TREINO} pontos
        de bônus em cada semana com 5 treinos. A sequência conta dias seguidos com todas as metas diárias
        cumpridas — o dia de hoje só entra quando estiver completo.
      </p>
    </section>
  )
}
