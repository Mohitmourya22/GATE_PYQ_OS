import local from '../data/questions.json'
import { supabase } from './supabase'
import type { Dataset, Question, TopicMeta } from './types'

const bundled = local as unknown as { metadata: { topics: TopicMeta[] }; questions: Question[] }
export const EXPECTED_COUNT = 131

export const localDataset: Dataset = { topics: bundled.metadata.topics, questions: bundled.questions, source: 'local' }

/** Loads from Supabase when configured; falls back to the bundled JSON on any error or wrong count. */
export async function loadDataset(): Promise<Dataset> {
  if (!supabase) return localDataset
  try {
    const [t, q] = await Promise.all([
      supabase.from('os_topics').select('*').order('id'),
      supabase.from('gate_questions').select('*').order('year').order('question_number').range(0, 999)
    ])
    if (t.error || q.error) throw t.error ?? q.error
    const questions = (q.data ?? []) as Question[]
    if (questions.length !== EXPECTED_COUNT) {
      console.warn(`Supabase returned ${questions.length} questions (expected ${EXPECTED_COUNT}); using bundled data.`)
      return localDataset
    }
    const topics: TopicMeta[] = (t.data ?? []).map((r: any) => ({
      topic_id: r.id, topic_slug: r.topic_slug, topic_name: r.topic_name, question_count: r.question_count, description: r.description ?? ''
    }))
    return { topics, questions, source: 'supabase' }
  } catch (e) {
    console.warn('Supabase load failed, using bundled data:', e)
    return localDataset
  }
}

export const topicSlug = (d: Dataset, id: number) => d.topics.find(t => t.topic_id === id)?.topic_slug ?? ''
