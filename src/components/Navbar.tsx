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
    <nav className='bg-[var(--azul)]'>
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between" >

        <div className="flex items-center gap-1">
          {links.map(link => {
            const ativo = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={ativo ? { backgroundColor: 'var(--verde)', color: 'var(--bege)' } : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 hidden sm:block">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Sair
          </button>
        </div>

      </div>
    </nav>
  )
}