import { buscarRegistros } from '../lib/api'
import { INICIO, diaPadrao } from '../lib/desafio'
import { useDadosEmCache } from './useDadosEmCache'

export const buscarTodosRegistros = () => buscarRegistros(INICIO, diaPadrao())

/** Todos os registros do desafio até hoje (para Calendário e Placar). */
export function useTodosRegistros() {
  const { dados, erro } = useDadosEmCache('registros:todos', buscarTodosRegistros)
  return { registros: dados ?? null, erro }
}
