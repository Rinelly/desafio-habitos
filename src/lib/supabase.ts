import { createClient } from '@supabase/supabase-js'

/**
 * Aceita a URL do projeto mesmo se ela vier com sobras no final,
 * como "/rest/v1/" ou "/" (erro comum ao copiar do painel do Supabase).
 * Ex.: https://abc.supabase.co/rest/v1/  →  https://abc.supabase.co
 */
function limparUrl(url: string): string {
  return url
    .trim()
    .replace(/\/(rest|auth|storage)\/v1\/?.*$/i, '')
    .replace(/\/+$/, '')
}

const urlBruta = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!urlBruta || !anonKey) {
  throw new Error(
    'Faltam as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Crie o arquivo .env a partir do .env.example.',
  )
}

export const supabase = createClient(limparUrl(urlBruta), anonKey)
