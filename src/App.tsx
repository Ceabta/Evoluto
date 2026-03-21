import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Treino from './pages/Treino'
import Peso from './pages/Peso'
import Historico from './pages/Historico'
import Graficos from './pages/Graficos'
import Navbar from './components/Navbar'

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <span className="text-zinc-400 text-sm">Carregando...</span>
    </div>
  )

  return session ? <>{children}</> : <Navigate to="/login" />
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <RotaProtegida>
            <Layout><Dashboard /></Layout>
          </RotaProtegida>
        } />
        <Route path="/treino" element={
          <RotaProtegida>
            <Layout><Treino /></Layout>
          </RotaProtegida>
        } />
        <Route path="/peso" element={
          <RotaProtegida>
            <Layout><Peso /></Layout>
          </RotaProtegida>
        } />
        <Route path="/historico" element={
          <RotaProtegida>
            <Layout><Historico /></Layout>
          </RotaProtegida>
        } />
        <Route path="/graficos" element={
          <RotaProtegida>
            <Layout><Graficos /></Layout>
          </RotaProtegida>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}