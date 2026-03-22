interface CardResumoProps {
  label: string
  valor: string | number
  destaque?: boolean
}

export default function CardResumo({ label, valor, destaque }: CardResumoProps) {
  return (
    <div className="bg-card border border-borda rounded-xl p-4">
      <p className="text-xs text-texto-muted mb-1">{label}</p>
      <p className={`font-semibold text-2xl ${destaque ? 'text-destaque' : 'text-texto'}`}>
        {valor}
      </p>
    </div>
  )
}