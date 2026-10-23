import type { Medicao } from '../types'

export type CampoMedida =
  | 'peso'
  | 'cintura'
  | 'quadril'
  | 'abdomen'
  | 'busto'
  | 'braco'
  | 'coxa'
  | 'gordura_pct'
  | 'massa_muscular'

export interface DefCampo {
  chave: CampoMedida
  rotulo: string
  unidade: string
  /** o que é "melhorar": diminuir ou aumentar */
  melhor: 'menos' | 'mais'
  grupo: 'corpo' | 'medidas' | 'bio'
}

export const CAMPOS: DefCampo[] = [
  { chave: 'peso', rotulo: 'Peso', unidade: 'kg', melhor: 'menos', grupo: 'corpo' },
  { chave: 'cintura', rotulo: 'Cintura', unidade: 'cm', melhor: 'menos', grupo: 'medidas' },
  { chave: 'abdomen', rotulo: 'Abdômen', unidade: 'cm', melhor: 'menos', grupo: 'medidas' },
  { chave: 'quadril', rotulo: 'Quadril', unidade: 'cm', melhor: 'menos', grupo: 'medidas' },
  { chave: 'busto', rotulo: 'Busto / peito', unidade: 'cm', melhor: 'menos', grupo: 'medidas' },
  { chave: 'braco', rotulo: 'Braço', unidade: 'cm', melhor: 'menos', grupo: 'medidas' },
  { chave: 'coxa', rotulo: 'Coxa', unidade: 'cm', melhor: 'menos', grupo: 'medidas' },
  { chave: 'gordura_pct', rotulo: '% de gordura', unidade: '%', melhor: 'menos', grupo: 'bio' },
  { chave: 'massa_muscular', rotulo: 'Massa muscular', unidade: 'kg', melhor: 'mais', grupo: 'bio' },
]

export type Pose = 'foto_frente' | 'foto_lado' | 'foto_costas'

export const POSES: { chave: Pose; rotulo: string }[] = [
  { chave: 'foto_frente', rotulo: 'Frente' },
  { chave: 'foto_lado', rotulo: 'Lado' },
  { chave: 'foto_costas', rotulo: 'Costas' },
]

export function formatarNumero(n: number | null | undefined, casas = 1): string {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

/** Aceita "65,4" ou "65.4". Vazio vira null. */
export function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(',', '.')
  if (!limpo) return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

/** Primeiro valor preenchido de um campo (ordem crescente de data). */
export function primeiroValor(lista: Medicao[], campo: CampoMedida): number | null {
  for (const m of lista) if (m[campo] !== null) return Number(m[campo])
  return null
}

/** Último valor preenchido de um campo. */
export function ultimoValor(lista: Medicao[], campo: CampoMedida): number | null {
  for (let i = lista.length - 1; i >= 0; i--) if (lista[i][campo] !== null) return Number(lista[i][campo])
  return null
}

export function primeiraFoto(lista: Medicao[], pose: Pose): { caminho: string; dia: string } | null {
  for (const m of lista) if (m[pose]) return { caminho: m[pose]!, dia: m.dia }
  return null
}

export function ultimaFoto(lista: Medicao[], pose: Pose): { caminho: string; dia: string } | null {
  for (let i = lista.length - 1; i >= 0; i--) {
    const m = lista[i]
    if (m[pose]) return { caminho: m[pose]!, dia: m.dia }
  }
  return null
}
