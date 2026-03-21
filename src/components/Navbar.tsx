import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  { path: '/', label: 'Dashboard' },
  { path: '/treino', label: 'Treino' },
  { path: '/peso', label: 'Peso' },
  { path: '/historico', label: 'Histórico' },
  { path: '/graficos', label: 'Gráficos' },
]

export default function Navbar() {
  const { signOut, user } = useAuth()
  const location = useLocation()

  return (
    <nav className="bg-card border-b border-borda">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">

        <div className="flex items-center gap-1">
          {links.map(link => {
            const ativo = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  ativo
                    ? 'bg-destaque text-fundo font-medium'
                    : 'text-texto-muted hover:text-texto hover:bg-borda'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-texto-muted hidden sm:block">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            className="text-xs text-texto-muted hover:text-texto transition-colors"
          >
            Sair
          </button>
        </div>

      </div>
    </nav>
  )
}