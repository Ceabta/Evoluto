import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, LayoutDashboard, Dumbbell, Weight, History, TrendingUp } from 'lucide-react'

const links = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/treino', label: 'Treino', icon: Dumbbell },
  { path: '/peso', label: 'Peso', icon: Weight },
  { path: '/historico', label: 'Histórico', icon: History },
  { path: '/graficos', label: 'Gráficos', icon: TrendingUp },
]

export default function Navbar() {
  const { signOut, user } = useAuth()
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <>
      <nav className="bg-card border-b border-borda">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Botão hamburguer — só no mobile */}
          <button
            onClick={() => setMenuAberto(true)}
            className="sm:hidden text-texto-muted hover:text-texto transition-colors"
          >
            <Menu size={22} />
          </button>

          {/* Links — só no desktop */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map(link => {
              const ativo = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${ativo
                    ? 'bg-destaque text-fundo font-medium'
                    : 'text-texto-muted hover:text-texto hover:bg-borda'
                    }`}
                >
                  <link.icon size={15} />
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

      {/* Overlay — só no mobile */}
      {menuAberto && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* Menu lateral — só no mobile */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-borda z-50 flex flex-col transition-transform duration-300 sm:hidden ${menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}>

        {/* Header do menu */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-borda">
          <span className="text-sm font-medium text-texto">Menu</span>
          <button
            onClick={() => setMenuAberto(false)}
            className="text-texto-muted hover:text-texto transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-1 p-3 flex-1">
          {links.map(link => {
            const ativo = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${ativo
                    ? 'bg-destaque text-fundo font-medium'
                    : 'text-texto-muted hover:text-texto hover:bg-borda'
                  }`}
              >
                <link.icon size={17} />
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Footer do menu */}
        <div className="p-4 border-t border-borda">
          <p className="text-xs text-texto-muted mb-3 truncate">{user?.email}</p>
          <button
            onClick={signOut}
            className="w-full text-sm text-texto-muted hover:text-texto transition-colors text-left"
          >
            Sair
          </button>
        </div>

      </div>
    </>
  )
}