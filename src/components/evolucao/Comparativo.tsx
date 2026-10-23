import { formatarDia } from '../../lib/desafio'
import { CAMPOS, formatarNumero, primeiroValor, ultimoValor } from '../../lib/medidas'
import type { Medicao } from '../../types'
import styles from './Comparativo.module.scss'

/** Tabela Início × Atual × Diferença, só com as medidas que foram preenchidas. */
export function Comparativo({ medicoes }: { medicoes: Medicao[] }) {
  const primeira = medicoes[0]
  const ultima = medicoes[medicoes.length - 1]
  const umSo = medicoes.length === 1

  const linhas = CAMPOS.map((c) => ({
    c,
    antes: primeiroValor(medicoes, c.chave),
    depois: ultimoValor(medicoes, c.chave),
  })).filter((l) => l.antes !== null || l.depois !== null)

  if (!linhas.length) return <p className={styles.vazio}>Nenhuma medida preenchida ainda.</p>

  return (
    <div className={styles.tabela} role="table">
      <div className={styles.cabecalho} role="row">
        <span role="columnheader">Medida</span>
        <span role="columnheader">
          Início
          <small>{formatarDia(primeira.dia, { weekday: undefined })}</small>
        </span>
        {!umSo && (
          <>
            <span role="columnheader">
              Atual
              <small>{formatarDia(ultima.dia, { weekday: undefined })}</small>
            </span>
            <span role="columnheader">Diferença</span>
          </>
        )}
      </div>

      {linhas.map(({ c, antes, depois }) => {
        const dif = antes !== null && depois !== null ? Math.round((depois - antes) * 100) / 100 : null
        const melhorou = dif !== null && dif !== 0 && (c.melhor === 'menos' ? dif < 0 : dif > 0)
        const estado = dif === null || dif === 0 ? 'igual' : melhorou ? 'melhorou' : 'piorou'
        return (
          <div key={c.chave} className={styles.linha} role="row">
            <span role="cell" className={styles.nome}>
              {c.rotulo}
            </span>
            <span role="cell">
              {formatarNumero(antes, 2)} <small>{c.unidade}</small>
            </span>
            {!umSo && (
              <>
                <span role="cell">
                  {formatarNumero(depois, 2)} <small>{c.unidade}</small>
                </span>
                <span role="cell">
                  <span className={styles.selo} data-estado={estado}>
                    {dif === null ? '—' : `${dif > 0 ? '+' : ''}${formatarNumero(dif, 2)} ${c.unidade}`}
                  </span>
                </span>
              </>
            )}
          </div>
        )
      })}

      {umSo && <p className={styles.dica}>Registre de novo mais para frente para ver a comparação. 💜</p>}
    </div>
  )
}
