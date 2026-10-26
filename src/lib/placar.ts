// Cálculo do placar de UMA pessoa, a partir de todos os registros dela.
import { DIAS, limitesDaSemana, semanaDoDesafio } from './desafio'
import { contarTreinos, metasDiarias, metasPontuaveis, resumirDia } from './resumo'
import type { Meta, Registro } from '../types'

export const PONTOS_POR_META = 1
export const BONUS_SEMANA_TREINO = 5

export interface Placar {
  pontos: number
  pontosSemana: number
  /** % de metas diárias cumpridas nos dias que já passaram */
  aproveitamento: number
  diasPerfeitos: number
  sequenciaAtual: number
  recorde: number
  semanasTreinoBatidas: number
  semanasPassadas: number
  /** % de cumprimento de cada meta */
  porMeta: { meta: Meta; pct: number; cumpridas: number }[]
}

export function calcularPlacar(
  todasAsMetas: Meta[],
  todosOsRegistros: Registro[],
  ultimoDia: string,
  diaDeHoje: string,
): Placar {
  // Lembretes (ex.: vacuum) ficam de fora do placar
  const metas = metasPontuaveis(todasAsMetas)
  const chaves = new Set(metas.map((m) => m.chave))
  const registros = todosOsRegistros.filter((r) => chaves.has(r.meta))
  const dias = DIAS.filter((d) => d <= ultimoDia)
  const porDia = new Map<string, Registro[]>()
  for (const r of registros) porDia.set(r.dia, [...(porDia.get(r.dia) ?? []), r])

  const cumpriu = registros.filter((r) => r.status === 'cumpriu')
  const semanaAtual = semanaDoDesafio(ultimoDia)

  // Bônus: semanas em que bateu a meta de treinos
  let semanasTreinoBatidas = 0
  let bonusSemanaAtual = 0
  for (let s = 1; s <= semanaAtual; s++) {
    const { inicio, fim } = limitesDaSemana(dias[(s - 1) * 7])
    const { feitos, meta } = contarTreinos(metas, registros.filter((r) => r.dia >= inicio && r.dia <= fim))
    if (meta && feitos >= meta) {
      semanasTreinoBatidas++
      if (s === semanaAtual) bonusSemanaAtual = BONUS_SEMANA_TREINO
    }
  }

  const pontos = cumpriu.length * PONTOS_POR_META + semanasTreinoBatidas * BONUS_SEMANA_TREINO
  const { inicio: iniSemana } = limitesDaSemana(ultimoDia)
  const pontosSemana =
    cumpriu.filter((r) => r.dia >= iniSemana).length * PONTOS_POR_META + bonusSemanaAtual

  // Dias perfeitos e sequências
  let diasPerfeitos = 0
  let recorde = 0
  let corrente = 0
  const perfeito = new Map<string, boolean>()
  for (const d of dias) {
    const ok = resumirDia(metas, porDia.get(d) ?? [], d === diaDeHoje).estado === 'perfeito'
    perfeito.set(d, ok)
    if (ok) {
      diasPerfeitos++
      corrente++
      recorde = Math.max(recorde, corrente)
    } else {
      corrente = 0
    }
  }
  // Sequência atual: conta para trás a partir de hoje; hoje ainda incompleto não quebra a sequência
  let sequenciaAtual = 0
  for (let i = dias.length - 1; i >= 0; i--) {
    const d = dias[i]
    if (perfeito.get(d)) sequenciaAtual++
    else if (d === diaDeHoje && sequenciaAtual === 0) continue
    else break
  }

  const diarias = metasDiarias(metas)
  const totalPossivel = diarias.length * dias.length
  const cumpridasDiarias = cumpriu.filter((r) => diarias.some((m) => m.chave === r.meta)).length

  const porMeta = metas.map((meta) => {
    const n = cumpriu.filter((r) => r.meta === meta.chave).length
    // treino: compara com o que era esperado (5 por semana), não com todos os dias
    const esperado =
      meta.frequencia === 'semanal' && meta.meta_semanal
        ? Math.max(1, Math.round((dias.length / 7) * meta.meta_semanal))
        : dias.length
    return { meta, cumpridas: n, pct: esperado ? Math.min(100, Math.round((n / esperado) * 100)) : 0 }
  })

  return {
    pontos,
    pontosSemana,
    aproveitamento: totalPossivel ? Math.round((cumpridasDiarias / totalPossivel) * 100) : 0,
    diasPerfeitos,
    sequenciaAtual,
    recorde,
    semanasTreinoBatidas,
    semanasPassadas: semanaAtual,
    porMeta,
  }
}
