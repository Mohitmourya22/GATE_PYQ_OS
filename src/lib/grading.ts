import type { Question } from './types'

/**
 * The supplied dataset has NO marks field. Until `marks` is filled in (database column or
 * questions.json), every question is scored with these clearly-labelled defaults:
 *   MCQ: +1, wrong = -1/3     MSQ: +1, no negative     NAT: +1, no negative
 * (GATE gives 1 or 2 marks per question; MCQ negative = 1/3 of the marks; MSQ/NAT have none.)
 */
export const DEFAULT_MARKS = 1

export const marksFor = (q: Question) => q.marks ?? DEFAULT_MARKS
export const negativeFor = (q: Question) =>
  q.negative_marks ?? (q.question_type === 'MCQ' ? Number((marksFor(q) / 3).toFixed(4)) : 0)
export const marksAreAssumed = (q: Question) => q.marks == null

const decimals = (s: string) => (s.includes('.') ? s.split('.')[1].length : 0)
const num = (s: string) => (/^-?\d*\.?\d+(e-?\d+)?$/i.test(s.trim()) ? Number(s) : NaN)

/** Splits "9, 10" / "9 10" / "9;10" into parts. */
const parts = (s: string) => s.split(/[,;\s]+/).map(x => x.trim()).filter(Boolean)

function natMatches(expected: string, given: string): boolean {
  const e = parts(expected), g = parts(given)
  if (e.length !== g.length || e.length === 0) return false
  return e.every((ev, i) => {
    const en = num(ev), gn = num(g[i])
    if (Number.isNaN(en)) return ev.toLowerCase() === g[i].toLowerCase()
    if (Number.isNaN(gn)) return false
    // tolerance = half a unit in the last stored decimal place (4.0 -> ±0.05, 0.019 -> ±0.0005, 322 -> ±0.5)
    const tol = 0.5 * Math.pow(10, -decimals(ev)) + 1e-9
    return Math.abs(en - gn) <= tol
  })
}

export const normaliseMsq = (s: string) => parts(s.toUpperCase()).sort().join(',')

export function isAnswered(q: Question, answer: string | undefined): boolean {
  if (answer == null) return false
  return answer.trim().length > 0
}

export interface GradeResult { answered: boolean; correct: boolean; marks: number }

export function grade(q: Question, answer: string | undefined): GradeResult {
  if (!isAnswered(q, answer)) return { answered: false, correct: false, marks: 0 }
  const a = (answer as string).trim()
  let correct = false
  if (q.question_type === 'MCQ') correct = a.toUpperCase() === q.correct_answer.trim().toUpperCase()
  else if (q.question_type === 'MSQ') correct = normaliseMsq(a) === normaliseMsq(q.correct_answer)
  else correct = natMatches(q.correct_answer, a)
  return { answered: true, correct, marks: correct ? marksFor(q) : -negativeFor(q) }
}

/** Human-readable correct answer, e.g. "C — 4 MB". */
export function describeAnswer(q: Question): string {
  if (q.question_type === 'NAT') return q.correct_answer
  const keys = q.correct_answer.split(',').map(s => s.trim())
  return keys.map(k => (q.options[k] ? `${k}: ${q.options[k]}` : k)).join('  |  ')
}

export const hasError = (q: Question) => q.audit_flags.some(f => f.severity === 'error')
