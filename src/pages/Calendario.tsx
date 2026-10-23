import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMetas } from '../hooks/useMetas'
import { useTodosRegistros } from '../hooks/useTodosRegistros'
import { DIAS, diaPadrao, hoje, paraData } from '../lib/desafio'
import { contarTreinos, resumirDia, type EstadoDia } from '../lib/resumo'
import { Carregando } from '../components/Carregando'
import type { Registro } from '../types'
import styles from './Calendario.module.scss'

// O desafio começa numa sexta, então as semanas vão de sexta a quinta
const DIAS_SEMANA = ['Sex', 'Sáb', 'Dom', 'Seg', 'Ter', 'Qua', 'Qui']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const LEGENDA: { estado: EstadoDia; texto: string }[] = [
  { estado: 'perfeito', texto: 'Dia perfeito' },
  { estado: 'parcial', texto: 'Incompleto' },
  { estado: 'falha', texto: 'Com falha' },
  { estado: 'vazio', texto: 'Sem registro' },
]

const TEXTO_ESTADO: Record<EstadoDia, string> = {
  perfeito: 'dia perfeito',
  parcial: 'incompleto',
  falha: 'com falha',
  vazio: 'sem registro',
  futuro: 'ainda não chegou',
}

export function Calendario() {
  const { participantes } = useAuth()
  const { metas } = useMetas()
  const { registros, erro } = useTodosRegistros()
  const navegar = useNavigate()

  if (erro) return <p className={styles.erro}>{erro}</p>
  if (!metas || !registros) return <Carregando />

  const ultimo = diaPadrao()
  const diaDeHoje = hoje()

  // índice: user_id → dia → registros
  const indice = new Map<string, Map<string, Registro[]>>()
  for (const r of registros) {
    const porDia = indice.get(r.user_id) ?? new Map<string, Registro[]>()
    porDia.set(r.dia, [...(porDia.get(r.dia) ?? []), r])
    indice.set(r.user_id, porDia)
  }
  const doDia = (userId: string | null, dia: string) => indice.get(userId ?? '')?.get(dia) ?? []

  const semanas = Array.from({ length: Math.ceil(DIAS.length / 7) }, (_, i) => DIAS.slice(i * 7, i * 7 + 7))

  function abrir(dia: string) {
    navegar(dia === ultimo ? '/' : `/?dia=${dia}`)
  }

  return (
    <section>
      <h2 className={styles.titulo}>Calendário</h2>

      <ul className={styles.legenda}>
        {LEGENDA.map((l) => (
          <li key={l.estado}>
            <span className={styles.bolinha} data-estado={l.estado} /> {l.texto}
          </li>
        ))}
        <li>
          {participantes.map((p) => (
            <span key={p.email} className={styles.inicial} style={{ '--cor': p.cor } as CSSProperties}>
              {p.nome[0]} = {p.nome}
            </span>
          ))}
        </li>
      </ul>

      <div className={styles.cartao}>
        <div className={styles.cabecalho}>
          {DIAS_SEMANA.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {semanas.map((semana, i) => (
          <div key={semana[0]} className={styles.semana}>
            <div className={styles.rotuloSemana}>
              <span>Semana {i + 1}</span>
              <span className={styles.treinos}>
                💪{' '}
                {participantes.map((p) => {
                  const regs = semana.flatMap((d) => doDia(p.user_id, d))
                  const { feitos, meta } = contarTreinos(metas, regs)
                  return (
                    <span key={p.email} style={{ color: p.cor }} data-bateu={feitos >= meta}>
                      {p.nome[0]} {feitos}/{meta}
                    </span>
                  )
                })}
              </span>
            </div>

            <div className={styles.dias}>
              {semana.map((dia) => {
                const futuro = dia > ultimo
                const data = paraData(dia)
                const numero = data.getUTCDate()
                const mostrarMes = numero === 1 || dia === DIAS[0]
                const estados = participantes.map((p) => ({
                  p,
                  estado: futuro
                    ? ('futuro' as EstadoDia)
                    : resumirDia(metas, doDia(p.user_id, dia), dia === diaDeHoje).estado,
                }))
                const descricao = estados.map((e) => `${e.p.nome}: ${TEXTO_ESTADO[e.estado]}`).join(', ')

                return (
                  <button
                    key={dia}
                    className={styles.dia}
                    data-hoje={dia === diaDeHoje}
                    disabled={futuro}
                    onClick={() => abrir(dia)}
                    title={descricao}
                    aria-label={`${numero} de ${MESES[data.getUTCMonth()]} — ${descricao}`}
                  >
                    <span className={styles.numero}>
                      {numero}
                      {mostrarMes && <small>{MESES[data.getUTCMonth()]}</small>}
                    </span>
                    <span className={styles.pessoas}>
                      {estados.map(({ p, estado }) => (
                        <span key={p.email} className={styles.marca} data-estado={estado}>
                          {p.nome[0]}
                        </span>
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.dica}>Toque num dia para ver ou corrigir os registros.</p>
    </section>
  )
}
