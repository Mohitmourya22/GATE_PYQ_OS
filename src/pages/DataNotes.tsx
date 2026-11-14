import { Link } from 'react-router-dom'
import Gate from '../components/Gate'
import type { Severity } from '../lib/types'

const tone: Record<Severity, string> = { error: 'text-bad', warning: 'text-warn', info: 'text-muted' }

export default function DataNotes() {
  return (
    <Gate>{ds => {
      const groups: Record<string, { severity: Severity; message: string; ids: string[] }> = {}
      for (const q of ds.questions) for (const f of q.audit_flags) {
        groups[f.code] ||= { severity: f.severity, message: f.message, ids: [] }
        groups[f.code].ids.push(q.id)
      }
      const order: Severity[] = ['error', 'warning', 'info']
      const rows = Object.entries(groups).sort((a, b) => order.indexOf(a[1].severity) - order.indexOf(b[1].severity))
      const errored = ds.questions.filter(q => q.audit_flags.some(f => f.severity === 'error')).length
      return (
        <div className="space-y-6">
          <div>
            <h1 className="h1">Data notes</h1>
            <p className="mt-2 max-w-3xl text-muted">All {ds.questions.length} questions are included exactly as supplied. A validation script found problems in the source data; they are labelled rather than silently fixed or hidden. <b className="text-ink">{errored}</b> questions have at least one error-level issue (excluded from mock tests by default).</p>
          </div>
          {rows.map(([code, g]) => (
            <details key={code} className="card">
              <summary className="cursor-pointer list-none">
                <span className={`font-mono text-sm font-bold ${tone[g.severity]}`}>{code}</span>
                <span className="ml-2 chip">{g.severity}</span><span className="ml-2 chip">{g.ids.length} questions</span>
                <p className="mt-1 text-sm text-muted">{g.message}</p>
              </summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.ids.map(id => <Link key={id} className="chip hover:border-brand" to={`/practice/${encodeURIComponent(id)}`}>{id}</Link>)}
              </div>
            </details>
          ))}
          <p className="text-sm text-muted">Details of each check are in <code>reports/data-audit.md</code> in the project.</p>
        </div>
      )
    }}</Gate>
  )
}
