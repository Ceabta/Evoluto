import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RegistroPeso } from '../types'

export default function Peso() {
  const [registros, setRegistros] = useState<RegistroPeso[]>([])
  const [peso, setPeso] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [loadingPagina, setLoadingPagina] = useState(true)

  useEffect(() => {
    carregarRegistros()
  }, [])

  async function carregarRegistros() {
    const { data } = await supabase
      .from('registros_peso')
      .select('*')
      .order('data', { ascending: false })
      .limit(10)

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
      await carregarRegistros()
    } else {
      console.error(error)
    }

    setLoading(false)
  }

  async function remover(id: string) {
    await supabase.from('registros_peso').delete().eq('id', id)
    await carregarRegistros()
  }

  if (loadingPagina) return <div className="text-zinc-500 text-sm">Carregando...</div>

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Peso corporal</h2>
        <p className="text-zinc-400 text-sm mt-1">Registre seu peso diário</p>
      </div>

      {/* Formulário */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <p className="text-sm font-medium text-zinc-200">Novo registro</p>

        <div className="flex gap-2">
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          />
          <input
            type="number"
            value={peso}
            onChange={e => setPeso(e.target.value)}
            placeholder="Peso (kg)"
            step="0.1"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          />
          <button
            onClick={salvar}
            disabled={loading}
            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Histórico de peso */}
      {registros.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          {registros.map((registro, index) => {
            const anterior = registros[index + 1]
            const diff = anterior ? registro.peso_kg - anterior.peso_kg : null

            return (
              <div key={registro.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-zinc-400">
                  {new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: 'numeric', month: 'short'
                  })}
                </span>
                <div className="flex items-center gap-3">
                  {diff !== null && (
                    <span className={`text-xs ${diff < 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}kg
                    </span>
                  )}
                  <span className="text-sm font-medium text-zinc-100">
                    {registro.peso_kg} kg
                  </span>
                  <button
                    onClick={() => remover(registro.id)}
                    className="text-zinc-600 hover:text-red-400 text-xs transition-colors"
                  >
                    remover
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-zinc-500 text-sm text-center py-8">
          Nenhum registro de peso ainda.
        </p>
      )}

    </div>
  )
}