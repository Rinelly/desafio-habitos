import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styles from './Entrar.module.scss'

type Modo = 'entrar' | 'criar'

export function Entrar() {
  const { session, entrar, criarConta } = useAuth()
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  if (session) return <Navigate to="/" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setAviso(null)
    setEnviando(true)
    if (modo === 'entrar') {
      const falha = await entrar(email, senha)
      setEnviando(false)
      if (falha) setErro(falha)
      return
    }
    const { erro: falha, confirmar } = await criarConta(email, senha)
    setEnviando(false)
    if (falha) return setErro(falha)
    if (confirmar) {
      setAviso('Conta criada! Abra o link de confirmação enviado para o seu e-mail e depois entre aqui.')
      setModo('entrar')
    }
    // Sem confirmação: a sessão já vem pronta e o app entra sozinho
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cartao}>
        <p className={styles.rotulo}>Desafio 23/10 → 24/12</p>
        <h1 className={styles.titulo}>
          Nelly <span>&</span> Anne
        </h1>
        <p className={styles.sub}>63 dias de hábitos melhores. Bora? 💜</p>

        <div className={styles.abas} role="tablist">
          <button
            role="tab"
            aria-selected={modo === 'entrar'}
            className={modo === 'entrar' ? styles.ativa : ''}
            onClick={() => setModo('entrar')}
          >
            Entrar
          </button>
          <button
            role="tab"
            aria-selected={modo === 'criar'}
            className={modo === 'criar' ? styles.ativa : ''}
            onClick={() => setModo('criar')}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={enviar} className={styles.form}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </label>

          {erro && <p className={styles.erro}>{erro}</p>}
          {aviso && <p className={styles.aviso}>{aviso}</p>}

          <button type="submit" className={styles.botao} disabled={enviando}>
            {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className={styles.dica}>
          {modo === 'entrar'
            ? 'Já usa o Foco? Entre com a mesma conta.'
            : 'Use o mesmo e-mail cadastrado no desafio.'}
        </p>
      </div>
    </div>
  )
}
