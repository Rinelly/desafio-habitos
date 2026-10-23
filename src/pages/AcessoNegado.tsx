import { useAuth } from '../contexts/AuthContext'
import styles from './Pagina.module.scss'

export function AcessoNegado() {
  const { session, sair } = useAuth()
  return (
    <div className={styles.centro}>
      <div className={styles.cartao}>
        <p className={styles.emoji}>🔒</p>
        <h2>Acesso restrito</h2>
        <p>
          O e-mail <strong>{session?.user.email}</strong> não está cadastrado neste desafio.
        </p>
        <button className={styles.botao} onClick={sair}>
          Sair e usar outro e-mail
        </button>
      </div>
    </div>
  )
}
