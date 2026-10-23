// Regras de datas do desafio. Todas as datas são strings 'AAAA-MM-DD'
// no fuso de Maceió, para bater com a coluna "dia" do banco.

export const INICIO = '2026-10-23'
export const FIM = '2026-12-24'
export const FUSO = 'America/Maceio'

const DIA_MS = 24 * 60 * 60 * 1000

/** Converte 'AAAA-MM-DD' em Date (meio-dia UTC, evita problemas de fuso). */
export function paraData(dia: string): Date {
  return new Date(`${dia}T12:00:00Z`)
}

/** Converte Date em 'AAAA-MM-DD'. */
export function paraDia(data: Date): string {
  return data.toISOString().slice(0, 10)
}

/** Dia de hoje em Maceió, no formato 'AAAA-MM-DD'. */
export function hoje(): string {
  // 'en-CA' formata como AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(new Date())
}

export function somarDias(dia: string, n: number): string {
  return paraDia(new Date(paraData(dia).getTime() + n * DIA_MS))
}

export const TOTAL_DIAS =
  Math.round((paraData(FIM).getTime() - paraData(INICIO).getTime()) / DIA_MS) + 1 // 63

/** Todos os dias do desafio, em ordem. */
export const DIAS: string[] = Array.from({ length: TOTAL_DIAS }, (_, i) => somarDias(INICIO, i))

/** Número do dia no desafio (1 a 63). Fora do período: 0 (antes) ou TOTAL_DIAS + 1 (depois). */
export function numeroDoDia(dia: string): number {
  if (dia < INICIO) return 0
  if (dia > FIM) return TOTAL_DIAS + 1
  return Math.round((paraData(dia).getTime() - paraData(INICIO).getTime()) / DIA_MS) + 1
}

/** Semana do desafio (1 a 9). As semanas vão de sexta a quinta. */
export function semanaDoDesafio(dia: string): number {
  return Math.ceil(numeroDoDia(dia) / 7)
}

export function dentroDoDesafio(dia: string): boolean {
  return dia >= INICIO && dia <= FIM
}

/** Ex.: 'sexta, 23 de out.' */
export function formatarDia(dia: string, opcoes?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    ...opcoes,
  }).format(paraData(dia))
}

/** Primeiro e último dia da semana do desafio que contém "dia". */
export function limitesDaSemana(dia: string): { inicio: string; fim: string } {
  const semana = Math.min(Math.max(semanaDoDesafio(dia), 1), Math.ceil(TOTAL_DIAS / 7))
  const inicio = somarDias(INICIO, (semana - 1) * 7)
  const fim = somarDias(inicio, 6) > FIM ? FIM : somarDias(inicio, 6)
  return { inicio, fim }
}

/** Dia que o app deve abrir: hoje, limitado ao período do desafio. */
export function diaPadrao(): string {
  const h = hoje()
  if (h < INICIO) return INICIO
  if (h > FIM) return FIM
  return h
}
