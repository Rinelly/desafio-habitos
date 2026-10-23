import { INICIO, diaPadrao, formatarDia, numeroDoDia, somarDias, TOTAL_DIAS } from '../../lib/desafio'
import styles from './SeletorDia.module.scss'

interface Props {
  dia: string
  onMudar: (dia: string) => void
}

/** ‹ sexta-feira, 23 de out. › — navega entre os dias já passados do desafio. */
export function SeletorDia({ dia, onMudar }: Props) {
  const ultimo = diaPadrao() // não deixa ir para o futuro
  const ehHoje = dia === ultimo

  return (
    <div className={styles.seletor}>
      <button
        className={styles.seta}
        onClick={() => onMudar(somarDias(dia, -1))}
        disabled={dia <= INICIO}
        aria-label="Dia anterior"
      >
        ‹
      </button>

      <div className={styles.centro}>
        <h2>{formatarDia(dia)}</h2>
        <p>
          {ehHoje ? (
            <span className={styles.hoje}>Hoje</span>
          ) : (
            <>
              Dia {numeroDoDia(dia)} de {TOTAL_DIAS} ·
              <button className={styles.voltar} onClick={() => onMudar(ultimo)}>
                Voltar para hoje
              </button>
            </>
          )}
        </p>
      </div>

      <button
        className={styles.seta}
        onClick={() => onMudar(somarDias(dia, 1))}
        disabled={dia >= ultimo}
        aria-label="Próximo dia"
      >
        ›
      </button>
    </div>
  )
}
