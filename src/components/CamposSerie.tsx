interface CamposSerieProps {
  isCardio: boolean
  carga_kg: string
  repeticoes: string
  duracao_min: string
  distancia_km: string
  quantidade_series: string
  erros: {
    carga_kg: string
    repeticoes: string
    duracao_min: string
    distancia_km: string
  }
  onChange: (campo: string, valor: string) => void
}

export default function CamposSerie({
  isCardio,
  carga_kg,
  repeticoes,
  duracao_min,
  distancia_km,
  quantidade_series,
  erros,
  onChange,
}: CamposSerieProps) {
  if (isCardio) {
    return (
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 w-1/2 sm:flex-1">
          <input
            type="number"
            value={duracao_min}
            onChange={e => onChange('duracao_min', e.target.value)}
            placeholder="Duração (min)"
            className={`w-full bg-fundo border rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul ${
              erros.duracao_min ? 'border-red-500' : 'border-borda'
            }`}
          />
          {erros.duracao_min && <p className="text-xs text-red-400">{erros.duracao_min}</p>}
        </div>
        <div className="flex flex-col gap-1 w-1/2 sm:flex-1">
          <input
            type="number"
            value={distancia_km}
            onChange={e => onChange('distancia_km', e.target.value)}
            placeholder="Distância (km)"
            className={`w-full bg-fundo border rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul ${
              erros.distancia_km ? 'border-red-500' : 'border-borda'
            }`}
          />
          {erros.distancia_km && <p className="text-xs text-red-400">{erros.distancia_km}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-1 w-1/2 sm:flex-1">
        <input
          type="number"
          value={carga_kg}
          onChange={e => onChange('carga_kg', e.target.value)}
          placeholder="Carga (kg)"
          className={`w-full bg-fundo border rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul ${
            erros.carga_kg ? 'border-red-500' : 'border-borda'
          }`}
        />
        {erros.carga_kg && <p className="text-xs text-red-400">{erros.carga_kg}</p>}
      </div>
      <div className="flex flex-col gap-1 w-1/2 sm:flex-1">
        <input
          type="number"
          value={repeticoes}
          onChange={e => onChange('repeticoes', e.target.value)}
          placeholder="Repetições"
          className={`w-full bg-fundo border rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul ${
            erros.repeticoes ? 'border-red-500' : 'border-borda'
          }`}
        />
        {erros.repeticoes && <p className="text-xs text-red-400">{erros.repeticoes}</p>}
      </div>
      <div className="flex flex-col gap-1 w-16 sm:w-20">
        <input
          type="number"
          value={quantidade_series}
          onChange={e => onChange('quantidade_series', e.target.value)}
          placeholder="Séries"
          min="1"
          max="10"
          className="w-full bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
        />
      </div>
    </div>
  )
}