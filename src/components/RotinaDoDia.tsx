import { ArrowDown, Check } from "lucide-react";
import { DESCANSO_PADRAO } from "../data/rotinas";
import type { Rotina, ExercicioRotina } from "../data/rotinas";
import type { Exercicio, Serie } from "../types";

interface RotinaDoDiaProps {
  rotina: Rotina;
  exercicios: Exercicio[];
  seriesDoDia: Serie[];
  exercicioSelecionadoId: string;
  onSelecionar: (exercicioId: string, item: ExercicioRotina) => void;
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatar(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

function resumoRealizado(feitas: Serie[], isCardio: boolean) {
  if (feitas.length === 0) return null;

  if (isCardio) {
    const min = feitas.reduce((acc, s) => acc + (s.duracao_min ?? 0), 0);
    const km = feitas.reduce((acc, s) => acc + (s.distancia_km ?? 0), 0);
    return `${formatar(min)} min${km > 0 ? ` · ${formatar(km)} km` : ""}`;
  }

  const reps = feitas.map((s) => s.repeticoes ?? 0);
  const todasIguais = reps.every((r) => r === reps[0]);

  if (todasIguais) return `${feitas.length} × ${reps[0]}`;

  const media = reps.reduce((a, b) => a + b, 0) / reps.length;
  return `${feitas.length} séries · média ${formatar(media)} reps (${reps.join(" / ")})`;
}

export default function RotinaDoDia({
  rotina,
  exercicios,
  seriesDoDia,
  exercicioSelecionadoId,
  onSelecionar,
}: RotinaDoDiaProps) {
  function encontrar(nome: string, match?: string[]) {
    const termos = (match ?? [nome]).map(normalizar);
    return exercicios.find((ex) => {
      const n = normalizar(ex.nome);
      return termos.some((t) => n.includes(t) || t.includes(n));
    });
  }

  return (
    <div className="bg-card border border-borda rounded-xl p-5">
      <div className="mb-4">
        <p className="text-sm font-medium text-texto">{rotina.titulo}</p>
        <p className="text-xs text-texto-muted mt-0.5">
          {rotina.exercicios.length} exercícios · toque para registrar
        </p>
      </div>

      <ol>
        {rotina.exercicios.map((item, i) => {
          const cadastrado = encontrar(item.nome, item.match);
          const feitas = cadastrado
            ? seriesDoDia.filter((s) => s.exercicio_id === cadastrado.id)
            : [];
          const feito = feitas.length > 0;
          const selecionado =
            !!cadastrado && cadastrado.id === exercicioSelecionadoId;
          const ultimo = i === rotina.exercicios.length - 1;
          const realizado = resumoRealizado(
            feitas,
            cadastrado?.tipo === "cardio",
          );

          return (
            <li key={`${item.nome}-${i}`}>
              <button
                type="button"
                disabled={!cadastrado}
                onClick={() => cadastrado && onSelecionar(cadastrado.id, item)}
                className={`w-full flex items-center gap-3 bg-fundo border rounded-xl px-4 py-3 text-left transition-colors ${
                  selecionado ? "border-azul" : "border-borda"
                } ${cadastrado ? "hover:border-azul cursor-pointer" : "opacity-60 cursor-default"}`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    feito ? "bg-destaque text-fundo" : "bg-borda text-texto"
                  }`}
                >
                  {feito ? <Check size={14} /> : i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-texto truncate">
                    {item.nome}
                  </p>
                  <p className="text-xs text-texto-muted mt-0.5">
                    Meta: {item.series}
                    {!cadastrado && " · não cadastrado"}
                  </p>
                  {realizado && (
                    <p className="text-xs text-destaque mt-0.5">
                      Feito: {realizado}
                    </p>
                  )}
                </div>
              </button>

              {!ultimo && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-px h-3 bg-borda" />
                  <div className="w-12 h-12 rounded-full border border-borda bg-card flex items-center justify-center text-[11px] font-medium text-azul">
                    {item.descanso ?? DESCANSO_PADRAO}
                  </div>
                  <div className="w-px h-3 bg-borda" />
                  <ArrowDown size={14} className="text-texto-muted -mt-0.5" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
