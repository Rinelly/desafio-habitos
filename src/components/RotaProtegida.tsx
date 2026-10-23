import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Carregando } from './Carregando'
import { AcessoNegado } from '../pages/AcessoNegado'

/** Só deixa passar quem está logada E é participante do desafio. */
export function RotaProtegida() {
  const { session, carregando, eu } = useAuth()

  if (carregando) return <Carregando />
  if (!session) return <Navigate to="/entrar" replace />
  if (!eu) return <AcessoNegado />
  return <Outlet />
}
