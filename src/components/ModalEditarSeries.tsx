import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ReactDOM from 'react-dom'
import toast from 'react-hot-toast'
import type { Serie, Exercicio } from '../types'

interface ModalEditarSeriesProps {
    exercicio: Exercicio
    series: Serie[]
    onFechar: () => void
    onAtualizar: (seriesAtualizadas: Serie[]) => void
}

export default function ModalEditarSeries({
    exercicio,
    series,
    onFechar,
    onAtualizar,
}: ModalEditarSeriesProps) {
    const isCardio = exercicio.tipo === 'cardio'
    const [seriesEditadas, setSeriesEditadas] = useState(
        [...series].sort((a, b) => a.numero_serie - b.numero_serie)
    )
    const [loading, setLoading] = useState(false)

    function atualizarCampo(id: string, campo: string, valor: string) {
        setSeriesEditadas(prev =>
            prev.map(s => s.id === id ? { ...s, [campo]: valor === '' ? null : Number(valor) } : s)
        )
    }

    async function salvar() {
        setLoading(true)

        const updates = seriesEditadas.map(s =>
            supabase.from('series').update({
                carga_kg: s.carga_kg,
                repeticoes: s.repeticoes,
                duracao_min: s.duracao_min,
                distancia_km: s.distancia_km,
            }).eq('id', s.id)
        )

        const resultados = await Promise.all(updates)

        const erro = resultados.find(r => r.error)

        if (!erro) {
            toast.success('Séries atualizadas!')
            onAtualizar(seriesEditadas)
            onFechar()
        } else {
            toast.error('Erro ao atualizar séries.')
        }

        setLoading(false)
    }

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onFechar}
        >
            <div
                className="bg-card border border-borda rounded-xl p-6 w-full max-w-sm space-y-4 mx-4"
                onClick={e => e.stopPropagation()}
            >
                <div>
                    <h3 className="text-sm font-medium text-texto">{exercicio.nome}</h3>
                    <p className="text-xs text-texto-muted mt-0.5">Editar séries</p>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                    {seriesEditadas.map(serie => (
                        <div key={serie.id} className="bg-fundo border border-borda rounded-lg px-3 py-2">
                            <p className="text-xs text-texto-muted mb-2">Série {serie.numero_serie}</p>
                            {isCardio ? (
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={serie.duracao_min ?? ''}
                                        onChange={e => atualizarCampo(serie.id, 'duracao_min', e.target.value)}
                                        placeholder="Duração (min)"
                                        className="flex-1 bg-card border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
                                    />
                                    <input
                                        type="number"
                                        value={serie.distancia_km ?? ''}
                                        onChange={e => atualizarCampo(serie.id, 'distancia_km', e.target.value)}
                                        placeholder="Distância (km)"
                                        className="flex-1 bg-card border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
                                    />
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <div>
                                        <label className="text-xs text-white mb-1 block">Peso (Kg)</label>
                                        <input
                                            type="number"
                                            value={serie.carga_kg ?? ''}
                                            onChange={e => atualizarCampo(serie.id, 'carga_kg', e.target.value)}
                                            placeholder="Carga (kg)"
                                            className="w-full flex-1 bg-card border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white mb-1 block">Repetições</label>
                                        <input
                                            type="number"
                                            value={serie.repeticoes ?? ''}
                                            onChange={e => atualizarCampo(serie.id, 'repeticoes', e.target.value)}
                                            placeholder="Repetições"
                                            className="w-full flex-1 bg-card border border-borda rounded-lg px-3 py-1.5 text-sm text-texto outline-none focus:border-azul"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={salvar}
                        disabled={loading}
                        className="flex-1 bg-destaque text-fundo rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                        onClick={onFechar}
                        className="flex-1 bg-borda text-texto rounded-lg px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}