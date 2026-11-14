import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { localRepo, supabaseRepo, type Repo } from './repo'

interface Ctx { user: User | null; repo: Repo; ownerKey: string; loading: boolean; signOut: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null as unknown as Ctx)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!supabase)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<Ctx>(() => ({
    user,
    repo: user && supabase ? supabaseRepo(user.id) : localRepo,
    ownerKey: user?.id ?? 'local',
    loading,
    signOut: async () => { await supabase?.auth.signOut() }
  }), [user, loading])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
