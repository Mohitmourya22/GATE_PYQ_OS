import { Check, X } from 'lucide-react'
import RichText from './RichText'
import { normaliseMsq } from '../lib/grading'
import type { Question } from '../lib/types'

interface Props {
  q: Question
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  /** when true, colours the correct option green and a wrong pick red */
  showResult?: boolean
}

export default function AnswerInput({ q, value, onChange, disabled, showResult }: Props) {
  if (q.question_type === 'NAT') {
    return (
      <div>
        <input
          className="input max-w-xs font-mono text-base"
          inputMode="decimal"
          placeholder="Type your numerical answer"
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          aria-label="Numerical answer"
        />
        <p className="mt-1 text-xs text-muted">Numerical answer (NAT). For multi-part answers separate values with a comma.</p>
      </div>
    )
  }

  const multi = q.question_type === 'MSQ'
  const picked = new Set(multi ? normaliseMsq(value).split(',').filter(Boolean) : value ? [value] : [])
  const correct = new Set(q.correct_answer.split(',').map(s => s.trim().toUpperCase()))

  const toggle = (k: string) => {
    if (disabled) return
    if (!multi) return onChange(k)
    const next = new Set(picked)
    next.has(k) ? next.delete(k) : next.add(k)
    onChange([...next].sort().join(','))
  }

  return (
    <div className="space-y-2" role={multi ? 'group' : 'radiogroup'}>
      {Object.entries(q.options).map(([k, text]) => {
        const sel = picked.has(k)
        const isRight = correct.has(k)
        let cls = 'border-line bg-raised hover:border-brand/60'
        if (sel) cls = 'border-brand bg-brand/10'
        if (showResult) cls = isRight ? 'border-good bg-good/10' : sel ? 'border-bad bg-bad/10' : 'border-line bg-raised opacity-70'
        return (
          <button
            key={k}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={sel}
            disabled={disabled}
            onClick={() => toggle(k)}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${cls}`}
          >
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border text-xs font-bold ${multi ? 'rounded-md' : 'rounded-full'} ${sel ? 'border-brand bg-brand text-white' : 'border-line'}`}>{k}</span>
            <span className="flex-1"><RichText text={text} /></span>
            {showResult && isRight && <Check className="h-4 w-4 text-good" />}
            {showResult && sel && !isRight && <X className="h-4 w-4 text-bad" />}
          </button>
        )
      })}
      {multi && <p className="text-xs text-muted">Select all correct options (MSQ). All-or-nothing, no negative marks.</p>}
    </div>
  )
}
