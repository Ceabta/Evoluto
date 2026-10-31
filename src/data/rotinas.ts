export interface ExercicioRotina {
  nome: string
  series: string
  match?: string[]
  descanso?: string
}

export interface Rotina {
  titulo: string
  exercicios: ExercicioRotina[]
}

export const DESCANSO_PADRAO = '1 min'

// 0 = domingo ... 2 = terça, 4 = quinta, 6 = sábado
export const ROTINAS: Record<number, Rotina> = {
  2: {
    titulo: 'Treino de terça',
    exercicios: [
      { nome: 'Supino máquina', series: '3 × 10–12' },
      { nome: 'Puxada alta supinada', series: '3 × 10–12', match: ['puxada polia barra supinada'] },
      { nome: 'Remada sentada', series: '3 × 10–12', match: ['remada'] },
      { nome: 'Desenvolvimento com halteres', series: '3 × 10–12', match: ['desenvolvimento'] },
      { nome: 'Elevação lateral', series: '3 × 12–15' },
      { nome: 'Rosca direta', series: '3 × 10–12' },
      { nome: 'Tríceps na polia', series: '3 × 10–12' },
      { nome: 'Abdominal remador', series: '3 × 12–15' },
      { nome: 'Cardio (2 km de esteira)', series: '15–20 min', match: ['esteira'] },
    ],
  },
  4: {
    titulo: 'Treino de quinta',
    exercicios: [
      { nome: 'Agachamento com barra', series: '3 × 10–12', match: ['agachamento'] },
      { nome: 'Avanço alternado', series: '3 × 10–12 por perna', match: ['avanço'] },
      { nome: 'Cadeira flexora', series: '3 × 10–12' },
      { nome: 'Stiff com halteres', series: '3 × 10–12', match: ['stiff'] },
      { nome: 'Mesa flexora', series: '3 × 10–12' },
      { nome: 'Panturrilha', series: '3 × 12–15' },
      { nome: 'Cardio (2 km de elíptico)', series: '15–20 min', match: ['elíptico', 'eliptico'] },
    ],
  },
  6: {
    titulo: 'Treino de sábado',
    exercicios: [
      { nome: 'Supino máquina', series: '2 × 10–12' },
      { nome: 'Puxada alta', series: '2 × 10–12', match: ['puxada polia barra supinada'] },
      { nome: 'Remada', series: '2 × 10–12' },
      { nome: 'Rosca direta', series: '2 × 10–12' },
      { nome: 'Tríceps na polia', series: '2 × 10–12' },
      { nome: 'Agachamento com barra', series: '2 × 10–12', match: ['leg press', 'agachamento'] },
      { nome: 'Cadeira flexora', series: '2 × 10–12', match: ['cadeira flexora'] },
      { nome: 'Panturrilha', series: '2 × 12–15' },
      { nome: 'Cardio (2 km de esteira)', series: '15–20 min', match: ['esteira'] },
    ],
  },
}

export interface AlvoExercicio {
  series?: number
  reps?: number
  duracao?: number
}

/** Extrai os valores mínimos da prescrição. Ex: '2–3 × 10–12' → { series: 2, reps: 10 } */
export function parseAlvo(texto: string): AlvoExercicio {
  const forca = texto.match(/^(\d+)(?:–\d+)?\s*×\s*(\d+)(?:–\d+)?/)
  if (forca) return { series: Number(forca[1]), reps: Number(forca[2]) }

  const cardio = texto.match(/^(\d+)(?:–\d+)?\s*min/)
  if (cardio) return { duracao: Number(cardio[1]) }

  return {}
}