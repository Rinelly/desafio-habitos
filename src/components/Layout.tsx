import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { TOTAL_DIAS, hoje, numeroDoDia } from '../lib/desafio'
import styles from './Layout.module.scss'

const ABAS = [
  { para: '/', rotulo: 'Hoje', icone: '✅' },
  { para: '/calendario', rotulo: 'Calendário', icone: '📅' },
  { para: '/placar', rotulo: 'Placar', icone: '🏆' },
  { para: '/evolucao', rotulo: 'Evolução', icone: '📏' },
  { para: '/fotos', rotulo: 'Fotos', icone: '📸' },
]

function textoProgresso(): { texto: string; pct: number } {
  const n = numeroDoDia(hoje())
  if (n === 0) return { texto: 'O desafio começa em 23/10', pct: 0 }
  if (n > TOTAL_DIAS) return { texto: 'Desafio concluído! 🎉', pct: 100 }
  return { texto: `Dia ${n} de ${TOTAL_DIAS}`, pct: Math.round((n / TOTAL_DIAS) * 100) }
}

export function Layout() {
  const { eu, sair } = useAuth()
  const { texto, pct } = textoProgresso()

  return (
    <div className={styles.app}>
      <header className={styles.topo}>
        <div className={styles.linha}>
          <div>
            <p className={styles.rotulo}>Desafio 23/10 → 24/12</p>
            <h1 className={styles.titulo}>
              Nelly <span>&</span> Anne
            </h1>
          </div>
          <button className={styles.sair} onClick={sair} title="Sair">
            Olá, {eu?.nome} · Sair
          </button>
        </div>

        <div className={styles.progresso} aria-label={texto}>
          <div className={styles.barra}>
            <div className={styles.preenchido} style={{ width: `${pct}%` }} />
          </div>
          <span>{texto}</span>
        </div>
      </header>

      <main className={styles.conteudo}>
        <Outlet />
      </main>

      <nav className={styles.nav} aria-label="Navegação principal">
        {ABAS.map((aba) => (
          <NavLink
            key={aba.para}
            to={aba.para}
            end={aba.para === '/'}
            className={({ isActive }) => `${styles.aba} ${isActive ? styles.ativa : ''}`}
          >
            <span aria-hidden>{aba.icone}</span>
            {aba.rotulo}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
