import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    if (modo === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        setErro('Email ou senha incorretos.')
      } else if (data.session) {
        navigate('/')
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } }
      })
      if (error) setErro('Erro ao criar conta. Tente novamente.')
      else setErro('Verifique seu email para confirmar o cadastro.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-100">Academia</h1>
          <p className="text-zinc-400 text-sm mt-1">Acompanhe sua evolução</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">

          <div className="flex mb-6 bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setModo('login')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${modo === 'login'
                ? 'bg-zinc-600 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setModo('cadastro')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${modo === 'cadastro'
                ? 'bg-zinc-600 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'cadastro' && (
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                placeholder="••••••••"
              />
            </div>

            {erro && (
              <p className={`text-xs ${erro.includes('Verifique') ? 'text-green-400' : 'text-red-400'}`}>
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-100 text-zinc-900 rounded-lg py-2 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}