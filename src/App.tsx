import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RotaProtegida } from './components/RotaProtegida'
import { Layout } from './components/Layout'
import { Entrar } from './pages/Entrar'
import { Hoje } from './pages/Hoje'
import { Fotos } from './pages/Fotos'
import { Calendario } from './pages/Calendario'
import { Placar } from './pages/Placar'
import { Evolucao } from './pages/Evolucao'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<Entrar />} />

          <Route element={<RotaProtegida />}>
            <Route element={<Layout />}>
              <Route index element={<Hoje />} />
              <Route path="calendario" element={<Calendario />} />
              <Route path="placar" element={<Placar />} />
              <Route path="evolucao" element={<Evolucao />} />
              <Route path="fotos" element={<Fotos />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
