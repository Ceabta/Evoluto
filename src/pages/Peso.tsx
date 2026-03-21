import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import ReactDOM from 'react-dom'
import toast from 'react-hot-toast'
import type { RegistroPeso } from '../types'
import { Pencil, X } from 'lucide-react'

export default function Peso() {
  const [registros, setRegistros] = useState<RegistroPeso[]>([])
  const [peso, setPeso] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [loadingPagina, setLoadingPagina] = useState(true)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    carregarRegistros()
  }, [])

  async function carregarRegistros() {
    const { data } = await supabase
      .from('registros_peso')
      .select('*')
      .order('data', { ascending: false })

    setRegistros(data ?? [])
    setLoadingPagina(false)
  }

  async function salvar() {
    if (!peso || !data) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('registros_peso')
      .upsert(
        { usuario_id: user!.id, data, peso_kg: Number(peso) },
        { onConflict: 'usuario_id,data' }
      )

    if (!error) {
      setPeso('')
      setData(new Date().toISOString().split('T')[0])
      setEditandoId(null)
      await carregarRegistros()
      toast.success(editandoId ? 'Registro atualizado!' : 'Peso salvo!')
    } else {
      toast.error('Erro ao salvar. Tente novamente.')
    }

    setLoading(false)
  }

  async function confirmarRemover() {
    if (!confirmandoId) return

    const { error } = await supabase
      .from('registros_peso')
      .delete()
      .eq('id', confirmandoId)

    if (!error) {
      toast.success('Registro excluído!')
    } else {
      toast.error('Erro ao excluir. Tente novamente.')
    }

    setConfirmandoId(null)
    await carregarRegistros()
  }

  async function editar(id: string) {
    const registro = registros.find(r => r.id === id)
    if (!registro) return

    setPeso(registro.peso_kg.toString())
    setData(registro.data)
    setEditandoId(id)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function cancelar() {
    setPeso('')
    setData(new Date().toISOString().split('T')[0])
    setEditandoId(null)
  }

  if (loadingPagina) return <div className="text-zinc-500 text-sm">Carregando...</div>

  const pesoAtual = registros[0]?.peso_kg
  const pesoInicial = registros[registros.length - 1]?.peso_kg
  const variacaoTotal = pesoAtual && pesoInicial ? pesoAtual - pesoInicial : null

  return (
    <div ref={formRef} className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Peso corporal</h2>
        <p className="text-zinc-400 text-sm mt-1">Registre seu peso diário</p>
      </div>

      {/* Cards de resumo */}
      {registros.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-borda rounded-xl p-4">
            <p className="text-xs text-texto-muted mb-1">Atual</p>
            <p className="text-xl font-semibold text-texto">{pesoAtual}kg</p>
          </div>
          <div className="bg-card border border-borda rounded-xl p-4">
            <p className="text-xs text-texto-muted mb-1">Inicial</p>
            <p className="text-xl font-semibold text-texto">{pesoInicial}kg</p>
          </div>
          <div className="bg-card border border-borda rounded-xl p-4">
            <p className="text-xs text-texto-muted mb-1">Variação</p>
            <p className={`text-xl font-semibold ${variacaoTotal === null ? 'text-texto' :
              variacaoTotal < 0 ? 'text-destaque' :
                variacaoTotal > 0 ? 'text-red-400' : 'text-texto'
              }`}>
              {variacaoTotal === null ? '—' : `${variacaoTotal > 0 ? '+' : ''}${variacaoTotal.toFixed(1)}kg`}
            </p>
          </div>
        </div>
      )}

      {/* Formulário */}
      <div className="bg-card border border-borda rounded-xl p-5 space-y-4">
        <p className="text-sm font-medium text-texto">
          {editandoId ? 'Editar registro' : 'Novo registro'}
        </p>
        <div className="flex gap-2">
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="flex-1 bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
          />
          <input
            type="number"
            value={peso}
            onChange={e => setPeso(e.target.value)}
            placeholder="Peso (kg)"
            step="0.1"
            className="flex-1 bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
          />
        </div>
        <div>
          <button
            onClick={salvar}
            disabled={loading}
            className="w-full bg-destaque text-fundo rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '...' : 'Salvar'}
          </button>
        </div>
        {editandoId && (
          <div>
            <button
              onClick={cancelar}
              disabled={loading}
              className="w-full bg-borda text-texto rounded-lg px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Timeline */}
      {registros.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-8">
          Nenhum registro de peso ainda.
        </p>
      ) : (
        <div className="space-y-8">
          {Object.entries(
            registros.reduce((acc, registro) => {
              const chave = registro.data.slice(0, 7)
              if (!acc[chave]) acc[chave] = []
              acc[chave].push(registro)
              return acc
            }, {} as Record<string, typeof registros>)
          ).map(([mes, registrosMes]) => (
            <div key={mes}>

              {/* Cabeçalho do mês */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-borda" />
                <span className="text-xs font-medium text-destaque uppercase tracking-wider">
                  {new Date(mes + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <div className="h-px flex-1 bg-borda" />
              </div>

              {/* Timeline do mês */}
              <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-borda -translate-x-1/2" />

                {registrosMes.map((registro, index) => {
                  const globalIndex = registros.findIndex(r => r.id === registro.id)
                  const anterior = registros[globalIndex + 1]
                  const diff = anterior ? registro.peso_kg - anterior.peso_kg : null
                  const esquerda = globalIndex % 2 === 0

                  const corBolinha =
                    diff === null ? 'bg-zinc-500' :
                      diff < 0 ? 'bg-green-400' :
                        diff > 0 ? 'bg-red-400' : 'bg-zinc-500'

                  return (
                    <div key={registro.id} className={`relative flex mb-6 items-center ${esquerda ? 'flex-row' : 'flex-row-reverse'}`}>

                      {/* Card */}
                      <div className="w-[calc(50%-20px)]">
                        <div className="bg-card border border-borda rounded-xl p-4">
                          <div className='flex items-center justify-between'>
                            <p className="text-xs text-texto-muted">
                              {new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                                weekday: 'short', day: 'numeric'
                              })}
                            </p>
                            <button
                              onClick={() => setConfirmandoId(registro.id)}
                              className="text-red-700 text-xs transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <p className="text-lg font-semibold text-zinc-100 mt-0.5">
                            {registro.peso_kg} kg
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            {diff !== null ? (
                              <span className={`text-sm font-medium ${diff < 0 ? 'text-green-400'
                                : diff > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)}kg
                              </span>
                            ) : <span className='text-sm font-medium text-texto-muted'>-- início --</span>}
                            <button
                              onClick={() => editar(registro.id)}
                              className="text-destaque text-xs transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bolinha central */}
                      <div className="w-10 flex justify-center shrink-0">
                        <div className={`w-3 h-3 rounded-full border-2 border-zinc-950 ${corBolinha}`} />
                      </div>

                      {/* Espaço vazio */}
                      <div className="w-[calc(50%-20px)]" />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmação */}
      {confirmandoId && ReactDOM.createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setConfirmandoId(null)}
        >
          <div
            className="bg-card border border-borda rounded-xl p-6 w-80 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-texto">Excluir registro</h3>
            <p className="text-sm text-texto-muted">
              Tem certeza que deseja excluir este registro de peso? Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmandoId(null)}
                className="flex-1 bg-borda text-texto rounded-lg px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemover}
                className="flex-1 bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}