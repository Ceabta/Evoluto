import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Exercicio, Serie } from '../types'
import ReactDOM from 'react-dom'

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

  const [editandoExercicio, setEditandoExercicio] = useState<Exercicio | null>(null)
  const [confirmandoExercicioId, setConfirmandoExercicioId] = useState<string | null>(null)
  const [mostrarExercicios, setMostrarExercicios] = useState(false)

  useEffect(() => {
    async function inicializar() {
      const { data: exerciciosData } = await supabase
        .from('exercicios')
        .select('*')
        .order('nome')

      setExercicios(exerciciosData ?? [])

      const { data: treino } = await supabase
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

  async function salvarEdicaoExercicio() {
    if (!editandoExercicio) return

    const { error } = await supabase
      .from('exercicios')
      .update({
        nome: editandoExercicio.nome,
        grupo_muscular: editandoExercicio.grupo_muscular
      })
      .eq('id', editandoExercicio.id)

    if (!error) {
      setExercicios(prev =>
        prev.map(ex => ex.id === editandoExercicio.id ? editandoExercicio : ex)
          .sort((a, b) => a.nome.localeCompare(b.nome))
      )
      setEditandoExercicio(null)
      toast.success('Exercício atualizado!')
    } else {
      toast.error('Erro ao atualizar exercício.')
    }
  }

  async function confirmarRemoverExercicio() {
    if (!confirmandoExercicioId) return

    const { error } = await supabase
      .from('exercicios')
      .delete()
      .eq('id', confirmandoExercicioId)

    if (!error) {
      setExercicios(prev => prev.filter(ex => ex.id !== confirmandoExercicioId))
      setConfirmandoExercicioId(null)
      toast.success('Exercício excluído!')
    } else {
      toast.error('Erro ao excluir exercício.')
    }
  }

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

      const { error } = await supabase.from('series').insert({
        registro_id: regId,
        exercicio_id: form.exercicio_id,
        carga_kg: Number(form.carga_kg),
        repeticoes: Number(form.repeticoes),
        numero_serie: numeroSerie,
      })

      if (!error) {
        await carregarSeries(regId)
        setForm(f => ({ ...f, carga_kg: '', repeticoes: '' }))
        toast.success('Série adicionada!')
      } else {
        toast.error('Erro ao adicionar série.')
      }
    } catch (e) {
      toast.error('Erro ao adicionar série.')
    }

    setLoading(false)
  }

  async function removerSerie(id: string) {
    const { error } = await supabase.from('series').delete().eq('id', id)
    if (!error) {
      toast.success('Série removida!')
      if (registroId) await carregarSeries(registroId)
    } else {
      toast.error('Erro ao remover série.')
    }
  }

  async function criarExercicio() {
    if (!novoExercicio.trim()) return

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('exercicios')
      .insert({
        usuario_id: user!.id,
        nome: novoExercicio.trim(),
        grupo_muscular: grupoMuscular || null
      })
      .select()
      .single()

    if (!error && data) {
      setExercicios(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      setForm(f => ({ ...f, exercicio_id: data.id }))
      toast.success('Exercício criado!')
    } else {
      toast.error('Erro ao criar exercício.')
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

  if (loadingPagina) return <div className="text-texto-muted text-sm">Carregando...</div>

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-texto">Treino</h2>
        <p className="text-texto-muted text-sm mt-1">
          {new Date(dataTreino + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Gerenciar exercícios */}
      <div className="bg-card border border-borda rounded-xl overflow-hidden">
        <button
          onClick={() => setMostrarExercicios(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-fundo transition-colors"
        >
          <p className="text-sm font-medium text-texto">Gerenciar exercícios</p>
          <span className="text-texto-muted text-sm">{mostrarExercicios ? '▲' : '▼'}</span>
        </button>

        {mostrarExercicios && (
          <div className="border-t border-borda divide-y divide-borda">

            {/* Botão / formulário novo exercício */}
            <div className="px-5 py-3">
              {mostrarNovoExercicio ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={novoExercicio}
                      onChange={e => setNovoExercicio(e.target.value)}
                      placeholder="Nome do exercício"
                      className="w-1/2 sm:flex-1 bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
                    />
                    <input
                      type="text"
                      value={grupoMuscular}
                      onChange={e => setGrupoMuscular(e.target.value)}
                      placeholder="Grupo muscular"
                      className="w-1/2 sm:w-1/3 bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={criarExercicio}
                      className="w-1/2 px-3 py-1.5 bg-destaque text-fundo rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setMostrarNovoExercicio(false)}
                      className="w-1/2 px-3 py-1.5 bg-borda text-texto rounded-lg text-sm hover:opacity-80 transition-opacity"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setMostrarNovoExercicio(true)}
                  className="w-full px-4 py-2 bg-destaque text-fundo rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  + Novo exercício
                </button>
              )}
            </div>

            {/* Lista de exercícios */}
            {exercicios.length === 0 && (
              <p className="text-texto-muted text-sm text-center py-6">
                Nenhum exercício cadastrado ainda.
              </p>
            )}
            {exercicios.map(ex => (
              <div key={ex.id} className="px-5 py-3">
                {editandoExercicio?.id === ex.id ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editandoExercicio.nome}
                        onChange={e => setEditandoExercicio({ ...editandoExercicio, nome: e.target.value })}
                        className="w-1/2 sm:flex-1 bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
                      />
                      <input
                        type="text"
                        value={editandoExercicio.grupo_muscular ?? ''}
                        onChange={e => setEditandoExercicio({ ...editandoExercicio, grupo_muscular: e.target.value })}
                        placeholder="Grupo muscular"
                        className="w-1/2 sm:w-1/3 bg-fundo border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={salvarEdicaoExercicio}
                        className="w-1/2 px-3 py-1.5 bg-destaque text-fundo rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditandoExercicio(null)}
                        className="w-1/2 px-3 py-1.5 bg-borda text-texto rounded-lg text-sm hover:opacity-80 transition-opacity"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-texto">{ex.nome}</p>
                      {ex.grupo_muscular && (
                        <p className="text-xs text-texto-muted">{ex.grupo_muscular}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-10">
                      <button
                        onClick={() => setEditandoExercicio(ex)}
                        className="text-destaque hover:opacity-75 transition-opacity"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmandoExercicioId(ex.id)}
                        className="text-red-700 hover:opacity-75 transition-opacity"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário */}
      <div className="bg-card border border-borda rounded-xl p-5 space-y-4">
        <p className="text-sm font-medium text-texto">Adicionar série</p>

        <div>
          <label className="text-xs text-texto-muted mb-1 block">Data do treino</label>
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
            className="w-full bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={form.exercicio_id}
            onChange={e => setForm(f => ({ ...f, exercicio_id: e.target.value }))}
            className="flex-1 bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
          >
            <option value="">Selecione o exercício</option>
            {exercicios.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={form.carga_kg}
            onChange={e => setForm(f => ({ ...f, carga_kg: e.target.value }))}
            placeholder="Carga (kg)"
            className="w-1/2 sm:flex-1 bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
          />
          <input
            type="number"
            value={form.repeticoes}
            onChange={e => setForm(f => ({ ...f, repeticoes: e.target.value }))}
            placeholder="Repetições"
            className="w-1/2 sm:flex-1 bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
          />
        </div>
        <div>
          <button
            onClick={adicionarSerie}
            disabled={loading}
            className="w-full px-4 py-2 bg-destaque text-fundo rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '...' : 'Adicionar'}
          </button>
        </div>
      </div>

      {/* Séries agrupadas por exercício */}
      {exerciciosHoje.length > 0 && (
        <div className="space-y-4">
          {exerciciosHoje.map(({ exercicio, series: seriesEx }) => (
            <div key={exercicio.id} className="bg-card border border-borda rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-texto">{exercicio.nome}</p>
                  {exercicio.grupo_muscular && (
                    <p className="text-xs text-texto-muted">{exercicio.grupo_muscular}</p>
                  )}
                </div>
                <span className="text-xs text-texto-muted">{seriesEx.length} série(s)</span>
              </div>

              <div className="space-y-2">
                {seriesEx.map(serie => (
                  <div key={serie.id} className="flex items-center justify-between bg-fundo border border-borda rounded-lg px-3 py-2">
                    <span className="text-xs text-texto-muted">Série {serie.numero_serie}</span>
                    <span className="text-sm text-texto font-medium">
                      {serie.carga_kg}kg × {serie.repeticoes} reps
                    </span>
                    <button
                      onClick={() => removerSerie(serie.id)}
                      className="text-borda hover:text-red-400 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {exerciciosHoje.length === 0 && (
        <p className="text-texto-muted text-sm text-center py-8">
          Nenhuma série registrada nesse dia ainda.
        </p>
      )}

      {confirmandoExercicioId && ReactDOM.createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setConfirmandoExercicioId(null)}
        >
          <div
            className="bg-card border border-borda rounded-xl p-6 w-80 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-texto">Excluir exercício</h3>
            <p className="text-sm text-texto-muted">
              Tem certeza que deseja excluir este exercício? As séries associadas também serão removidas.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmandoExercicioId(null)}
                className="flex-1 bg-borda text-texto rounded-lg px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemoverExercicio}
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