import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
        .select('*, series(id)')
        .order('data', { ascending: false })
        .limit(20)

      if (!registros) return setLoadingPagina(false)

      const treinosComSeries = await Promise.all(
        registros.map(async registro => {
          const { data: series } = await supabase
            .from('series')
            .select('*, exercicio:exercicios(*, grupo_muscular:grupos_musculares(*))')
            .eq('registro_id', registro.id)
            .order('criado_em')

          return { ...registro, series: (series as any) ?? [] }
        })
      )

      setTreinos(treinosComSeries)
      setLoadingPagina(false)
    }

    carregar()
  }, [])

  if (loadingPagina) return <div className="text-texto-muted text-sm">Carregando...</div>

  const exerciciosPorTreino = (treino: TreinoComSeries) => {
    return treino.series.reduce<{ exercicio: Exercicio, series: (Serie & { exercicio: Exercicio })[] }[]>((acc, serie) => {
      const existe = acc.find(e => e.exercicio.id === serie.exercicio_id)
      if (existe) {
        existe.series.push(serie)
      } else {
        acc.push({
          exercicio: (serie as any).exercicio,
          series: [serie],
        })
      }
      return acc
    }, [])
  }

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-texto">Histórico</h2>
        <p className="text-texto-muted text-sm mt-1">Seus últimos 20 treinos</p>
      </div>

      {treinos.length === 0 && (
        <p className="text-texto-muted text-sm text-center py-8">
          Nenhum treino registrado ainda.
        </p>
      )}

      <div className="space-y-3">
        {treinos.map(treino => {
          const exercicios = exerciciosPorTreino(treino)
          const estaAberto = aberto === treino.id
          const temSeries = treino.series?.length > 0

          const exerciciosPorGrupo = exercicios.reduce<Record<string, { nome: string, itens: typeof exercicios }>>((acc, item) => {
            const ex = item.exercicio as any
            const chave = ex.grupo_muscular?.nome ?? '__sem_grupo__'
            const nome = ex.grupo_muscular?.nome ?? 'Sem grupo'
            if (!acc[chave]) acc[chave] = { nome, itens: [] }
            acc[chave].itens.push(item)
            return acc
          }, {})

          return (
            <div key={treino.id} className="bg-card border border-borda rounded-xl overflow-hidden">

              <button
                onClick={() => temSeries ? setAberto(estaAberto ? null : treino.id) : null}
                className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${temSeries ? 'hover:bg-fundo cursor-pointer' : 'cursor-default'
                  }`}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-texto">
                    {new Date(treino.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                  </p>
                  <p className="text-xs text-texto-muted mt-0.5">
                    {temSeries
                      ? `${exercicios.length} exercício(s) · ${treino.series.length} série(s)`
                      : 'Treino registrado'
                    }
                  </p>
                </div>
                {temSeries && (
                  estaAberto
                    ? <ChevronUp size={16} className="text-texto-muted" />
                    : <ChevronDown size={16} className="text-texto-muted" />
                )}
              </button>

              {estaAberto && temSeries && (
                <div className="border-t border-borda">
                  {Object.entries(exerciciosPorGrupo).map(([chave, { nome, itens }]) => (
                    <div key={chave}>
                      <div className="flex items-center gap-3 px-5 py-2">
                        <div className="h-px flex-1 bg-borda" />
                        <span className="text-xs font-medium text-destaque uppercase tracking-wider">
                          {nome}
                        </span>
                        <div className="h-px flex-1 bg-borda" />
                      </div>

                      <div className="px-5 pb-3 space-y-3">
                        {itens.map(({ exercicio, series }) => (
                          <div key={exercicio.id} className="bg-fundo border border-borda rounded-xl overflow-hidden">
                            <div className="px-4 py-2 border-b border-borda">
                              <p className="text-sm font-medium text-texto">{exercicio.nome}</p>
                            </div>
                            <div className="divide-y divide-borda">
                              {series.map(serie => (
                                <div key={serie.id} className="flex items-center justify-between px-4 py-2">
                                  <span className="text-xs text-texto-muted">Série {serie.numero_serie}</span>
                                  <span className="text-sm text-texto font-medium">
                                    {serie.carga_kg !== null
                                      ? `${serie.carga_kg}kg × ${serie.repeticoes} reps`
                                      : `${serie.duracao_min}min${serie.distancia_km ? ` · ${serie.distancia_km}km` : ''}`
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {treino.observacao && (
                    <p className="text-xs text-texto-muted px-5 pb-4 italic">{treino.observacao}</p>
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