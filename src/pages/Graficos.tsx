import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Exercicio } from '../types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

interface PontoGraficoPeso {
  data: string
  peso: number
}

interface PontoGraficoExercicio {
  data: string
  carga: number
}

interface PontoGraficoCardio {
  data: string
  duracao: number
  distancia: number | null
}

export default function Graficos() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [exercicioSelecionado, setExercicioSelecionado] = useState('')
  const [dadosPeso, setDadosPeso] = useState<PontoGraficoPeso[]>([])
  const [dadosExercicio, setDadosExercicio] = useState<PontoGraficoExercicio[]>([])
  const [dadosCardio, setDadosCardio] = useState<PontoGraficoCardio[]>([])
  const [loadingPagina, setLoadingPagina] = useState(true)

  const exercicioAtual = exercicios.find(ex => ex.id === exercicioSelecionado)
  const isCardio = exercicioAtual?.tipo === 'cardio'

  useEffect(() => {
    async function carregar() {
      const [{ data: exs }, { data: pesos }] = await Promise.all([
        supabase.from('exercicios').select('*, grupo_muscular:grupos_musculares(*)').order('nome'),
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
        .order('criado_em')

      if (!series) return

      if (isCardio) {
        const porData: Record<string, { duracao: number, distancia: number | null }> = {}
        series.forEach((s: any) => {
          const data = s.registro?.data
          if (!data) return
          if (!porData[data]) {
            porData[data] = { duracao: s.duracao_min ?? 0, distancia: s.distancia_km }
          } else {
            porData[data].duracao += s.duracao_min ?? 0
          }
        })

        const pontos = Object.entries(porData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([data, { duracao, distancia }]) => ({
            data: new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
            duracao,
            distancia,
          }))

        setDadosCardio(pontos)
      } else {
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
    }

    carregarExercicio()
  }, [exercicioSelecionado, isCardio])

  if (loadingPagina) return <div className="text-texto-muted text-sm">Carregando...</div>

  const tooltipStyle = {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--borda)',
    borderRadius: '8px',
    color: 'var(--texto)',
    fontSize: '12px',
  }

  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-xl font-semibold text-texto">Evolução</h2>
        <p className="text-texto-muted text-sm mt-1">Acompanhe sua progressão ao longo do tempo</p>
      </div>

      {/* Gráfico de peso */}
      <div className="bg-card border border-borda rounded-xl p-5">
        <p className="text-sm font-medium text-texto mb-4">Peso corporal</p>

        {dadosPeso.length < 2 ? (
          <p className="text-texto-muted text-sm text-center py-8">
            Registre pelo menos 2 pesos para ver o gráfico.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosPeso}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" />
              <XAxis dataKey="data" tick={{ fill: 'var(--texto-muted)', fontSize: 11 }} />
              <YAxis
                tick={{ fill: 'var(--texto-muted)', fontSize: 11 }}
                domain={['auto', 'auto']}
                unit="kg"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="var(--destaque)"
                strokeWidth={2}
                dot={{ fill: 'var(--destaque)', r: 3 }}
                activeDot={{ r: 5 }}
                name="Peso (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfico por exercício */}
      <div className="bg-card border border-borda rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-texto">
            {isCardio ? 'Duração por exercício' : 'Carga por exercício'}
          </p>
          <select
            value={exercicioSelecionado}
            onChange={e => {
              setExercicioSelecionado(e.target.value)
              setDadosExercicio([])
              setDadosCardio([])
            }}
            className="bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
          >
            <option value="">Selecione</option>
            {exercicios
              .slice()
              .sort((a, b) => {
                const grupoA = (a as any).grupo_muscular?.nome ?? 'zzz'
                const grupoB = (b as any).grupo_muscular?.nome ?? 'zzz'
                if (grupoA !== grupoB) return grupoA.localeCompare(grupoB)
                return a.nome.localeCompare(b.nome)
              })
              .map(ex => (
                <option key={ex.id} value={ex.id}>
                  {(ex as any).grupo_muscular?.nome ? `${(ex as any).grupo_muscular.nome} - ${ex.nome}` : ex.nome}
                </option>
              ))}
          </select>
        </div>

        {!exercicioSelecionado ? (
          <p className="text-texto-muted text-sm text-center py-8">
            Selecione um exercício para ver a evolução.
          </p>
        ) : isCardio ? (
          dadosCardio.length < 2 ? (
            <p className="text-texto-muted text-sm text-center py-8">
              Registre pelo menos 2 treinos com este exercício para ver o gráfico.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosCardio}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" />
                <XAxis dataKey="data" tick={{ fill: 'var(--texto-muted)', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: 'var(--texto-muted)', fontSize: 11 }}
                  domain={['auto', 'auto']}
                  unit="min"
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="duracao"
                  stroke="var(--azul)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--azul)', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Duração (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          )
        ) : (
          dadosExercicio.length < 2 ? (
            <p className="text-texto-muted text-sm text-center py-8">
              Registre pelo menos 2 treinos com este exercício para ver o gráfico.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosExercicio}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" />
                <XAxis dataKey="data" tick={{ fill: 'var(--texto-muted)', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: 'var(--texto-muted)', fontSize: 11 }}
                  domain={['auto', 'auto']}
                  unit="kg"
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="carga"
                  stroke="var(--destaque)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--destaque)', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Carga máxima (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          )
        )}
      </div>

    </div>
  )
}