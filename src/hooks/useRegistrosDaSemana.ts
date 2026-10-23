import { useCallback, useEffect, useState } from 'react'
import { apagarRegistro, buscarRegistros, salvarRegistro } from '../lib/api'
import { limitesDaSemana } from '../lib/desafio'
import type { Registro, Status } from '../types'

/**
 * Carrega os registros das duas participantes na semana do "dia" escolhido
 * (a semana inteira é necessária para contar os treinos x/5).
 */
export function useRegistrosDaSemana(dia: string, userId: string) {
  const { inicio, fim } = limitesDaSemana(dia)
  const [registros, setRegistros] = useState<Registro[]>([])
  const [carregadoPara, setCarregadoPara] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const chaveSemana = `${inicio}_${fim}`

  const recarregar = useCallback(async () => {
    try {
      const dados = await buscarRegistros(inicio, fim)
      setRegistros(dados)
      setErro(null)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregadoPara(chaveSemana)
    }
  }, [inicio, fim, chaveSemana])

  // Carrega ao trocar de semana (o setState acontece depois do fetch, não é síncrono)
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    recarregar()
  }, [recarregar])

  // Atualiza quando a aba volta a ficar visível (para ver o que a outra marcou)
  useEffect(() => {
    const aoVoltar = () => document.visibilityState === 'visible' && recarregar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [recarregar])

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
        setRegistros(semEste)
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
        setRegistros([...semEste, provisorio])
      }

      try {
        if (status === null) {
          await apagarRegistro(diaAlvo, meta, userId)
        } else {
          const salvo = await salvarRegistro(diaAlvo, meta, status, valor)
          setRegistros((atual) => [
            ...atual.filter((r) => !(r.user_id === userId && r.dia === diaAlvo && r.meta === meta)),
            salvo,
          ])
        }
        setErro(null)
      } catch (e) {
        setRegistros(anteriores)
        setErro(`Não deu para salvar: ${(e as Error).message}`)
      }
    },
    [registros, userId],
  )

  return {
    registros,
    carregando: carregadoPara !== chaveSemana,
    erro,
    marcar,
    recarregar,
  }
}
