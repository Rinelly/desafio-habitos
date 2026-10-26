export interface Participante {
  email: string
  nome: string
  cor: string
  user_id: string | null
}

/** 'lembrete' = só para marcar, não conta pontos nem entra no placar */
export type Categoria = 'alimentacao' | 'agua' | 'treino' | 'lembrete'

export interface Meta {
  chave: string
  titulo: string
  categoria: Categoria
  tipo: 'check' | 'quantidade'
  alvo: number | null
  unidade: string | null
  frequencia: 'diaria' | 'semanal'
  meta_semanal: number | null
  ordem: number
  ativa: boolean
}

export type Status = 'cumpriu' | 'falhou'

export interface Registro {
  id: string
  user_id: string
  dia: string
  meta: string
  status: Status
  valor: number | null
  atualizado_em: string
}

export interface Foto {
  id: string
  user_id: string
  dia: string
  caminho: string
  legenda: string | null
  criado_em: string
}

export interface Medicao {
  id: string
  user_id: string
  dia: string
  peso: number | null
  cintura: number | null
  quadril: number | null
  abdomen: number | null
  busto: number | null
  braco: number | null
  coxa: number | null
  gordura_pct: number | null
  massa_muscular: number | null
  foto_frente: string | null
  foto_lado: string | null
  foto_costas: string | null
  observacao: string | null
  criado_em: string
}
