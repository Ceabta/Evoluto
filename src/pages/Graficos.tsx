import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Exercicio } from '../types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface PontoGraficoPeso {
  data: string
  peso: number
}

interface PontoGraficoExercicio {
  data: string
  carga: number
}

export default function Graficos() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [exercicioSelecionado, setExercicioSelecionado] = useState('')
  const [dadosPeso, setDadosPeso] = useState<PontoGraficoPeso[]>([])
  const [dadosExercicio, setDadosExercicio] = useState<PontoGraficoExercicio[]>([])
  const [loadingPagina, setLoadingPagina] = useState(true)

  useEffect(() => {
    async function carregar() {
      const [{ data: exs }, { data: pesos }] = await Promise.all([
        supabase.from('exercicios').select('*').order('nome'),
        supabase.from('registros_peso').select('*').order('data'),
      ])

      setExercicios(exs ?? [])

      setDadosPeso(
        (pesos ?? []).map(p => ({
          data: new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
          peso: Number(p.peso_kg),
        }))
      )

      setLoadingPagina(false)
    }

    carregar()
  }, [])

  useEffect(() => {
    if (!exercicioSelecionado) return

    async function carregarExercicio() {
      const { data: series } = await supabase
        .from('series')
        .select('*, registro:registros_treino(data)')
        .eq('exercicio_id', exercicioSelecionado)
        .order('numero_serie')

      if (!series) return

      const porData: Record<string, number> = {}
      series.forEach((s: any) => {
        const data = s.registro?.data
        if (!data) return
        if (!porData[data] || s.carga_kg > porData[data]) {
          porData[data] = s.carga_kg
        }
      })

      const pontos = Object.entries(porData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, carga]) => ({
          data: new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
          carga,
        }))

      setDadosExercicio(pontos)
    }

    carregarExercicio()
  }, [exercicioSelecionado])

  if (loadingPagina) return <div className="text-zinc-500 text-sm">Carregando...</div>

  const tooltipStyle = {
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    color: '#f4f4f5',
    fontSize: '12px',
  }

  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Evolução</h2>
        <p className="text-zinc-400 text-sm mt-1">Acompanhe sua progressão ao longo do tempo</p>
      </div>

      {/* Gráfico de peso */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="text-sm font-medium text-zinc-200 mb-4">Peso corporal</p>

        {dadosPeso.length < 2 ? (
          <p className="text-zinc-500 text-sm text-center py-8">
            Registre pelo menos 2 pesos para ver o gráfico.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosPeso}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="data" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                domain={['auto', 'auto']}
                unit="kg"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#a1a1aa"
                strokeWidth={2}
                dot={{ fill: '#a1a1aa', r: 3 }}
                activeDot={{ r: 5 }}
                name="Peso (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfico de carga por exercício */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-zinc-200">Carga por exercício</p>
          <select
            value={exercicioSelecionado}
            onChange={e => setExercicioSelecionado(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          >
            <option value="">Selecione</option>
            {exercicios.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.nome}</option>
            ))}
          </select>
        </div>

        {!exercicioSelecionado ? (
          <p className="text-zinc-500 text-sm text-center py-8">
            Selecione um exercício para ver a evolução de carga.
          </p>
        ) : dadosExercicio.length < 2 ? (
          <p className="text-zinc-500 text-sm text-center py-8">
            Registre pelo menos 2 treinos com este exercício para ver o gráfico.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosExercicio}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="data" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                domain={['auto', 'auto']}
                unit="kg"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="carga"
                stroke="#e4e4e7"
                strokeWidth={2}
                dot={{ fill: '#e4e4e7', r: 3 }}
                activeDot={{ r: 5 }}
                name="Carga máxima (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}