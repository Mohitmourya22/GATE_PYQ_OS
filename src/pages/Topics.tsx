import { Link } from 'react-router-dom'
import Gate, { pct } from '../components/Gate'
import { statusMap, useAttempts } from '../lib/hooks'

export default function Topics() {
  const { data: attempts } = useAttempts()
  const status = statusMap(attempts)
  return (
    <Gate>{ds => (
      <div className="space-y-5">
        <div><h1 className="h1">Topic-wise practice</h1><p className="text-muted">Only topics present in the supplied dataset are listed.</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          {ds.topics.map(t => {
            const qs = ds.questions.filter(q => q.topic_id === t.topic_id)
            const done = qs.filter(q => status[q.id]).length
            const right = qs.filter(q => status[q.id] === 'correct').length
            const next = qs.find(q => !status[q.id]) ?? qs[0]
            return (
              <div key={t.topic_id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="h2">{t.topic_name}</h2><p className="mt-1 text-sm text-muted">{t.description}</p></div>
                  <span className="chip shrink-0">{qs.length} Qs</span>
                </div>
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-raised"><div className="h-full bg-gradient-to-r from-brand to-cyan" style={{ width: `${pct(done, qs.length)}%` }} /></div>
                  <div className="mt-1 text-xs text-muted">{done}/{qs.length} attempted · {right} correct</div>
                </div>
                <div className="flex gap-2">
                  <Link className="btn btn-primary" to={`/practice/${encodeURIComponent(next.id)}?topic=${t.topic_slug}`}>{done ? 'Continue' : 'Start'}</Link>
                  <Link className="btn" to={`/questions?topic=${t.topic_slug}`}>View list</Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )}</Gate>
  )
}
