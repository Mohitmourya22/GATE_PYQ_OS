import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Bookmark, CheckCircle2, Circle, Search, XCircle } from 'lucide-react'
import Gate from '../components/Gate'
import BookmarkButton from '../components/BookmarkButton'
import RichText from '../components/RichText'
import { filterQuestions, readFilters, FILTER_KEYS } from '../lib/filter'
import { hasError, marksFor } from '../lib/grading'
import { statusMap, useAttempts, useBookmarks } from '../lib/hooks'

const PAGE = 15

export default function Bank() {
  const [params, setParams] = useSearchParams()
  const { data: attempts } = useAttempts()
  const { data: bms } = useBookmarks()
  const f = readFilters(params)
  const page = Math.max(1, Number(params.get('page') || 1))

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(params)
    v ? n.set(k, v) : n.delete(k)
    if (k !== 'page') n.delete('page')
    setParams(n, { replace: true })
  }
  const reset = () => setParams({}, { replace: true })
  const filtering = FILTER_KEYS.some(k => f[k] && k !== 'sort')

  return (
    <Gate>{ds => {
      const status = statusMap(attempts)
      const bmSet = new Set((bms ?? []).map(b => b.question_id))
      const list = filterQuestions(ds, f, status, bmSet)
      const pages = Math.max(1, Math.ceil(list.length / PAGE))
      const cur = Math.min(page, pages)
      const rows = list.slice((cur - 1) * PAGE, cur * PAGE)
      const years = [...new Set(ds.questions.map(q => q.year))].sort((a, b) => a - b)
      const keep = new URLSearchParams(params); keep.delete('page')

      const Sel = ({ k, label, opts }: { k: string; label: string; opts: [string, string][] }) => (
        <select className="input" value={f[k as keyof typeof f]} onChange={e => set(k, e.target.value)} aria-label={label}>
          <option value="">{label}</option>
          {opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      )

      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="h1">Question bank</h1><p className="text-muted">{list.length} of {ds.questions.length} questions{ds.source === 'local' ? ' · bundled data' : ' · live from Supabase'}</p></div>
            {list.length > 0 && <Link className="btn btn-primary" to={`/practice/${encodeURIComponent(list[0].id)}?${keep}`}>Practice these {list.length}</Link>}
          </div>

          <div className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input className="input pl-9" placeholder="Search question text, subtopic or id…" value={f.q} onChange={e => set('q', e.target.value)} />
            </div>
            <Sel k="topic" label="All topics" opts={ds.topics.map(t => [t.topic_slug, t.topic_name])} />
            <Sel k="year" label="All years" opts={years.map(y => [String(y), String(y)])} />
            <Sel k="type" label="All types" opts={[['MCQ', 'MCQ'], ['MSQ', 'MSQ'], ['NAT', 'NAT']]} />
            <Sel k="diff" label="All difficulties" opts={[['Easy', 'Easy'], ['Medium', 'Medium'], ['Hard', 'Hard']]} />
            <Sel k="status" label="Any status" opts={[['unattempted', 'Unattempted'], ['correct', 'Correct'], ['incorrect', 'Incorrect']]} />
            <Sel k="flag" label="All data quality" opts={[['clean', 'No known issues'], ['flagged', 'Has known issues']]} />
            <Sel k="bm" label="All questions" opts={[['1', 'Bookmarked only']]} />
            <Sel k="sort" label="Sort: year ↑" opts={[['year-desc', 'Year ↓'], ['topic', 'Topic'], ['difficulty', 'Difficulty']]} />
            {filtering && <button className="btn" onClick={reset}>Clear filters</button>}
          </div>

          {rows.length === 0 ? <div className="card text-center text-muted">No questions match these filters.</div> : (
            <div className="space-y-3">
              {rows.map(q => {
                const s = status[q.id] ?? 'unattempted'
                return (
                  <div key={q.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                        {s === 'correct' ? <CheckCircle2 className="h-4 w-4 text-good" /> : s === 'incorrect' ? <XCircle className="h-4 w-4 text-bad" /> : <Circle className="h-4 w-4 text-muted" />}
                        <span className="chip">{q.year} · Q{q.question_number}</span>
                        <span className="chip">{q.question_type}</span>
                        <span className="chip">{q.difficulty}</span>
                        <span className="chip">{q.subtopic}</span>
                        <span className="chip">{marksFor(q)} mark{q.marks == null ? ' (assumed)' : ''}</span>
                        {hasError(q) && <span className="chip border-bad/50 text-bad"><AlertTriangle className="h-3 w-3" />known issue</span>}
                        {bmSet.has(q.id) && <Bookmark className="h-3.5 w-3.5 fill-current text-brand" />}
                      </div>
                      <p className="line-clamp-2 text-sm"><RichText text={q.question} /></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookmarkButton id={q.id} compact />
                      <Link className="btn btn-primary" to={`/practice/${encodeURIComponent(q.id)}?${keep}`}>Practice</Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button className="btn" disabled={cur <= 1} onClick={() => set('page', String(cur - 1))}>Previous</button>
            <span className="text-sm text-muted">Page {cur} of {pages}</span>
            <button className="btn" disabled={cur >= pages} onClick={() => set('page', String(cur + 1))}>Next</button>
          </div>
        </div>
      )
    }}</Gate>
  )
}
