import { useEffect, useRef, useState } from 'react'
import styles from './ContadorAgua.module.scss'

interface Props {
  litros: number
  alvo: number
  editavel: boolean
  /** O dia ainda está em andamento? (aí não conta como falha) */
  emAndamento: boolean
  onSalvar: (litros: number) => void
}

const PASSOS = [0.25, 0.5]

const formatar = (l: number) => `${l.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`

/** Contador de água. Espera você parar de tocar (0,7s) antes de salvar no banco. */
export function ContadorAgua({ litros, alvo, editavel, emAndamento, onSalvar }: Props) {
  const [valor, setValor] = useState(litros)
  const timer = useRef<number | undefined>(undefined)
  const editando = useRef(false)
  const pendente = useRef<number | null>(null)
  const salvarRef = useRef(onSalvar)
  useEffect(() => {
    salvarRef.current = onSalvar
  })

  // Sincroniza com o banco quando não está no meio de uma edição
  useEffect(() => {
    if (!editando.current) setValor(litros)
  }, [litros])

  // Se sair da tela (ou trocar de dia) antes dos 0,7s, salva na hora
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      if (pendente.current !== null) salvarRef.current(pendente.current)
    },
    [],
  )

  function mudar(delta: number) {
    const novo = Math.max(0, Math.round((valor + delta) * 100) / 100)
    setValor(novo)
    editando.current = true
    pendente.current = novo
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      editando.current = false
      pendente.current = null
      salvarRef.current(novo)
    }, 700)
  }

  const pct = Math.min(100, (valor / alvo) * 100)
  const bateu = valor >= alvo
  const estado = bateu ? 'cumpriu' : valor === 0 && emAndamento ? 'vazio' : emAndamento ? 'andamento' : 'falhou'
  const legenda = bateu
    ? 'Meta batida! 💧'
    : emAndamento
      ? `Faltam ${formatar(alvo - valor)}`
      : `Não chegou nos ${formatar(alvo)}`

  return (
    <div className={styles.agua} data-estado={estado}>
      <div className={styles.topo}>
        <span className={styles.titulo}>Água</span>
        <span className={styles.valor}>
          <strong>{formatar(valor)}</strong> / {formatar(alvo)}
        </span>
      </div>

      <div className={styles.barra} role="progressbar" aria-valuenow={valor} aria-valuemax={alvo}>
        <div style={{ width: `${pct}%` }} />
      </div>

      <div className={styles.rodape}>
        <span className={styles.legenda}>{legenda}</span>
        {editavel && (
          <div className={styles.botoes}>
            <button onClick={() => mudar(-0.25)} disabled={valor <= 0} aria-label="Tirar 250 ml">
              −
            </button>
            {PASSOS.map((p) => (
              <button key={p} onClick={() => mudar(p)}>
                +{p * 1000} ml
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
