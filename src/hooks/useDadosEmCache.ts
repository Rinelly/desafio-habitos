import { useCallback, useEffect, useRef, useState } from 'react'
import { gravarCache, lerCache } from '../lib/cache'

/**
 * Busca dados mostrando primeiro o que está em cache (abre na hora)
 * e atualizando em segundo plano. Também atualiza quando a aba volta a ficar visível.
 *
 * - dados: undefined só quando nunca foi carregado (aí vale mostrar "carregando")
 */
export function useDadosEmCache<T>(chave: string, buscar: () => Promise<T>) {
  const [estado, setEstado] = useState<{ chave: string; dados: T | undefined }>(() => ({
    chave,
    dados: lerCache<T>(chave),
  }))
  const [erro, setErro] = useState<string | null>(null)
  const buscarRef = useRef(buscar)
  useEffect(() => {
    buscarRef.current = buscar
  })

  // Trocou a chave (ex.: outra semana): começa pelo cache dessa chave
  const dados = estado.chave === chave ? estado.dados : lerCache<T>(chave)

  const recarregar = useCallback(async () => {
    try {
      const novos = await buscarRef.current()
      gravarCache(chave, novos)
      setEstado({ chave, dados: novos })
      setErro(null)
    } catch (e) {
      setErro((e as Error).message)
    }
  }, [chave])

  useEffect(() => {
    recarregar()
    const aoVoltar = () => document.visibilityState === 'visible' && recarregar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [recarregar])

  /** Atualiza os dados localmente (ex.: depois de salvar), já gravando no cache. */
  const definir = useCallback(
    (atualizar: (atual: T | undefined) => T) => {
      setEstado((e) => {
        const base = e.chave === chave ? e.dados : lerCache<T>(chave)
        const novos = atualizar(base)
        gravarCache(chave, novos)
        return { chave, dados: novos }
      })
    },
    [chave],
  )

  return { dados, erro, setErro, recarregar, definir }
}
