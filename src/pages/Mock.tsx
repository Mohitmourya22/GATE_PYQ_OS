import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Eraser, Flag, Send, Timer } from 'lucide-react'
import Gate, { Stat, pct } from '../components/Gate'
import AnswerInput from '../components/AnswerInput'
import RichText from '../components/RichText'
import Solution, { AuditBanner } from '../components/Solution'
import { grade, hasError, marksAreAssumed, marksFor, negativeFor } from '../lib/grading'
import { useAddAttempts } from '../lib/hooks'
import type { Dataset, Question } from '../lib/types'

interface Session {
  ids: string[]
  answers: Record<string, string>
  marked: string[]
  idx: number
  startedAt: number
  endAt: number
  submitted: boolean
  saved: boolean
  finishedAt?: number
}
const KEY = 'gatepyq:mock'
const load = (): Session | null => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null } }
const persist = (s: Session | null) => (s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY))
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

function Setup({ ds, onStart }: { ds: Dataset; onStart: (s: Session) => void }) {
  const [topics, setTopics] = useState<Set<string>>(new Set(ds.topics.map(t => t.topic_slug)))
  const [count, setCount] = useState(20)
  const [minutes, setMinutes] = useState(36)
  const [includeFlagged, setIncludeFlagged] = useState(false)
  const [random, setRandom] = useState(true)

  const pool = useMemo(() => ds.questions.filter(q => {
    const slug = ds.topics.find(t => t.topic_id === q.topic_id)?.topic_slug ?? ''
    return topics.has(slug) && (includeFlagged || !hasError(q))
  }), [ds, topics, includeFlagged])
  const n = Math.min(count, pool.length)
  const assumed = pool.some(marksAreAssumed)

  const start = () => {
    const picked = (random ? shuffle(pool) : pool).slice(0, n)
    const now = Date.now()
    onStart({ ids: picked.map(q => q.id), answers: {}, marked: [], idx: 0, startedAt: now, endAt: now + minutes * 60_000, submitted: false, saved: false })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div><h1 className="h1">Mock test</h1><p className="text-muted">Build a timed test from the question bank.</p></div>
      <div className="card space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">Topics</span>
            <button className="text-xs text-brand" onClick={() => setTopics(topics.size === ds.topics.length ? new Set() : new Set(ds.topics.map(t => t.topic_slug)))}>{topics.size === ds.topics.length ? 'Clear all' : 'Select all'}</button></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {ds.topics.map(t => (
              <label key={t.topic_id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2 text-sm">
                <input type="checkbox" checked={topics.has(t.topic_slug)} onChange={() => { const s = new Set(topics); s.has(t.topic_slug) ? s.delete(t.topic_slug) : s.add(t.topic_slug); setTopics(s) }} />{t.topic_name}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Number of questions (max {pool.length})
            <input className="input mt-1" type="number" min={1} max={Math.max(1, pool.length)} value={count} onChange={e => { const v = Math.max(1, Number(e.target.value) || 1); setCount(v); setMinutes(Math.max(1, Math.round(Math.min(v, pool.length || v) * 1.8))) }} /></label>
          <label className="text-sm">Duration (minutes)
            <input className="input mt-1" type="number" min={1} value={minutes} onChange={e => setMinutes(Math.max(1, Number(e.target.value) || 1))} /></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={random} onChange={e => setRandom(e.target.checked)} />Shuffle questions</label>
        <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={includeFlagged} onChange={e => setIncludeFlagged(e.target.checked)} />
          <span>Include questions with known data issues <span className="block text-xs text-muted">Off by default: some of these cannot be answered from their text or have conflicting answers. See Data notes.</span></span></label>
        <div className="rounded-xl border border-line bg-raised p-3 text-xs text-muted">
          <b className="text-ink">Marking:</b> MCQ +marks, −⅓ of marks if wrong. MSQ and NAT: no negative marking; MSQ needs the exact option set.
          {assumed && <> The dataset has no per-question marks, so each question is worth <b className="text-ink">1 mark (assumed)</b>.</>}
        </div>
        <button className="btn btn-primary w-full py-3" disabled={n < 1 || minutes < 1} onClick={start}><Timer className="h-4 w-4" />Start test ({n} questions, {minutes} min)</button>
      </div>
    </div>
  )
}

function Run({ ds, s, setS, onSubmit }: { ds: Dataset; s: Session; setS: (s: Session) => void; onSubmit: (s: Session) => void }) {
  const [now, setNow] = useState(Date.now())
  const [confirm, setConfirm] = useState(false)
  const fired = useRef(false)
  const qs = s.ids.map(id => ds.questions.find(q => q.id === id)!).filter(Boolean)
  const q = qs[s.idx]
  const left = Math.max(0, Math.ceil((s.endAt - now) / 1000))

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { if (left === 0 && !fired.current) { fired.current = true; onSubmit(s) } }, [left])

  const update = (p: Partial<Session>) => { const n = { ...s, ...p }; persist(n); setS(n) }
  const answered = qs.filter(x => (s.answers[x.id] ?? '').trim()).length
  const state = (x: Question, i: number) => {
    const a = (s.answers[x.id] ?? '').trim(), m = s.marked.includes(x.id)
    return (i === s.idx ? 'ring-2 ring-brand ' : '') + (m ? 'border-violet bg-violet/20 ' : a ? 'border-good bg-good/15 ' : 'border-line bg-raised ')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div className="card flex items-center justify-between">
          <div className="text-sm text-muted">Question {s.idx + 1} of {qs.length}</div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${left < 300 ? 'text-bad' : ''}`}><Timer className="h-4 w-4" />{fmt(left)}</div>
        </div>
        <div className="card space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="chip">{q.question_type}</span><span className="chip">{q.topic}</span>
            <span className="chip">{marksFor(q)} mark{marksAreAssumed(q) ? ' (assumed)' : ''}{q.question_type === 'MCQ' ? ` · −${negativeFor(q).toFixed(2)}` : ' · no negative'}</span>
          </div>
          {hasError(q) && <AuditBanner q={q} />}
          <p className="text-base leading-relaxed"><RichText text={q.question} /></p>
          <AnswerInput q={q} value={s.answers[q.id] ?? ''} onChange={v => update({ answers: { ...s.answers, [q.id]: v } })} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" disabled={s.idx === 0} onClick={() => update({ idx: s.idx - 1 })}><ArrowLeft className="h-4 w-4" />Previous</button>
          <button className="btn" onClick={() => update({ answers: { ...s.answers, [q.id]: '' } })}><Eraser className="h-4 w-4" />Clear response</button>
          <button className={`btn ${s.marked.includes(q.id) ? 'border-violet text-violet' : ''}`} onClick={() => update({ marked: s.marked.includes(q.id) ? s.marked.filter(x => x !== q.id) : [...s.marked, q.id] })}><Flag className="h-4 w-4" />{s.marked.includes(q.id) ? 'Unmark review' : 'Mark for review'}</button>
          <button className="btn btn-primary ml-auto" disabled={s.idx === qs.length - 1} onClick={() => update({ idx: s.idx + 1 })}>Next<ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold">Question palette</h3>
          <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
            {qs.map((x, i) => <button key={x.id} onClick={() => update({ idx: i })} className={`aspect-square rounded-lg border text-xs font-semibold ${state(x, i)}`}>{i + 1}</button>)}
          </div>
          <ul className="mt-3 space-y-1 text-xs text-muted">
            <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-good/60" />Answered ({answered})</li>
            <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-violet/60" />Marked for review ({s.marked.length})</li>
            <li><span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm border border-line" />Not answered ({qs.length - answered})</li>
          </ul>
        </div>
        <button className="btn btn-primary w-full py-3" onClick={() => setConfirm(true)}><Send className="h-4 w-4" />Submit test</button>
      </aside>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="glass w-full max-w-sm space-y-3 bg-surface p-6">
            <h3 className="h2">Submit test?</h3>
            <p className="text-sm text-muted">Answered {answered} · Not answered {qs.length - answered} · Marked for review {s.marked.length}. You cannot change answers after submitting.</p>
            <div className="flex gap-2"><button className="btn flex-1" onClick={() => setConfirm(false)}>Keep working</button><button className="btn btn-primary flex-1" onClick={() => { fired.current = true; onSubmit(s) }}>Submit</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

function Result({ ds, s, onNew }: { ds: Dataset; s: Session; onNew: () => void }) {
  const [open, setOpen] = useState<string | null>(null)
  const rows = s.ids.map(id => {
    const q = ds.questions.find(x => x.id === id)!
    return { q, a: s.answers[id] ?? '', g: grade(q, s.answers[id]) }
  })
  const correct = rows.filter(r => r.g.correct).length
  const wrong = rows.filter(r => r.g.answered && !r.g.correct).length
  const none = rows.filter(r => !r.g.answered).length
  const score = rows.reduce((t, r) => t + r.g.marks, 0)
  const max = rows.reduce((t, r) => t + marksFor(r.q), 0)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="h1">Test result</h1><p className="text-muted">Time used: {fmt(Math.round(((s.finishedAt ?? s.endAt) - s.startedAt) / 1000))}</p></div>
        <button className="btn btn-primary" onClick={onNew}>New test</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Score" value={`${Number(score.toFixed(2))} / ${Number(max.toFixed(2))}`} sub={`${pct(Math.max(0, score), max)}%`} />
        <Stat label="Correct" value={<span className="text-good">{correct}</span>} />
        <Stat label="Incorrect" value={<span className="text-bad">{wrong}</span>} />
        <Stat label="Unanswered" value={none} />
        <Stat label="Accuracy" value={`${pct(correct, correct + wrong)}%`} sub="of attempted" />
      </div>
      {rows.some(r => marksAreAssumed(r.q)) && <p className="flex items-center gap-2 text-xs text-muted"><AlertTriangle className="h-4 w-4" />Marks are assumed (1 per question) because the dataset has no marks field.</p>}
      <div className="space-y-3">
        {rows.map(({ q, a, g }, i) => (
          <div key={q.id} className="card space-y-3">
            <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(open === q.id ? null : q.id)}>
              <span className="text-sm"><b>Q{i + 1}.</b> <span className="text-muted">{q.year} · {q.subtopic}</span><br /><span className="line-clamp-2"><RichText text={q.question} /></span></span>
              <span className={`shrink-0 text-sm font-semibold ${!g.answered ? 'text-muted' : g.correct ? 'text-good' : 'text-bad'}`}>{!g.answered ? 'Unanswered' : g.correct ? 'Correct' : 'Incorrect'} · {Number(g.marks.toFixed(2))}</span>
            </button>
            {open === q.id && (<>
              <p className="text-sm">Your answer: <span className="font-mono">{a || '—'}</span></p>
              <AuditBanner q={q} />
              <AnswerInput q={q} value={a} onChange={() => {}} disabled showResult />
              <Solution q={q} />
              <Link className="text-xs text-brand underline" to={`/practice/${encodeURIComponent(q.id)}`}>Open in practice mode</Link>
            </>)}
          </div>
        ))}
      </div>
    </div>
  )
}

function MockInner({ ds }: { ds: Dataset }) {
  const [s, setS] = useState<Session | null>(load)
  const add = useAddAttempts()

  const submit = (cur: Session) => {
    const done = { ...cur, submitted: true, saved: true, finishedAt: Math.min(Date.now(), cur.endAt) }
    if (!cur.saved) {
      const per = Math.round((Math.min(Date.now(), cur.endAt) - cur.startedAt) / 1000 / Math.max(1, cur.ids.length))
      const rows = cur.ids.map(id => ds.questions.find(x => x.id === id)!).map(q => ({ q, g: grade(q, cur.answers[q.id]) })).filter(r => r.g.answered)
        .map(({ q, g }) => ({ question_id: q.id, user_answer: (cur.answers[q.id] ?? '').trim(), is_correct: g.correct, marks_obtained: g.marks, time_taken_seconds: per, mode: 'mock' as const }))
      if (rows.length) add.mutate(rows)
    }
    persist(done); setS(done)
  }

  if (!s) return <Setup ds={ds} onStart={n => { persist(n); setS(n) }} />
  if (s.submitted) return <Result ds={ds} s={s} onNew={() => { persist(null); setS(null) }} />
  return <Run ds={ds} s={s} setS={setS} onSubmit={submit} />
}

export default function Mock() { return <Gate>{ds => <MockInner ds={ds} />}</Gate> }
