export interface Usuario {
  id: string
  nome: string
  email: string
  criado_em: string
}

export interface Exercicio {
  id: string
  usuario_id: string
  nome: string
  grupo_muscular: string | null
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
  carga_kg: number
  repeticoes: number
  numero_serie: number
  exercicio?: Exercicio
}

export interface RegistroPeso {
  id: string
  usuario_id: string
  data: string
  peso_kg: number
  criado_em: string
}