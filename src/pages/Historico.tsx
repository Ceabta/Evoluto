import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RegistroTreino, Serie, Exercicio } from '../types'

interface TreinoComSeries extends RegistroTreino {
  series: (Serie & { exercicio: Exercicio })[]
}

export default function Historico() {
  const [treinos, setTreinos] = useState<TreinoComSeries[]>([])
  const [loadingPagina, setLoadingPagina] = useState(true)
  const [aberto, setAberto] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data: registros } = await supabase
        .from('registros_treino')
        .select('*')
        .order('data', { ascending: false })
        .limit(20)

      if (!registros) return setLoadingPagina(false)

      const treinosComSeries = await Promise.all(
        registros.map(async registro => {
          const { data: series } = await supabase
            .from('series')
            .select('*, exercicio:exercicios(*)')
            .eq('registro_id', registro.id)
            .order('numero_serie')

          return { ...registro, series: (series as any) ?? [] }
        })
      )

      setTreinos(treinosComSeries)
      setLoadingPagina(false)
    }

    carregar()
  }, [])

  if (loadingPagina) return <div className="text-zinc-500 text-sm">Carregando...</div>

  const exerciciosPorTreino = (treino: TreinoComSeries) => {
    const ids = [...new Set(treino.series.map(s => s.exercicio_id))]
    return ids.map(id => ({
      exercicio: treino.series.find(s => s.exercicio_id === id)!.exercicio,
      series: treino.series.filter(s => s.exercicio_id === id),
    }))
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Histórico</h2>
        <p className="text-zinc-400 text-sm mt-1">Seus últimos 20 treinos</p>
      </div>

      {treinos.length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-8">
          Nenhum treino registrado ainda.
        </p>
      )}

      <div className="space-y-3">
        {treinos.map(treino => {
          const exercicios = exerciciosPorTreino(treino)
          const estaAberto = aberto === treino.id

          return (
            <div key={treino.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">

              <button
                onClick={() => setAberto(estaAberto ? null : treino.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-100">
                    {new Date(treino.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {exercicios.length} exercício(s) · {treino.series.length} série(s)
                  </p>
                </div>
                <span className="text-zinc-500 text-sm">
                  {estaAberto ? '▲' : '▼'}
                </span>
              </button>

              {estaAberto && (
                <div className="px-5 pb-4 space-y-3 border-t border-zinc-800 pt-4">
                  {exercicios.map(({ exercicio, series }) => (
                    <div key={exercicio.id}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-zinc-200">{exercicio.nome}</p>
                        {exercicio.grupo_muscular && (
                          <span className="text-xs text-zinc-500">{exercicio.grupo_muscular}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {series.map(serie => (
                          <div key={serie.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                            <span className="text-xs text-zinc-500">Série {serie.numero_serie}</span>
                            <span className="text-sm text-zinc-100">
                              {serie.carga_kg}kg × {serie.repeticoes} reps
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {treino.observacao && (
                    <p className="text-xs text-zinc-400 mt-2 italic">{treino.observacao}</p>
                  )}
                </div>
              )}

            </div>
          )
        })}
      </div>

    </div>
  )
}