import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Exercicio, Serie, GrupoMuscular } from '../types'
import ModalConfirmacao from '../components/ModalConfirmacao'
import FormularioExercicio from '../components/FormularioExercicio'
import CamposSerie from '../components/CamposSerie'
import ModalEditarSeries from '../components/ModalEditarSeries'
import ReactDOM from 'react-dom'

interface SerieForm {
  exercicio_id: string
  carga_kg: string
  repeticoes: string
  duracao_min: string
  distancia_km: string
  quantidade_series: string
}

export default function Treino() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [gruposMusculares, setGruposMusculares] = useState<GrupoMuscular[]>([])
  const [series, setSeries] = useState<(Serie & { exercicio: Exercicio })[]>([])
  const [novoExercicioTipo, setNovoExercicioTipo] = useState<'forca' | 'cardio'>('forca')
  const [dataTreino, setDataTreino] = useState(new Date().toISOString().split('T')[0])
  const [registroId, setRegistroId] = useState<string | null>(null)
  const [form, setForm] = useState<SerieForm>({
    exercicio_id: '',
    carga_kg: '',
    repeticoes: '',
    duracao_min: '',
    distancia_km: '',
    quantidade_series: '1',
  })
  const [novoExercicio, setNovoExercicio] = useState('')
  const [grupoMuscular, setGrupoMuscular] = useState('')
  const [mostrarNovoExercicio, setMostrarNovoExercicio] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPagina, setLoadingPagina] = useState(true)

  const [editandoExercicio, setEditandoExercicio] = useState<Exercicio | null>(null)
  const [confirmandoExercicioId, setConfirmandoExercicioId] = useState<string | null>(null)
  const [mostrarExercicios, setMostrarExercicios] = useState(false)
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null)
  const [novoGrupo, setNovoGrupo] = useState('')
  const [mostrarNovoGrupo, setMostrarNovoGrupo] = useState(false)
  const [erros, setErros] = useState({ exercicio_id: '', carga_kg: '', repeticoes: '', duracao_min: '', distancia_km: '' })

  const [cardAberto, setCardAberto] = useState<string | null>(null)
  const [editandoSeriesExercicioId, setEditandoSeriesExercicioId] = useState<string | null>(null)
  const [confirmandoRemoverExercicioHoje, setConfirmandoRemoverExercicioHoje] = useState<string | null>(null)
  const [confirmandoRemoverSerie, setConfirmandoRemoverSerie] = useState<string | null>(null)

  const exercicioSelecionado = exercicios.find(ex => ex.id === form.exercicio_id)
  const isCardio = exercicioSelecionado?.tipo === 'cardio'

  useEffect(() => {
    async function inicializar() {
      const { data: exerciciosData } = await supabase
        .from('exercicios')
        .select('*, grupo_muscular:grupos_musculares(*)')
        .order('nome')

      setExercicios(exerciciosData ?? [])

      const { data: treino } = await supabase
        .from('registros_treino')
        .select('*')
        .eq('data', dataTreino)
        .maybeSingle()

      const { data: gruposData } = await supabase
        .from('grupos_musculares')
        .select('*')
        .order('nome')

      setGruposMusculares(gruposData ?? [])

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
    setLoading(true)

    const { error } = await supabase
      .from('exercicios')
      .update({
        nome: editandoExercicio.nome,
        grupo_muscular_id: editandoExercicio.grupo_muscular_id,
        tipo: editandoExercicio.tipo,
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

    setLoading(false)
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
      setConfirmandoExercicioId(null)
      toast.error('Erro ao excluir exercício. Há séries associadas a este exercício. Elas precisam ser removidas primeiro.')
    }
  }

  async function carregarSeries(regId: string) {
    const { data } = await supabase
      .from('series')
      .select('*, exercicio:exercicios(*)')
      .eq('registro_id', regId)
      .order('criado_em')

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
    const novosErros = {
      exercicio_id: !form.exercicio_id ? 'Selecione um exercício.' : '',
      carga_kg: !isCardio && !form.carga_kg ? 'Informe a carga.' : '',
      repeticoes: !isCardio && !form.repeticoes ? 'Informe as repetições.' : '',
      duracao_min: isCardio && !form.duracao_min ? 'Informe a duração.' : '',
      distancia_km: isCardio && !form.distancia_km ? 'Informe uma distância.' : '',
    }

    setErros(novosErros)
    if (Object.values(novosErros).some(e => e !== '')) return

    setLoading(true)

    try {
      const regId = await garantirRegistro()
      const quantidade = Number(form.quantidade_series) || 1
      const seriesExistentes = series.filter(s => s.exercicio_id === form.exercicio_id).length

      const inserts = Array.from({ length: quantidade }, (_, i) => ({
        registro_id: regId,
        exercicio_id: form.exercicio_id,
        numero_serie: seriesExistentes + i + 1,
        carga_kg: isCardio ? null : Number(form.carga_kg),
        repeticoes: isCardio ? null : Number(form.repeticoes),
        duracao_min: isCardio ? Number(form.duracao_min) : null,
        distancia_km: isCardio && form.distancia_km ? Number(form.distancia_km) : null,
      }))

      const { error } = await supabase.from('series').insert(inserts)

      if (!error) {
        await carregarSeries(regId)
        setForm(f => ({ ...f, carga_kg: '', repeticoes: '', duracao_min: '', distancia_km: '', quantidade_series: '1' }))
        setErros({ exercicio_id: '', carga_kg: '', repeticoes: '', duracao_min: '', distancia_km: '' })
        toast.success(quantidade > 1 ? `${quantidade} séries adicionadas!` : 'Série adicionada!')
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

  async function removerSeriesExercicio(exercicioId: string) {
    if (!registroId) return

    const { error } = await supabase
      .from('series')
      .delete()
      .eq('registro_id', registroId)
      .eq('exercicio_id', exercicioId)

    if (!error) {
      toast.success('Exercício removido do treino!')
      await carregarSeries(registroId)
    } else {
      toast.error('Erro ao remover exercício.')
    }

    setConfirmandoRemoverExercicioHoje(null)
  }

  async function criarExercicio() {
    if (!novoExercicio.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('exercicios')
      .insert({
        usuario_id: user!.id,
        nome: novoExercicio.trim(),
        grupo_muscular_id: grupoMuscular || null,
        tipo: novoExercicioTipo,
      })
      .select('*, grupo_muscular:grupos_musculares(*)')
      .single()

    if (!error && data) {
      setExercicios(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      setForm(f => ({ ...f, exercicio_id: data.id }))
      toast.success('Exercício criado!')
    } else {
      toast.error('Erro ao criar exercício.')
    }

    setLoading(false)
    setNovoExercicio('')
    setGrupoMuscular('')
    setMostrarNovoExercicio(false)
  }

  async function criarGrupoMuscular() {
    if (!novoGrupo.trim()) return

    const { data, error } = await supabase
      .from('grupos_musculares')
      .insert({ nome: novoGrupo.trim() })
      .select()
      .single()

    if (!error && data) {
      setGruposMusculares(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      setGrupoMuscular(data.id)
      setNovoGrupo('')
      setMostrarNovoGrupo(false)
      toast.success('Grupo muscular criado!')
    } else {
      toast.error('Erro ao criar grupo muscular.')
    }
  }

  const exerciciosHoje = series.reduce<{ exercicio: Exercicio, series: (Serie & { exercicio: Exercicio })[] }[]>((acc, serie) => {
    const existe = acc.find(e => e.exercicio.id === serie.exercicio_id)
    if (existe) {
      existe.series.push(serie as any)
    } else {
      const exercicioCompleto = exercicios.find(ex => ex.id === serie.exercicio_id) ?? (serie as any).exercicio
      acc.push({
        exercicio: exercicioCompleto,
        series: [serie as any],
      })
    }
    return acc
  }, [])

  const exerciciosPorGrupo = exerciciosHoje.reduce<Record<string, { nome: string, itens: typeof exerciciosHoje }>>((acc, item) => {
    const chave = item.exercicio.grupo_muscular?.nome ?? '__sem_grupo__'
    const nome = item.exercicio.grupo_muscular?.nome ?? 'Sem grupo'
    if (!acc[chave]) acc[chave] = { nome, itens: [] }
    acc[chave].itens.push(item)
    return acc
  }, {})

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

            {/* Formulário novo exercício */}
            <div className="px-5 py-3">
              {mostrarNovoExercicio ? (
                <>
                  <FormularioExercicio
                    nome={novoExercicio}
                    grupoMuscularId={grupoMuscular}
                    tipo={novoExercicioTipo}
                    gruposMusculares={gruposMusculares}
                    onNomeChange={setNovoExercicio}
                    onGrupoChange={setGrupoMuscular}
                    onTipoChange={setNovoExercicioTipo}
                    onNovoGrupo={() => setMostrarNovoGrupo(true)}
                  />

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={criarExercicio}
                      disabled={loading || !novoExercicio.trim()}
                      className={`w-1/2 px-3 py-1.5 text-fundo rounded-lg text-sm font-medium hover:opacity-90 transition-opacity` + (loading || !novoExercicio.trim() ? ' bg-destaque/70' : ' bg-destaque')}
                    >
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => setMostrarNovoExercicio(false)}
                      disabled={loading}
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

            {/* Lista de exercícios agrupada */}
            {gruposMusculares.length === 0 && (
              <p className="text-texto-muted text-sm text-center py-6">
                Nenhum grupo muscular cadastrado ainda.
              </p>
            )}

            {gruposMusculares.map(g => {
              const exerciciosDoGrupo = exercicios.filter(ex => ex.grupo_muscular_id === g.id)
              const estaAberto = grupoAberto === g.id

              return (
                <div key={g.id}>
                  <button
                    onClick={() => setGrupoAberto(estaAberto ? null : g.id)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-fundo transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-destaque">{g.nome}</p>
                      <span className="text-xs text-texto-muted">({exerciciosDoGrupo.length})</span>
                    </div>
                    <span className="text-texto-muted text-sm">{estaAberto ? '▲' : '▼'}</span>
                  </button>

                  {estaAberto && (
                    <div className="divide-y divide-borda border-t border-borda">
                      {exerciciosDoGrupo.length === 0 ? (
                        <p className="text-texto-muted text-sm text-center py-4">
                          Nenhum exercício neste grupo.
                        </p>
                      ) : (
                        exerciciosDoGrupo.map(ex => (
                          <div key={ex.id} className="px-5 py-3">
                            {editandoExercicio?.id === ex.id ? (
                              <>
                                <FormularioExercicio
                                  nome={editandoExercicio.nome}
                                  grupoMuscularId={editandoExercicio.grupo_muscular_id ?? ''}
                                  tipo={editandoExercicio.tipo}
                                  gruposMusculares={gruposMusculares}
                                  onNomeChange={nome => setEditandoExercicio({ ...editandoExercicio, nome })}
                                  onGrupoChange={id => setEditandoExercicio({ ...editandoExercicio, grupo_muscular_id: id })}
                                  onTipoChange={tipo => setEditandoExercicio({ ...editandoExercicio, tipo })}
                                  onNovoGrupo={() => setMostrarNovoGrupo(true)}
                                />

                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={salvarEdicaoExercicio}
                                    disabled={loading || !editandoExercicio.nome.trim()}
                                    className={`w-1/2 px-3 py-1.5 text-fundo rounded-lg text-sm font-medium hover:opacity-90 transition-opacity` + (loading || !editandoExercicio.nome.trim() ? ' bg-destaque/70' : ' bg-destaque')}
                                  >
                                    {loading ? 'Salvando...' : 'Salvar'}
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
                                  <p className="text-sm text-texto truncate">{ex.nome}</p>
                                  <small className="text-xs text-texto-muted">{ex.tipo}</small>
                                </div>

                                <div className="flex items-center gap-4 ml-2">
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
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {exercicios.filter(ex => !ex.grupo_muscular_id).length > 0 && (
              <div>
                <button
                  onClick={() => setGrupoAberto(grupoAberto === '__sem_grupo__' ? null : '__sem_grupo__')}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-fundo transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-texto-muted">Sem grupo</p>
                    <span className="text-xs text-texto-muted">({exercicios.filter(ex => !ex.grupo_muscular_id).length})</span>
                  </div>
                  <span className="text-texto-muted text-sm">{grupoAberto === '__sem_grupo__' ? '▲' : '▼'}</span>
                </button>

                {grupoAberto === '__sem_grupo__' && (
                  <div className="divide-y divide-borda border-t border-borda">
                    {exercicios.filter(ex => !ex.grupo_muscular_id).map(ex => (
                      <div key={ex.id} className="px-5 py-3">
                        {editandoExercicio?.id === ex.id ? (
                          <>
                            <FormularioExercicio
                              nome={editandoExercicio.nome}
                              grupoMuscularId={editandoExercicio.grupo_muscular_id ?? ''}
                              tipo={editandoExercicio.tipo}
                              gruposMusculares={gruposMusculares}
                              onNomeChange={nome => setEditandoExercicio({ ...editandoExercicio, nome })}
                              onGrupoChange={id => setEditandoExercicio({ ...editandoExercicio, grupo_muscular_id: id })}
                              onTipoChange={tipo => setEditandoExercicio({ ...editandoExercicio, tipo })}
                              onNovoGrupo={() => setMostrarNovoGrupo(true)}
                            />

                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={salvarEdicaoExercicio}
                                disabled={loading || !editandoExercicio.nome.trim()}
                                className={`w-1/2 px-3 py-1.5 text-fundo rounded-lg text-sm font-medium hover:opacity-90 transition-opacity` + (loading || !editandoExercicio.nome.trim() ? ' bg-destaque/70' : ' bg-destaque')}
                              >
                                {loading ? 'Salvando...' : 'Salvar'}
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
                              <p className="text-sm text-texto truncate">{ex.nome}</p>
                              <small className="text-xs text-texto-muted">{ex.tipo}</small>
                            </div>
                            <div className="flex items-center gap-4 ml-2">
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
            )}
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

        <div className="flex flex-col gap-1">
          <select
            value={form.exercicio_id}
            onChange={e => {
              setForm(f => ({ ...f, exercicio_id: e.target.value }))
              setErros(e => ({ ...e, exercicio_id: '' }))
            }}
            className={`flex-1 w-full bg-fundo border rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul ${erros.exercicio_id ? 'border-red-500' : 'border-borda'
              }`}
          >
            <option value="">Selecione o exercício</option>
            {exercicios
              .slice()
              .sort((a, b) => {
                const grupoA = a.grupo_muscular?.nome ?? 'zzz'
                const grupoB = b.grupo_muscular?.nome ?? 'zzz'
                if (grupoA !== grupoB) return grupoA.localeCompare(grupoB)
                return a.nome.localeCompare(b.nome)
              })
              .map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.grupo_muscular?.nome ? `${ex.grupo_muscular.nome} - ${ex.nome}` : ex.nome}
                </option>
              ))}
          </select>
          {form.exercicio_id && (() => {
            const qtd = series.filter(s => s.exercicio_id === form.exercicio_id).length
            if (qtd === 0) return null
            return (
              <p className="text-xs text-texto-muted">
                Este exercício já tem <span className="text-destaque">{qtd} série(s)</span> hoje — a nova será adicionada na sequência.
              </p>
            )
          })()}
          {erros.exercicio_id && <p className="text-xs text-red-400">{erros.exercicio_id}</p>}
        </div>

        <CamposSerie
          isCardio={isCardio}
          carga_kg={form.carga_kg}
          repeticoes={form.repeticoes}
          duracao_min={form.duracao_min}
          distancia_km={form.distancia_km}
          quantidade_series={form.quantidade_series}
          erros={erros}
          onChange={(campo, valor) => {
            setForm(f => ({ ...f, [campo]: valor }))
            setErros(e => ({ ...e, [campo]: '' }))
          }}
        />

        <div>
          <button
            onClick={adicionarSerie}
            disabled={loading}
            className={`w-full px-4 py-2 bg-destaque text-fundo rounded-lg text-sm font-medium hover:opacity-90 transition-opacity` + (loading ? ' bg-destaque/70' : '')}
          >
            {loading ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>

      {/* Séries agrupadas por exercício */}

      {Object.entries(exerciciosPorGrupo).length > 0 && (
        <div className="space-y-6">
          {Object.entries(exerciciosPorGrupo).map(([chave, { nome, itens }]) => (
            <div key={chave}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-borda" />
                <span className="text-xs font-medium text-destaque uppercase tracking-wider">
                  {nome}
                </span>
                <div className="h-px flex-1 bg-borda" />
              </div>

              <div className="space-y-3">
                {itens.map(({ exercicio, series: seriesEx }) => {
                  const aberto = cardAberto === exercicio.id

                  return (
                    <div key={exercicio.id} className="bg-card border border-borda rounded-xl overflow-hidden">

                      <button
                        onClick={() => setCardAberto(aberto ? null : exercicio.id)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-fundo transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-texto">{exercicio.nome}</p>
                        </div>
                        {aberto ? (
                          <ChevronUp size={16} className="text-texto-muted" />
                        ) : (
                          <ChevronDown size={16} className="text-texto-muted" />
                        )}
                      </button>

                      {aberto && (
                        <>
                          <div className="divide-y divide-borda border-t border-borda">
                            {seriesEx.map(serie => (
                              <div key={serie.id} className="flex items-center justify-between bg-fundo px-4 py-2">
                                <span className="text-xs text-texto-muted w-16">Série {serie.numero_serie}</span>
                                <span className="text-sm text-texto font-medium">
                                  {serie.carga_kg !== null
                                    ? `${serie.carga_kg}kg × ${serie.repeticoes} reps`
                                    : `${serie.duracao_min}min${serie.distancia_km ? ` · ${serie.distancia_km}km` : ''}`
                                  }
                                </span>
                                <button
                                  onClick={() => setConfirmandoRemoverSerie(serie.id)}
                                  className="text-red-500 transition-colors w-16 flex justify-end"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between px-5 py-3 border-t border-borda">
                            <span className="text-xs text-texto-muted">{seriesEx.length} série(s)</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setEditandoSeriesExercicioId(exercicio.id)}
                                className="flex items-center gap-1.5 text-xs text-destaque hover:opacity-75 transition-opacity"
                              >
                                <Pencil size={13} />
                                Alterar
                              </button>
                              <span className="text-borda">|</span>
                              <button
                                onClick={() => setConfirmandoRemoverExercicioHoje(exercicio.id)}
                                className="flex items-center gap-1.5 text-xs text-red-500 hover:opacity-75 transition-opacity"
                              >
                                <Trash2 size={13} />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
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

      {confirmandoExercicioId && (
        <ModalConfirmacao
          titulo="Excluir exercício"
          descricao="Tem certeza que deseja excluir este exercício? As séries associadas também serão removidas."
          onConfirmar={confirmarRemoverExercicio}
          onCancelar={() => setConfirmandoExercicioId(null)}
        />
      )}

      {confirmandoRemoverExercicioHoje && (
        <ModalConfirmacao
          titulo="Remover do treino"
          descricao="Tem certeza que deseja remover este exercício e todas as suas séries do treino de hoje?"
          onConfirmar={() => removerSeriesExercicio(confirmandoRemoverExercicioHoje)}
          onCancelar={() => setConfirmandoRemoverExercicioHoje(null)}
        />
      )}

      {confirmandoRemoverSerie && (
        <ModalConfirmacao
          titulo="Remover série"
          descricao="Tem certeza que deseja remover esta série?"
          onConfirmar={() => {
            removerSerie(confirmandoRemoverSerie)
            setConfirmandoRemoverSerie(null)
          }}
          onCancelar={() => setConfirmandoRemoverSerie(null)}
        />
      )}

      {editandoSeriesExercicioId && (() => {
        const item = exerciciosHoje.find(e => e.exercicio.id === editandoSeriesExercicioId)
        if (!item) return null
        return (
          <ModalEditarSeries
            exercicio={item.exercicio}
            series={item.series}
            onFechar={() => setEditandoSeriesExercicioId(null)}
            onAtualizar={(seriesAtualizadas) => {
              setSeries(prev =>
                prev.map(s => {
                  const atualizada = seriesAtualizadas.find(sa => sa.id === s.id)
                  return atualizada ? { ...s, ...atualizada } : s
                })
              )
            }}
          />
        )
      })()}

      {mostrarNovoGrupo && ReactDOM.createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMostrarNovoGrupo(false)}
        >
          <div
            className="bg-card border border-borda rounded-xl p-6 w-80 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-texto">Novo grupo muscular</h3>
            <input
              type="text"
              value={novoGrupo}
              onChange={e => setNovoGrupo(e.target.value)}
              placeholder="Nome do grupo"
              className="w-full bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarNovoGrupo(false)}
                className="flex-1 bg-borda text-texto rounded-lg px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Cancelar
              </button>
              <button
                onClick={criarGrupoMuscular}
                className="flex-1 bg-destaque text-fundo rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}