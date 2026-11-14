import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, RotateCcw, XCircle } from 'lucide-react'
import Gate from '../components/Gate'
import AnswerInput from '../components/AnswerInput'
import BookmarkButton from '../components/BookmarkButton'
import RichText from '../components/RichText'
import Solution, { AuditBanner } from '../components/Solution'
import { filterQuestions, readFilters } from '../lib/filter'
import { grade, marksAreAssumed, marksFor, negativeFor } from '../lib/grading'
import { statusMap, useAddAttempts, useAttempts, useBookmarks } from '../lib/hooks'
import type { Question } from '../lib/types'

function PracticeQuestion({ q, prev, next, position }: { q: Question; prev?: string; next?: string; position: string }) {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const add = useAddAttempts()
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<ReturnType<typeof grade> | null>(null)
  const [reveal, setReveal] = useState(false)
  const start = useRef(Date.now())

  useEffect(() => { setAnswer(''); setResult(null); setReveal(false); start.current = Date.now() }, [q.id])

  const submit = () => {
    const r = grade(q, answer)
    if (!r.answered) return
    setResult(r)
    add.mutate([{ question_id: q.id, user_answer: answer.trim(), is_correct: r.correct, marks_obtained: r.marks, time_taken_seconds: Math.round((Date.now() - start.current) / 1000), mode: 'practice' }])
  }
  const go = (id?: string) => id && nav(`/practice/${encodeURIComponent(id)}?${params}`)
  const showSolution = result !== null || reveal

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between text-sm">
        <Link to={`/questions?${params}`} className="flex items-center gap-1 text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" />Back to list</Link>
        <span className="text-muted">{position}</span>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="chip">GATE {q.year} · Q{q.question_number}</span>
          <span className="chip">{q.topic}</span>
          <span className="chip">{q.subtopic}</span>
          <span className="chip">{q.question_type}</span>
          <span className="chip">{q.difficulty}</span>
          <span className="chip">{marksFor(q)} mark{marksAreAssumed(q) ? ' (assumed)' : ''}{q.question_type === 'MCQ' ? ` · −${negativeFor(q).toFixed(2)} if wrong` : ' · no negative'}</span>
        </div>
        <AuditBanner q={q} />
        <p className="text-base leading-relaxed"><RichText text={q.question} /></p>
        <AnswerInput q={q} value={answer} onChange={setAnswer} disabled={result !== null} showResult={result !== null} />

        <div className="flex flex-wrap items-center gap-2">
          {result === null
            ? <button className="btn btn-primary" onClick={submit} disabled={!answer.trim()}>Submit answer</button>
            : <button className="btn" onClick={() => { setAnswer(''); setResult(null); setReveal(false); start.current = Date.now() }}><RotateCcw className="h-4 w-4" />Try again</button>}
          {result === null && !reveal && <button className="btn" onClick={() => setReveal(true)}><Eye className="h-4 w-4" />Reveal solution</button>}
          <div className="ml-auto"><BookmarkButton id={q.id} /></div>
        </div>

        {result && (
          <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${result.correct ? 'border-good/50 bg-good/10 text-good' : 'border-bad/50 bg-bad/10 text-bad'}`}>
            {result.correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            {result.correct ? 'Correct' : 'Incorrect'} · {result.marks > 0 ? '+' : ''}{Number(result.marks.toFixed(2))} marks
          </div>
        )}
      </div>

      {showSolution && <Solution q={q} />}

      <div className="flex justify-between">
        <button className="btn" disabled={!prev} onClick={() => go(prev)}><ArrowLeft className="h-4 w-4" />Previous</button>
        <button className="btn btn-primary" disabled={!next} onClick={() => go(next)}>Next<ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  )
}

export default function Practice() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const { data: attempts } = useAttempts()
  const { data: bms } = useBookmarks()

  return (
    <Gate>{ds => {
      const q = ds.questions.find(x => x.id === decodeURIComponent(id))
      if (!q) return <div className="card text-center">Question not found. <Link className="text-brand underline" to="/questions">Back to the question bank</Link></div>
      const f = readFilters(params)
      const list = filterQuestions(ds, f, statusMap(attempts), new Set((bms ?? []).map(b => b.question_id)))
      const i = list.findIndex(x => x.id === q.id)
      return <PracticeQuestion key={q.id} q={q} prev={i > 0 ? list[i - 1].id : undefined} next={i >= 0 && i < list.length - 1 ? list[i + 1].id : undefined} position={i >= 0 ? `${i + 1} of ${list.length}` : ''} />
    }}</Gate>
  )
}
