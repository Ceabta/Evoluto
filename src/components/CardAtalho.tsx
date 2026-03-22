import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface CardAtalhoProps {
  to: string
  titulo: string
  descricao: string
  icon: LucideIcon
}

export default function CardAtalho({ to, titulo, descricao, icon: Icon }: CardAtalhoProps) {
  return (
    <Link
      to={to}
      className="bg-card border border-borda hover:border-azul rounded-xl p-5 transition-colors group flex items-start gap-4"
    >
      <div className="bg-fundo border border-borda rounded-lg p-2.5 mt-0.5 group-hover:border-azul transition-colors">
        <Icon size={18} className="text-destaque" />
      </div>
      <div>
        <p className="text-sm font-medium text-texto group-hover:text-destaque transition-colors">
          {titulo}
        </p>
        <p className="text-xs text-texto-muted mt-1">{descricao}</p>
      </div>
    </Link>
  )
}