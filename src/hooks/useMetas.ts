import { useEffect, useState } from 'react'
import { buscarMetas } from '../lib/api'
import type { Meta } from '../types'

// As metas quase nunca mudam: busca uma vez e guarda em memória.
let cache: Meta[] | null = null

export function useMetas() {
  const [metas, setMetas] = useState<Meta[] | null>(cache)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return
    buscarMetas()
      .then((m) => {
        cache = m
        setMetas(m)
      })
      .catch((e: Error) => setErro(e.message))
  }, [])

  return { metas, erro }
}
