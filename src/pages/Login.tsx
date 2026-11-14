import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />
  if (!supabaseConfigured) return (
    <div className="card mx-auto max-w-md space-y-2">
      <h1 className="h2">Accounts are not set up</h1>
      <p className="text-sm text-muted">Supabase is not configured, so the app runs offline and saves progress in this browser. Add your keys to <code>.env</code> (see README) to enable sign-in and sync.</p>
      <Link to="/dashboard" className="btn btn-primary">Continue offline</Link>
    </div>
  )

  const run = async (mode: 'in' | 'up') => {
    setBusy(true); setMsg('')
    const { error } = mode === 'in'
      ? await supabase!.auth.signInWithPassword({ email, password })
      : await supabase!.auth.signUp({ email, password })
    setBusy(false)
    setMsg(error ? error.message : mode === 'up' ? 'Account created. If email confirmation is enabled, check your inbox, then sign in.' : '')
  }

  return (
    <form className="card mx-auto max-w-md space-y-3" onSubmit={e => { e.preventDefault(); run('in') }}>
      <h1 className="h2">Sign in</h1>
      <input className="input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="input" type="password" required minLength={6} placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} />
      {msg && <p className="text-sm text-warn">{msg}</p>}
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={busy} type="submit">Sign in</button>
        <button className="btn" disabled={busy} type="button" onClick={() => run('up')}>Create account</button>
      </div>
      <p className="text-xs text-muted">Existing offline progress stays in this browser; it is not auto-merged into your account.</p>
    </form>
  )
}
