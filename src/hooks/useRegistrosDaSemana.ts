import { useCallback, useMemo } from 'react'
import { useDadosEmCache } from './useDadosEmCache'
import { apagarRegistro, buscarRegistros, salvarRegistro } from '../lib/api'
import { limitesDaSemana } from '../lib/desafio'
import type { Registro, Status } from '../types'

/**
 * Carrega os registros das duas participantes na semana do "dia" escolhido
 * (a semana inteira é necessária para contar os treinos x/5).
 */
export function useRegistrosDaSemana(dia: string, userId: string) {
  const { inicio, fim } = limitesDaSemana(dia)
  const buscar = useCallback(() => buscarRegistros(inicio, fim), [inicio, fim])
  const { dados, erro, setErro, recarregar, definir } = useDadosEmCache(
    `registros:${inicio}_${fim}`,
    buscar,
  )
  const registros = useMemo(() => dados ?? [], [dados])

  /**
   * Marca a meta da usuária logada. status = null apaga o registro.
   * Atualiza a tela na hora (otimista) e desfaz se o banco recusar.
   */
  const marcar = useCallback(
    async (diaAlvo: string, meta: string, status: Status | null, valor: number | null = null) => {
      const anteriores = registros
      const semEste = registros.filter(
        (r) => !(r.user_id === userId && r.dia === diaAlvo && r.meta === meta),
      )
      if (status === null) {
        definir(() => semEste)
      } else {
        const provisorio: Registro = {
          id: `tmp-${meta}-${diaAlvo}`,
          user_id: userId,
          dia: diaAlvo,
          meta,
          status,
          valor,
          atualizado_em: new Date().toISOString(),
        }
        definir(() => [...semEste, provisorio])
      }

      try {
        if (status === null) {
          await apagarRegistro(diaAlvo, meta, userId)
        } else {
          const salvo = await salvarRegistro(diaAlvo, meta, status, valor)
          definir((atual = []) => [
            ...atual.filter((r) => !(r.user_id === userId && r.dia === diaAlvo && r.meta === meta)),
            salvo,
          ])
        }
        setErro(null)
      } catch (e) {
        definir(() => anteriores)
        setErro(`Não deu para salvar: ${(e as Error).message}`)
      }
    },
    [registros, userId, definir, setErro],
  )

  return {
    registros,
    carregando: dados === undefined,
    erro,
    marcar,
    recarregar,
  }
}
