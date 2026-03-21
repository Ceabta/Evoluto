import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Exercicio, Serie } from '../types'

interface SerieForm {
  exercicio_id: string
  carga_kg: string
  repeticoes: string
}

export default function Treino() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [series, setSeries] = useState<(Serie & { exercicio: Exercicio })[]>([])
  const [dataTreino, setDataTreino] = useState(new Date().toISOString().split('T')[0])
  const [registroId, setRegistroId] = useState<string | null>(null)
  const [form, setForm] = useState<SerieForm>({ exercicio_id: '', carga_kg: '', repeticoes: '' })
  const [novoExercicio, setNovoExercicio] = useState('')
  const [grupoMuscular, setGrupoMuscular] = useState('')
  const [mostrarNovoExercicio, setMostrarNovoExercicio] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPagina, setLoadingPagina] = useState(true)

  useEffect(() => {
    async function inicializar() {
      const { data: exerciciosData } = await supabase
        .from('exercicios')
        .select('*')
        .order('nome')

      setExercicios(exerciciosData ?? [])

      const { data: treino, error } = await supabase
        .from('registros_treino')
        .select('*')
        .eq('data', dataTreino)
        .maybeSingle()

      if (treino) {
        setRegistroId(treino.id)
        await carregarSeries(treino.id)
      }

      setLoadingPagina(false)
    }

    inicializar()
  }, [])

  async function carregarSeries(regId: string) {
    const { data } = await supabase
      .from('series')
      .select('*, exercicio:exercicios(*)')
      .eq('registro_id', regId)
      .order('numero_serie')

    setSeries((data as any) ?? [])
  }

  async function garantirRegistro(): Promise<string> {
    if (registroId) return registroId

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('registros_treino')
      .insert({ usuario_id: user!.id, data: dataTreino })
      .select()
      .single()

    if (error || !data) throw new Error('Erro ao criar registro de treino')
    setRegistroId(data.id)
    return data.id
  }

  async function adicionarSerie() {
    if (!form.exercicio_id || !form.carga_kg || !form.repeticoes) return
    setLoading(true)

    try {
      const regId = await garantirRegistro()

      const numeroSerie = series.filter(s => s.exercicio_id === form.exercicio_id).length + 1

      await supabase.from('series').insert({
        registro_id: regId,
        exercicio_id: form.exercicio_id,
        carga_kg: Number(form.carga_kg),
        repeticoes: Number(form.repeticoes),
        numero_serie: numeroSerie,
      })

      await carregarSeries(regId)
      setForm(f => ({ ...f, carga_kg: '', repeticoes: '' }))
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }

  async function removerSerie(id: string) {
    await supabase.from('series').delete().eq('id', id)
    if (registroId) await carregarSeries(registroId)
  }

  async function criarExercicio() {
    if (!novoExercicio.trim()) return

    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('exercicios')
      .insert({
        usuario_id: user!.id,
        nome: novoExercicio.trim(),
        grupo_muscular: grupoMuscular || null
      })
      .select()
      .single()

    if (data) {
      setExercicios(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      setForm(f => ({ ...f, exercicio_id: data.id }))
    }

    setNovoExercicio('')
    setGrupoMuscular('')
    setMostrarNovoExercicio(false)
  }

  const exerciciosHoje = [...new Set(series.map(s => s.exercicio_id))]
    .map(id => ({
      exercicio: series.find(s => s.exercicio_id === id)!.exercicio,
      series: series.filter(s => s.exercicio_id === id),
    }))

  if (loadingPagina) return <div className="text-zinc-500 text-sm">Carregando...</div>

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Treino de hoje</h2>
        <p className="text-zinc-400 text-sm mt-1">
          {new Date(dataTreino + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Formulário adicionar série */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <p className="text-sm font-medium text-zinc-200">Adicionar série</p>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Data do treino</label>
          <input
            type="date"
            value={dataTreino}
            onChange={async e => {
              setDataTreino(e.target.value)
              setRegistroId(null)
              setSeries([])

              const { data: treino } = await supabase
                .from('registros_treino')
                .select('*')
                .eq('data', e.target.value)
                .maybeSingle()

              if (treino) {
                setRegistroId(treino.id)
                await carregarSeries(treino.id)
              }
            }}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={form.exercicio_id}
            onChange={e => setForm(f => ({ ...f, exercicio_id: e.target.value }))}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          >
            <option value="">Selecione o exercício</option>
            {exercicios.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.nome}</option>
            ))}
          </select>
          <button
            onClick={() => setMostrarNovoExercicio(v => !v)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
          >
            + Novo
          </button>
        </div>

        {mostrarNovoExercicio && (
          <div className="flex gap-2">
            <input
              type="text"
              value={novoExercicio}
              onChange={e => setNovoExercicio(e.target.value)}
              placeholder="Nome do exercício"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            />
            <input
              type="text"
              value={grupoMuscular}
              onChange={e => setGrupoMuscular(e.target.value)}
              placeholder="Grupo muscular"
              className="w-36 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
            />
            <button
              onClick={criarExercicio}
              className="px-3 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Salvar
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            value={form.carga_kg}
            onChange={e => setForm(f => ({ ...f, carga_kg: e.target.value }))}
            placeholder="Carga (kg)"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          />
          <input
            type="number"
            value={form.repeticoes}
            onChange={e => setForm(f => ({ ...f, repeticoes: e.target.value }))}
            placeholder="Repetições"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          />
          <button
            onClick={adicionarSerie}
            disabled={loading}
            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Adicionar'}
          </button>
        </div>
      </div>

      {/* Séries do dia agrupadas por exercício */}
      {exerciciosHoje.length > 0 && (
        <div className="space-y-4">
          {exerciciosHoje.map(({ exercicio, series: seriesEx }) => (
            <div key={exercicio.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{exercicio.nome}</p>
                  {exercicio.grupo_muscular && (
                    <p className="text-xs text-zinc-500">{exercicio.grupo_muscular}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-500">{seriesEx.length} série(s)</span>
              </div>

              <div className="space-y-2">
                {seriesEx.map(serie => (
                  <div key={serie.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                    <span className="text-xs text-zinc-500">Série {serie.numero_serie}</span>
                    <span className="text-sm text-zinc-100">
                      {serie.carga_kg}kg × {serie.repeticoes} reps
                    </span>
                    <button
                      onClick={() => removerSerie(serie.id)}
                      className="text-zinc-600 hover:text-red-400 text-xs transition-colors"
                    >
                      remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {exerciciosHoje.length === 0 && (
        <p className="text-zinc-500 text-sm text-center py-8">
          Nenhuma série registrada hoje ainda.
        </p>
      )}

    </div>
  )
}