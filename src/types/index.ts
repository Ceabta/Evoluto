export interface Usuario {
  id: string
  nome: string
  email: string
  criado_em: string
}

export interface GrupoMuscular {
  id: string
  nome: string
}

export interface Exercicio {
  id: string
  usuario_id: string
  nome: string
  grupo_muscular_id: string | null
  grupo_muscular?: GrupoMuscular
  tipo: 'forca' | 'cardio'
  criado_em: string
}

export interface RegistroTreino {
  id: string
  usuario_id: string
  data: string
  observacao: string | null
  criado_em: string
}

export interface Serie {
  id: string
  registro_id: string
  exercicio_id: string
  carga_kg: number | null
  repeticoes: number | null
  duracao_min: number | null
  distancia_km: number | null
  numero_serie: number
  criado_em: string
  exercicio?: Exercicio
}

export interface RegistroPeso {
  id: string
  usuario_id: string
  data: string
  peso_kg: number
  criado_em: string
}