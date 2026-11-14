import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Gate, { Stat, pct } from '../components/Gate'
import { byId, statusMap, useAttempts, useClearAttempts } from '../lib/hooks'

const GOOD = '#34d399', BAD = '#f87171', BRAND = '#608cff'

export default function Analytics() {
  const { data: attempts = [] } = useAttempts()
  const clear = useClearAttempts()
  return (
    <Gate>{ds => {
      const map = byId(ds.questions)
      const status = statusMap(attempts)
      const attemptedQ = Object.keys(status).length
      const correctQ = Object.values(status).filter(s => s === 'correct').length
      const totalAttempts = attempts.length
      const correctAttempts = attempts.filter(a => a.is_correct).length
      const marks = attempts.reduce((s, a) => s + Number(a.marks_obtained), 0)

      const topicRows = ds.topics.map(t => {
        const at = attempts.filter(a => map[a.question_id]?.topic_id === t.topic_id)
        const ok = at.filter(a => a.is_correct).length
        return { id: t.topic_id, name: t.topic_name.split(' & ')[0], full: t.topic_name, attempts: at.length, accuracy: pct(ok, at.length) }
      })
      const ranked = topicRows.filter(r => r.attempts >= 3)
      const strong = ranked.filter(r => r.accuracy >= 70), weak = ranked.filter(r => r.accuracy < 50)

      const days: Record<string, { day: string; correct: number; incorrect: number }> = {}
      for (const a of attempts) {
        const d = a.attempted_at.slice(0, 10)
        days[d] ||= { day: d, correct: 0, incorrect: 0 }
        a.is_correct ? days[d].correct++ : days[d].incorrect++
      }
      const timeline = Object.values(days).sort((a, b) => a.day.localeCompare(b.day))
      const history = [...attempts].sort((a, b) => b.attempted_at.localeCompare(a.attempted_at)).slice(0, 30)

      return (
        <div className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="h1">Analytics</h1><p className="text-muted">Computed from your real attempts.</p></div>
            {totalAttempts > 0 && <button className="btn" onClick={() => { if (confirm('Delete all your attempt history? This cannot be undone.')) clear.mutate() }}>Reset progress</button>}
          </div>
          {totalAttempts === 0 ? <div className="card text-center text-muted">No attempts yet. <Link className="text-brand underline" to="/questions">Practice a question</Link> to see analytics.</div> : (<>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Overall accuracy" value={`${pct(correctAttempts, totalAttempts)}%`} sub={`${correctAttempts}/${totalAttempts} attempts`} />
              <Stat label="Unique questions" value={attemptedQ} sub={`${correctQ} currently correct`} />
              <Stat label="Net marks" value={Number(marks.toFixed(2))} sub="uses assumed marks unless set" />
              <Stat label="Mock tests" value={new Set(attempts.filter(a => a.mode === 'mock').map(a => a.attempted_at.slice(0, 16))).size} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="card lg:col-span-2">
                <h2 className="h2 mb-3">Accuracy by topic (%)</h2>
                <div className="h-72"><ResponsiveContainer><BarChart data={topicRows}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} textAnchor="end" /><YAxis domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => `${v}%`} labelFormatter={(_, p) => p?.[0]?.payload?.full} /><Bar dataKey="accuracy" fill={BRAND} radius={[6, 6, 0, 0]} />
                </BarChart></ResponsiveContainer></div>
              </div>
              <div className="card">
                <h2 className="h2 mb-3">Correct vs incorrect</h2>
                <div className="h-72"><ResponsiveContainer><PieChart>
                  <Pie data={[{ name: 'Correct', value: correctQ }, { name: 'Incorrect', value: attemptedQ - correctQ }]} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    <Cell fill={GOOD} /><Cell fill={BAD} />
                  </Pie><Tooltip /><Legend />
                </PieChart></ResponsiveContainer></div>
                <p className="text-center text-xs text-muted">by latest result per question</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card">
                <h2 className="h2 mb-3">Progress over time</h2>
                <div className="h-64"><ResponsiveContainer><LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="correct" stroke={GOOD} strokeWidth={2} /><Line type="monotone" dataKey="incorrect" stroke={BAD} strokeWidth={2} />
                </LineChart></ResponsiveContainer></div>
              </div>
              <div className="card space-y-4">
                <h2 className="h2">Strong & weak topics</h2>
                <p className="text-xs text-muted">Needs at least 3 attempts in a topic. Strong ≥ 70%, weak &lt; 50%.</p>
                <div><div className="mb-1 text-sm font-semibold text-good">Strong</div>{strong.length ? strong.map(r => <div key={r.id} className="text-sm">{r.full} — {r.accuracy}%</div>) : <div className="text-sm text-muted">None yet</div>}</div>
                <div><div className="mb-1 text-sm font-semibold text-bad">Needs work</div>{weak.length ? weak.map(r => <Link key={r.id} to={`/questions?topic=${ds.topics.find(t => t.topic_id === r.id)?.topic_slug}`} className="block text-sm hover:text-brand">{r.full} — {r.accuracy}%</Link>) : <div className="text-sm text-muted">None yet</div>}</div>
              </div>
            </div>

            <div className="card overflow-x-auto">
              <h2 className="h2 mb-3">Attempt history (latest 30)</h2>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase text-muted"><tr><th className="py-2">When</th><th>Question</th><th>Mode</th><th>Your answer</th><th>Result</th><th>Marks</th></tr></thead>
                <tbody>{history.map(a => { const q = map[a.question_id]; return (
                  <tr key={a.id} className="border-t border-line">
                    <td className="py-2 text-muted">{new Date(a.attempted_at).toLocaleString()}</td>
                    <td><Link className="hover:text-brand" to={`/practice/${encodeURIComponent(a.question_id)}`}>{q ? `${q.year} Q${q.question_number}` : a.question_id}</Link></td>
                    <td>{a.mode}</td><td className="font-mono">{a.user_answer}</td>
                    <td className={a.is_correct ? 'text-good' : 'text-bad'}>{a.is_correct ? 'Correct' : 'Incorrect'}</td><td>{Number(a.marks_obtained)}</td>
                  </tr>) })}</tbody>
              </table>
            </div>
          </>)}
        </div>
      )
    }}</Gate>
  )
}
