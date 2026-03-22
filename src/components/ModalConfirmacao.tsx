import ReactDOM from 'react-dom'

interface ModalConfirmacaoProps {
  titulo: string
  descricao: string
  textoBotaoConfirmar?: string
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ModalConfirmacao({
  titulo,
  descricao,
  textoBotaoConfirmar = 'Excluir',
  onConfirmar,
  onCancelar,
}: ModalConfirmacaoProps) {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCancelar}
    >
      <div
        className="bg-card border border-borda rounded-xl p-6 w-80 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-texto">{titulo}</h3>
        <p className="text-sm text-texto-muted">{descricao}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            className="flex-1 bg-borda text-texto rounded-lg px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
          >
            {textoBotaoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}