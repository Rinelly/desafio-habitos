// Regras de "como foi o dia" — usadas no Calendário (e no Placar).
import type { Meta, Registro } from '../types'

export type EstadoDia = 'perfeito' | 'parcial' | 'falha' | 'vazio' | 'futuro'

export interface ResumoDia {
  cumpridas: number
  falhas: number
  total: number
  estado: EstadoDia
}

/** Lembretes (ex.: vacuum) só servem para marcar: não contam pontos, nem dia perfeito. */
export const ehLembrete = (m: Meta) => m.categoria === 'lembrete'

/** Metas que valem para o placar. */
export const metasPontuaveis = (metas: Meta[]) => metas.filter((m) => !ehLembrete(m))

/** Metas que contam todo dia (o treino é semanal e os lembretes não contam). */
export const metasDiarias = (metas: Meta[]) =>
  metasPontuaveis(metas).filter((m) => m.frequencia === 'diaria')

/**
 * Resume um dia de UMA pessoa.
 * - perfeito: cumpriu todas as metas diárias
 * - falha:    falhou em pelo menos uma
 * - parcial:  sem falhas, mas ainda falta marcar alguma
 * - vazio:    nada registrado
 * No dia de hoje, a água abaixo da meta ainda não conta como falha (o dia não acabou).
 */
export function resumirDia(metas: Meta[], registrosDoDia: Registro[], ehHoje: boolean): ResumoDia {
  const diarias = metasDiarias(metas)
  const porMeta = new Map(registrosDoDia.map((r) => [r.meta, r]))
  let cumpridas = 0
  let falhas = 0

  for (const m of diarias) {
    const r = porMeta.get(m.chave)
    if (!r) continue
    if (r.status === 'cumpriu') cumpridas++
    else if (!(ehHoje && m.tipo === 'quantidade')) falhas++
  }

  const total = diarias.length
  const estado: EstadoDia =
    cumpridas === total ? 'perfeito'
    : falhas > 0 ? 'falha'
    : !registrosDoDia.some((r) => metas.some((m) => m.chave === r.meta && !ehLembrete(m))) ? 'vazio'
    : 'parcial'

  return { cumpridas, falhas, total, estado }
}

/** Quantos treinos (meta semanal) a pessoa cumpriu nos registros informados. */
export function contarTreinos(metas: Meta[], registros: Registro[]): { feitos: number; meta: number } {
  const semanal = metas.find((m) => m.frequencia === 'semanal')
  if (!semanal) return { feitos: 0, meta: 0 }
  const feitos = registros.filter((r) => r.meta === semanal.chave && r.status === 'cumpriu').length
  return { feitos, meta: semanal.meta_semanal ?? 0 }
}
