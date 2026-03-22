import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Dumbbell, Weight, History, TrendingUp } from 'lucide-react'
import CardResumo from '../components/CardResumo'
import CardAtalho from '../components/CardAtalho'
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
          .maybeSingle(),
        supabase
          .from('registros_peso')
          .select('*')
          .order('data', { ascending: false })
          .limit(1)
          .maybeSingle(),
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
    <div className="text-texto-muted text-sm">Carregando...</div>
  )

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-texto">
          Olá, {nome} 👋
        </h2>
        <p className="text-texto-muted text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardResumo
          label="Total de treinos"
          valor={totalTreinos}
          destaque
        />
        <CardResumo
          label="Último treino"
          valor={ultimoTreino
            ? new Date(ultimoTreino.data + 'T00:00:00').toLocaleDateString('pt-BR')
            : '—'}
        />
        <CardResumo
          label="Último peso"
          valor={ultimoPeso ? `${ultimoPeso.peso_kg} kg` : '—'}
        />
      </div>

      <div className="h-px flex-1 bg-borda sm:hidden" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CardAtalho
          to="/treino"
          titulo="Registrar treino"
          descricao="Adicione os exercícios de hoje"
          icon={Dumbbell}
        />
        <CardAtalho
          to="/peso"
          titulo="Registrar peso"
          descricao="Atualize seu peso corporal"
          icon={Weight}
        />
        <CardAtalho
          to="/historico"
          titulo="Ver histórico"
          descricao="Seus treinos anteriores"
          icon={History}
        />
        <CardAtalho
          to="/graficos"
          titulo="Ver evolução"
          descricao="Gráficos de carga e peso"
          icon={TrendingUp}
        />
      </div>

    </div>
  )
}