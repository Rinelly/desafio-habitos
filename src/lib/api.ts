// Todas as chamadas ao banco ficam aqui, para as telas não falarem direto com o Supabase.
import { supabase } from './supabase'
import type { Foto, Medicao, Meta, Registro, Status } from '../types'

export async function buscarMetas(): Promise<Meta[]> {
  const { data, error } = await supabase
    .from('desafio_metas')
    .select('*')
    .eq('ativa', true)
    .order('ordem')
  if (error) throw error
  return data
}

/**
 * Registros das duas participantes entre dois dias (inclusive).
 * O Supabase devolve no máximo 1000 linhas por vez e o desafio inteiro
 * pode passar disso (2 × 63 dias × 9 metas), então busca em páginas.
 */
export async function buscarRegistros(de: string, ate: string): Promise<Registro[]> {
  const PAGINA = 1000
  const todos: Registro[] = []
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from('desafio_registros')
      .select('*')
      .gte('dia', de)
      .lte('dia', ate)
      .order('id')
      .range(inicio, inicio + PAGINA - 1)
    if (error) throw error
    todos.push(...data)
    if (data.length < PAGINA) return todos
  }
}

/** Cria ou atualiza o registro da usuária logada para (dia, meta). */
export async function salvarRegistro(
  dia: string,
  meta: string,
  status: Status,
  valor: number | null = null,
): Promise<Registro> {
  const { data, error } = await supabase
    .from('desafio_registros')
    .upsert({ dia, meta, status, valor }, { onConflict: 'user_id,dia,meta' })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Volta a meta para "sem registro". */
export async function apagarRegistro(dia: string, meta: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('desafio_registros')
    .delete()
    .match({ dia, meta, user_id: userId })
  if (error) throw error
}

// ---------------------------------------------------------------- fotos

const BUCKET = 'desafio-fotos'

export async function buscarFotos(de: string, ate: string): Promise<Foto[]> {
  const { data, error } = await supabase
    .from('desafio_fotos')
    .select('*')
    .gte('dia', de)
    .lte('dia', ate)
    .order('dia', { ascending: false })
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

/** Envia o arquivo para o Storage e cria o registro da foto. */
export async function enviarFoto(
  dia: string,
  userId: string,
  arquivo: Blob,
  legenda: string,
): Promise<Foto> {
  const ext = arquivo.type === 'image/png' ? 'png' : arquivo.type === 'image/webp' ? 'webp' : 'jpg'
  const caminho = `${userId}/${dia}/${crypto.randomUUID()}.${ext}`

  const envio = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type || 'image/jpeg' })
  if (envio.error) throw envio.error

  const { data, error } = await supabase
    .from('desafio_fotos')
    .insert({ dia, caminho, legenda: legenda.trim() || null })
    .select()
    .single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([caminho]) // não deixa arquivo órfão
    throw error
  }
  return data
}

export async function apagarFoto(foto: Foto): Promise<void> {
  const { error } = await supabase.from('desafio_fotos').delete().eq('id', foto.id)
  if (error) throw error
  await supabase.storage.from(BUCKET).remove([foto.caminho])
}

/** O bucket é privado: gera links temporários (1h) para exibir as fotos. */
export async function gerarLinks(caminhos: string[]): Promise<Record<string, string>> {
  if (!caminhos.length) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(caminhos, 60 * 60)
  if (error) throw error
  const links: Record<string, string> = {}
  for (const item of data) if (item.path && item.signedUrl) links[item.path] = item.signedUrl
  return links
}

// ---------------------------------------------------------------- medidas

export async function buscarMedicoes(): Promise<Medicao[]> {
  const { data, error } = await supabase.from('desafio_medicoes').select('*').order('dia')
  if (error) throw error
  return data
}

/** Sobe uma foto de medida e devolve o caminho no Storage. */
export async function enviarFotoMedida(userId: string, dia: string, pose: string, arquivo: Blob): Promise<string> {
  const caminho = `${userId}/medidas/${dia}-${pose}-${crypto.randomUUID().slice(0, 8)}.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type || 'image/jpeg' })
  if (error) throw error
  return caminho
}

export async function removerArquivos(caminhos: string[]): Promise<void> {
  if (caminhos.length) await supabase.storage.from(BUCKET).remove(caminhos)
}

export type DadosMedicao = Omit<Medicao, 'id' | 'user_id' | 'criado_em'>

/** Cria ou atualiza a medição do dia (uma por pessoa por dia). */
export async function salvarMedicao(dados: DadosMedicao, id?: string): Promise<Medicao> {
  const consulta = id
    ? supabase.from('desafio_medicoes').update(dados).eq('id', id)
    : supabase.from('desafio_medicoes').insert(dados)
  const { data, error } = await consulta.select().single()
  if (error) throw error
  return data
}

export async function apagarMedicao(m: Medicao): Promise<void> {
  const { error } = await supabase.from('desafio_medicoes').delete().eq('id', m.id)
  if (error) throw error
  await removerArquivos([m.foto_frente, m.foto_lado, m.foto_costas].filter((c): c is string => !!c))
}
