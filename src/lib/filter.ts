import type { Dataset, Question } from './types'
import type { Status } from './hooks'
import { hasError } from './grading'

export const FILTER_KEYS = ['q', 'topic', 'year', 'type', 'diff', 'status', 'flag', 'bm', 'sort'] as const
export type Filters = Record<(typeof FILTER_KEYS)[number], string>

export const readFilters = (p: URLSearchParams): Filters =>
  Object.fromEntries(FILTER_KEYS.map(k => [k, p.get(k) ?? ''])) as Filters

const diffRank: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 }

export function filterQuestions(ds: Dataset, f: Filters, status: Record<string, Status>, bookmarked: Set<string>): Question[] {
  const topicId = f.topic ? ds.topics.find(t => t.topic_slug === f.topic)?.topic_id : undefined
  const needle = f.q.trim().toLowerCase()
  const out = ds.questions.filter(q => {
    if (needle && !(`${q.question} ${q.subtopic} ${q.id} ${q.source_id}`.toLowerCase().includes(needle))) return false
    if (f.topic && q.topic_id !== topicId) return false
    if (f.year && String(q.year) !== f.year) return false
    if (f.type && q.question_type !== f.type) return false
    if (f.diff && q.difficulty !== f.diff) return false
    if (f.status && (status[q.id] ?? 'unattempted') !== f.status) return false
    if (f.flag === 'flagged' && !hasError(q)) return false
    if (f.flag === 'clean' && hasError(q)) return false
    if (f.bm === '1' && !bookmarked.has(q.id)) return false
    return true
  })
  const s = f.sort || 'year-asc'
  const cmp: Record<string, (a: Question, b: Question) => number> = {
    'year-asc': (a, b) => a.year - b.year || a.question_number - b.question_number,
    'year-desc': (a, b) => b.year - a.year || a.question_number - b.question_number,
    topic: (a, b) => a.topic_id - b.topic_id || a.year - b.year,
    difficulty: (a, b) => diffRank[a.difficulty] - diffRank[b.difficulty] || a.year - b.year
  }
  return out.sort(cmp[s] ?? cmp['year-asc'])
}
