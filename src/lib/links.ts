// Links temporários das fotos (o bucket é privado).
// O Supabase gera links válidos por 1h; guardamos no cache e reaproveitamos
// enquanto ainda faltam mais de 10 minutos para expirar.
import { gerarLinks } from './api'
import { gravarCache, lerCache } from './cache'

const VALIDADE_MS = 60 * 60 * 1000
const MARGEM_MS = 10 * 60 * 1000

type Guardados = Record<string, { url: string; expira: number }>

/** Prévias locais (blob:) de fotos recém-enviadas — só em memória */
const locais: Record<string, string> = {}

export function registrarPreviaLocal(caminho: string, url: string) {
  locais[caminho] = url
}

/** Links que já estão disponíveis sem ir ao servidor. */
export function linksEmCache(caminhos: string[]): Record<string, string> {
  const guardados = lerCache<Guardados>('links') ?? {}
  const agora = Date.now()
  const saida: Record<string, string> = {}
  for (const c of caminhos) {
    if (locais[c]) saida[c] = locais[c]
    else if (guardados[c] && guardados[c].expira - MARGEM_MS > agora) saida[c] = guardados[c].url
  }
  return saida
}

/** Garante links para todos os caminhos, pedindo ao servidor só os que faltam. */
export async function obterLinks(caminhos: string[]): Promise<Record<string, string>> {
  const prontos = linksEmCache(caminhos)
  const faltando = caminhos.filter((c) => !prontos[c])
  if (!faltando.length) return prontos

  const novos = await gerarLinks(faltando)
  const guardados = lerCache<Guardados>('links') ?? {}
  const agora = Date.now()
  // descarta os vencidos para o cache não crescer sem parar
  for (const [c, v] of Object.entries(guardados)) if (v.expira < agora) delete guardados[c]
  for (const [c, url] of Object.entries(novos)) guardados[c] = { url, expira: agora + VALIDADE_MS }
  gravarCache('links', guardados)
  return { ...prontos, ...novos }
}
