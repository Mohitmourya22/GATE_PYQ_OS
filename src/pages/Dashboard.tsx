import { Link } from 'react-router-dom'
import Gate, { Stat, pct } from '../components/Gate'
import { byId, statusMap, useAttempts } from '../lib/hooks'

export default function Dashboard() {
  const { data: attempts = [] } = useAttempts()
  return (
    <Gate>{ds => {
      const status = statusMap(attempts)
      const map = byId(ds.questions)
      const attempted = Object.keys(status).length
      const correct = Object.values(status).filter(s => s === 'correct').length
      const incorrect = attempted - correct
      const recent = [...attempts].sort((a, b) => b.attempted_at.localeCompare(a.attempted_at)).slice(0, 8)
      const lastQ = recent[0] && map[recent[0].question_id]
      const nextQ = ds.questions.find(q => !status[q.id])
      return (
        <div className="space-y-8">
          <div><h1 className="h1">Dashboard</h1><p className="text-muted">Based on your latest result for each question.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total questions" value={ds.questions.length} />
            <Stat label="Attempted" value={attempted} sub={`${pct(attempted, ds.questions.length)}% of the bank`} />
            <Stat label="Correct / Incorrect" value={<><span className="text-good">{correct}</span> <span className="text-muted">/</span> <span className="text-bad">{incorrect}</span></>} />
            <Stat label="Accuracy" value={`${pct(correct, attempted)}%`} sub={attempted ? 'of attempted questions' : 'Attempt a question to begin'} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2 space-y-4">
              <h2 className="h2">Topic-wise progress</h2>
              {ds.topics.map(t => {
                const qs = ds.questions.filter(q => q.topic_id === t.topic_id)
                const done = qs.filter(q => status[q.id]).length
                const right = qs.filter(q => status[q.id] === 'correct').length
                return (
                  <div key={t.topic_id}>
                    <div className="mb-1 flex justify-between text-sm"><Link className="hover:text-brand" to={`/questions?topic=${t.topic_slug}`}>{t.topic_name}</Link><span className="text-muted">{done}/{qs.length} · {pct(right, done)}% acc</span></div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-raised">
                      <div className="bg-good" style={{ width: `${pct(right, qs.length)}%` }} />
                      <div className="bg-bad" style={{ width: `${pct(done - right, qs.length)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-6">
              <div className="card space-y-3">
                <h2 className="h2">Continue practicing</h2>
                {nextQ ? <Link className="btn btn-primary w-full" to={`/practice/${encodeURIComponent(nextQ.id)}`}>Next unattempted: {nextQ.year} Q{nextQ.question_number}</Link> : <p className="text-sm text-muted">You have attempted every question.</p>}
                {lastQ && <Link className="btn w-full" to={`/practice/${encodeURIComponent(lastQ.id)}`}>Revisit last: {lastQ.year} Q{lastQ.question_number}</Link>}
                <Link className="btn w-full" to="/mock">Take a mock test</Link>
              </div>
              <div className="card">
                <h2 className="h2 mb-3">Recent activity</h2>
                {recent.length === 0 ? <p className="text-sm text-muted">No attempts yet.</p> : (
                  <ul className="space-y-2 text-sm">
                    {recent.map(a => {
                      const q = map[a.question_id]
                      return (
                        <li key={a.id} className="flex items-center justify-between gap-2">
                          <Link className="truncate hover:text-brand" to={`/practice/${encodeURIComponent(a.question_id)}`}>{q ? `${q.year} Q${q.question_number} · ${q.subtopic}` : a.question_id}</Link>
                          <span className={a.is_correct ? 'text-good' : 'text-bad'}>{a.is_correct ? '✓' : '✗'}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }}</Gate>
  )
}
