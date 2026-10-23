import { buscarMetas } from '../lib/api'
import { useDadosEmCache } from './useDadosEmCache'

/** Metas do desafio (quase nunca mudam: vêm do cache e atualizam em segundo plano). */
export function useMetas() {
  const { dados, erro } = useDadosEmCache('metas', buscarMetas)
  return { metas: dados ?? null, erro }
}
