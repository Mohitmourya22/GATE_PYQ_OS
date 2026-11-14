import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Bookmark, BookOpen, Cpu, LayoutDashboard, ListChecks, LogIn, LogOut, Menu, Moon, ShieldAlert, Sun, Timer, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabaseConfigured } from '../lib/supabase'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/questions', label: 'Questions', icon: BookOpen },
  { to: '/topics', label: 'Topics', icon: ListChecks },
  { to: '/mock', label: 'Mock Test', icon: Timer },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/data-notes', label: 'Data notes', icon: ShieldAlert }
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'))
  const { user, signOut } = useAuth()

  const toggleTheme = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('gatepyq:theme', next ? 'dark' : 'light')
    setDark(next)
  }

  const cls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand/15 text-brand' : 'text-muted hover:text-ink hover:bg-raised'}`

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-violet text-white"><Cpu className="h-4 w-4" /></span>
            GATE <span className="text-brand">OS</span> PYQ
          </Link>
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {links.map(l => <NavLink key={l.to} to={l.to} className={cls}><l.icon className="h-4 w-4" />{l.label}</NavLink>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn px-2.5" onClick={toggleTheme} aria-label="Toggle theme">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            {supabaseConfigured && (user
              ? <button className="btn hidden sm:inline-flex" onClick={signOut}><LogOut className="h-4 w-4" />Sign out</button>
              : <Link className="btn hidden sm:inline-flex" to="/login"><LogIn className="h-4 w-4" />Sign in</Link>)}
            <button className="btn px-2.5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
          </div>
        </div>
        {open && (
          <nav className="mx-auto grid max-w-7xl gap-1 px-4 pb-3 lg:hidden" onClick={() => setOpen(false)}>
            {links.map(l => <NavLink key={l.to} to={l.to} className={cls}><l.icon className="h-4 w-4" />{l.label}</NavLink>)}
            {supabaseConfigured && (user
              ? <button className="btn justify-start" onClick={signOut}><LogOut className="h-4 w-4" />Sign out</button>
              : <Link className="btn justify-start" to="/login"><LogIn className="h-4 w-4" />Sign in</Link>)}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8"><Outlet /></main>
      <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted">
        {supabaseConfigured && user ? 'Progress syncs to your account.' : 'Progress is saved in this browser only.'} Question content is shown exactly as supplied; see Data notes for known issues.
      </footer>
    </div>
  )
}
