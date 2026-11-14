import { AlertTriangle, Lightbulb, Wrench } from 'lucide-react'
import RichText from './RichText'
import { describeAnswer } from '../lib/grading'
import type { Question } from '../lib/types'

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h4>
    <div className="text-sm leading-relaxed">{children}</div>
  </div>
)

export function AuditBanner({ q }: { q: Question }) {
  const flags = q.audit_flags.filter(f => f.severity !== 'info')
  if (!flags.length) return null
  const err = flags.some(f => f.severity === 'error')
  return (
    <div className={`rounded-xl border p-3 text-sm ${err ? 'border-bad/50 bg-bad/10' : 'border-warn/50 bg-warn/10'}`}>
      <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />{err ? 'Known issue in the supplied dataset' : 'Data note'}</div>
      <ul className="list-disc space-y-1 pl-5">
        {flags.map(f => <li key={f.code}><span className="font-mono text-xs">{f.code}</span> — {f.message}</li>)}
      </ul>
    </div>
  )
}

export default function Solution({ q }: { q: Question }) {
  const analysis = Object.entries(q.option_analysis ?? {})
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-raised/60 p-4">
      <Block title="Correct answer (as stored in the dataset)"><span className="font-semibold text-good">{describeAnswer(q)}</span></Block>
      <Block title="Explanation"><RichText text={q.explanation} /></Block>
      <Block title="Step-by-step solution"><RichText text={q.step_by_step_solution} className="font-mono text-[13px]" /></Block>
      {analysis.length > 0 && (
        <Block title="Option-wise analysis">
          <ul className="space-y-1">{analysis.map(([k, v]) => <li key={k}><b className="mr-1">{k}.</b><RichText text={v} /></li>)}</ul>
        </Block>
      )}
      {q.formulas.length > 0 && <Block title="Formulae"><ul className="list-disc pl-5 font-mono text-[13px]">{q.formulas.map((f, i) => <li key={i}><RichText text={f} /></li>)}</ul></Block>}
      {q.shortcuts.length > 0 && <Block title="Shortcuts"><ul className="space-y-1">{q.shortcuts.map((s, i) => <li key={i} className="flex gap-2"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-cyan" /><RichText text={s} /></li>)}</ul></Block>}
      {q.common_mistakes && <Block title="Common mistakes"><div className="flex gap-2"><Wrench className="mt-0.5 h-4 w-4 shrink-0 text-warn" /><RichText text={q.common_mistakes} /></div></Block>}
      <div className="flex flex-wrap gap-2 pt-1">
        {q.concepts.map(c => <span key={c} className="chip">{c}</span>)}
      </div>
      <p className="text-xs text-muted">Source: {q.source_video} · Original id: {q.source_id} · Dataset status: {q.verification_status}</p>
    </div>
  )
}
