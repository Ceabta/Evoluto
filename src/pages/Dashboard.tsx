import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { RegistroTreino, RegistroPeso } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const [ultimoTreino, setUltimoTreino] = useState<RegistroTreino | null>(null)
  const [ultimoPeso, setUltimoPeso] = useState<RegistroPeso | null>(null)
  const [totalTreinos, setTotalTreinos] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      const [{ data: treino }, { data: peso }, { count }] = await Promise.all([
        supabase
          .from('registros_treino')
          .select('*')
          .order('data', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('registros_peso')
          .select('*')
          .order('data', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('registros_treino')
          .select('*', { count: 'exact', head: true }),
      ])

      setUltimoTreino(treino)
      setUltimoPeso(peso)
      setTotalTreinos(count ?? 0)
      setLoading(false)
    }

    carregar()
  }, [])

  const nome = user?.user_metadata?.nome ?? user?.email

  if (loading) return (
    <div className="text-zinc-500 text-sm">Carregando...</div>
  )

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-zinc-100">
          Olá, {nome} 👋
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total de treinos</p>
          <p className="text-3xl font-semibold text-zinc-100">{totalTreinos}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Último treino</p>
          <p className="text-lg font-semibold text-zinc-100">
            {ultimoTreino
              ? new Date(ultimoTreino.data + 'T00:00:00').toLocaleDateString('pt-BR')
              : '—'}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Último peso</p>
          <p className="text-lg font-semibold text-zinc-100">
            {ultimoPeso ? `${ultimoPeso.peso_kg} kg` : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/treino"
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 transition-colors group"
        >
          <p className="text-sm font-medium text-zinc-100 group-hover:text-white">
            Registrar treino
          </p>
          <p className="text-xs text-zinc-500 mt-1">Adicione os exercícios de hoje</p>
        </Link>

        <Link
          to="/peso"
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 transition-colors group"
        >
          <p className="text-sm font-medium text-zinc-100 group-hover:text-white">
            Registrar peso
          </p>
          <p className="text-xs text-zinc-500 mt-1">Atualize seu peso corporal</p>
        </Link>

        <Link
          to="/historico"
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 transition-colors group"
        >
          <p className="text-sm font-medium text-zinc-100 group-hover:text-white">
            Ver histórico
          </p>
          <p className="text-xs text-zinc-500 mt-1">Seus treinos anteriores</p>
        </Link>

        <Link
          to="/graficos"
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 transition-colors group"
        >
          <p className="text-sm font-medium text-zinc-100 group-hover:text-white">
            Ver evolução
          </p>
          <p className="text-xs text-zinc-500 mt-1">Gráficos de carga e peso</p>
        </Link>
      </div>

    </div>
  )
}