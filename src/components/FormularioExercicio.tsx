import type { GrupoMuscular } from '../types'

interface FormularioExercicioProps {
  nome: string
  grupoMuscularId: string
  tipo: 'forca' | 'cardio'
  gruposMusculares: GrupoMuscular[]
  onNomeChange: (valor: string) => void
  onGrupoChange: (valor: string) => void
  onTipoChange: (valor: 'forca' | 'cardio') => void
  onNovoGrupo: () => void
}

export default function FormularioExercicio({
  nome,
  grupoMuscularId,
  tipo,
  gruposMusculares,
  onNomeChange,
  onGrupoChange,
  onTipoChange,
  onNovoGrupo,
}: FormularioExercicioProps) {
  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        <input
          type="text"
          value={nome}
          onChange={e => onNomeChange(e.target.value)}
          placeholder="Nome do exercício"
          className="w-full bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
        />
        <div className="flex gap-2">
          <select
            value={grupoMuscularId}
            onChange={e => e.target.value === '__novo__' ? onNovoGrupo() : onGrupoChange(e.target.value)}
            className="w-1/2 bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
          >
            <option value="">Sem grupo</option>
            {gruposMusculares.map(g => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
            <option value="__novo__" className="text-fundo bg-destaque font-medium">+ Novo grupo</option>
          </select>
          <select
            value={tipo}
            onChange={e => onTipoChange(e.target.value as 'forca' | 'cardio')}
            className="w-1/2 bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
          >
            <option value="forca">Força</option>
            <option value="cardio">Cardio</option>
          </select>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex gap-2">
        <input
          type="text"
          value={nome}
          onChange={e => onNomeChange(e.target.value)}
          placeholder="Nome do exercício"
          className="flex-1 bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
        />
        <select
          value={grupoMuscularId}
          onChange={e => e.target.value === '__novo__' ? onNovoGrupo() : onGrupoChange(e.target.value)}
          className="w-40 bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
        >
          <option value="">Sem grupo</option>
          {gruposMusculares.map(g => (
            <option key={g.id} value={g.id}>{g.nome}</option>
          ))}
          <option value="__novo__" className="text-fundo bg-destaque font-medium">+ Novo grupo</option>
        </select>
        <select
          value={tipo}
          onChange={e => onTipoChange(e.target.value as 'forca' | 'cardio')}
          className="w-28 bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
        >
          <option value="forca">Força</option>
          <option value="cardio">Cardio</option>
        </select>
      </div>
    </>
  )
}