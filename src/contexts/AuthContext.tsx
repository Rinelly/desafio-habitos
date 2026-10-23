import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Participante } from '../types'

interface AuthValue {
  session: Session | null
  /** Ainda verificando sessão / participantes */
  carregando: boolean
  /** A participante logada (null se o e-mail não está no desafio) */
  eu: Participante | null
  /** As duas participantes, eu primeiro */
  participantes: Participante[]
  entrar: (email: string, senha: string) => Promise<string | null>
  /** Retorna erro (string) ou null; 'confirmar' quando precisa abrir o link do e-mail */
  criarConta: (email: string, senha: string) => Promise<{ erro: string | null; confirmar: boolean }>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

/** Traduz as mensagens de erro mais comuns do Supabase */
function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (m.includes('already registered')) return 'Esse e-mail já tem conta. Use "Entrar".'
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('rate limit')) return 'Muitas tentativas. Espere alguns minutos e tente de novo.'
  return mensagem
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessaoPronta, setSessaoPronta] = useState(false)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  // id da usuária para quem as participantes já foram carregadas
  const [carregadoPara, setCarregadoPara] = useState<string | null>(null)

  // 1) Sessão: carrega a atual e escuta mudanças (login / logout)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessaoPronta(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // 2) Quando há usuária logada: vincula o user_id e busca as participantes
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let cancelado = false
    ;(async () => {
      await supabase.rpc('desafio_vincular_usuario')
      const { data, error } = await supabase
        .from('desafio_participantes')
        .select('email, nome, cor, user_id')
        .order('nome')
      if (cancelado) return
      if (error) console.error('Erro ao buscar participantes:', error.message)
      setParticipantes(data ?? [])
      setCarregadoPara(userId)
    })()
    return () => {
      cancelado = true
    }
  }, [userId])

  // Só vale a lista carregada para a usuária atual (evita dados de quem saiu)
  const lista = userId && carregadoPara === userId ? participantes : []
  const eu = lista.find((p) => p.user_id === userId) ?? null
  const ordenadas = eu ? [eu, ...lista.filter((p) => p !== eu)] : lista

  const value: AuthValue = {
    session,
    carregando: !sessaoPronta || (!!userId && carregadoPara !== userId),
    eu,
    participantes: ordenadas,
    async entrar(email, senha) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      return error ? traduzirErro(error.message) : null
    },
    async criarConta(email, senha) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) return { erro: traduzirErro(error.message), confirmar: false }
      // O Supabase não dá erro quando o e-mail já existe: devolve um usuário sem "identities"
      if (data.user && data.user.identities?.length === 0) {
        return {
          erro: 'Esse e-mail já tem conta (é a mesma do Foco). Use "Entrar" com a senha de lá ou peça para redefinir a senha.',
          confirmar: false,
        }
      }
      return { erro: null, confirmar: !data.session }
    },
    async sair() {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
