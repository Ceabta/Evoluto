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
    <div
      className="bg-login min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: 'url(/bg-login.jpg)',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative z-10 w-full max-w-sm">
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(22, 36, 51, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(78, 217, 172, 0.15)',
          }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-texto">Evoluto</h1>
            <p className="text-texto-muted text-sm mt-1">Acompanhe sua evolução</p>
          </div>

          <div className="bg-card border border-borda rounded-xl p-6">

            <div className="flex mb-6 bg-fundo rounded-lg p-1">
              <button
                onClick={() => setModo('login')}
                className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${modo === 'login'
                  ? 'bg-destaque text-fundo font-medium'
                  : 'text-texto-muted hover:text-texto'
                  }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setModo('cadastro')}
                className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${modo === 'cadastro'
                  ? 'bg-destaque text-fundo font-medium'
                  : 'text-texto-muted hover:text-texto'
                  }`}
              >
                Cadastrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modo === 'cadastro' && (
                <div>
                  <label className="text-xs text-texto-muted mb-1 block">Nome</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                    className="w-full bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
                    placeholder="Seu nome"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-texto-muted mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="text-xs text-texto-muted mb-1 block">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  className="w-full bg-fundo border border-borda rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-azul"
                  placeholder="••••••••"
                />
              </div>

              {erro && (
                <p className={`text-xs ${erro.includes('Verifique') ? 'text-destaque' : 'text-red-400'}`}>
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-destaque text-fundo rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}