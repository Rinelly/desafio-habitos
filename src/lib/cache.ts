// Cache simples: memória + localStorage.
// Ideia ("stale-while-revalidate"): a tela abre na hora com o que já foi
// carregado antes e, em paralelo, busca a versão nova no Supabase.

const PREFIXO = 'desafio:v1:'
const memoria = new Map<string, unknown>()

export function lerCache<T>(chave: string): T | undefined {
  if (memoria.has(chave)) return memoria.get(chave) as T
  try {
    const bruto = localStorage.getItem(PREFIXO + chave)
    if (bruto !== null) {
      const valor = JSON.parse(bruto) as T
      memoria.set(chave, valor)
      return valor
    }
  } catch {
    // localStorage indisponível (aba anônima etc.) — segue só com memória
  }
  return undefined
}

export function gravarCache<T>(chave: string, valor: T): void {
  memoria.set(chave, valor)
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor))
  } catch {
    // cheio ou indisponível: tudo bem, é só cache
  }
}

/** Limpa tudo (usado ao sair da conta). */
export function limparCache(): void {
  memoria.clear()
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith(PREFIXO)) localStorage.removeItem(k)
    }
  } catch {
    // ignora
  }
}
