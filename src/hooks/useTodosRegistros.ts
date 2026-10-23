import { useEffect, useState } from 'react'
import { buscarRegistros } from '../lib/api'
import { INICIO, diaPadrao } from '../lib/desafio'
import type { Registro } from '../types'

/** Todos os registros do desafio até hoje (para Calendário e Placar). */
export function useTodosRegistros() {
  const [registros, setRegistros] = useState<Registro[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    const carregar = () =>
      buscarRegistros(INICIO, diaPadrao())
        .then((r) => !cancelado && (setRegistros(r), setErro(null)))
        .catch((e: Error) => !cancelado && setErro(e.message))

    carregar()
    const aoVoltar = () => document.visibilityState === 'visible' && carregar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      cancelado = true
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [])

  return { registros, erro }
}
