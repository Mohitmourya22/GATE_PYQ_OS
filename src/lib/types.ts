export type QType = 'MCQ' | 'MSQ' | 'NAT'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Severity = 'error' | 'warning' | 'info'

export interface AuditFlag { code: string; severity: Severity; message: string }

export interface Question {
  id: string
  source_id: string
  year: number
  subject: string
  topic_id: number
  topic: string
  subtopic: string
  question_number: number
  question_type: QType
  question: string
  options: Record<string, string>
  correct_answer: string
  explanation: string
  step_by_step_solution: string
  option_analysis: Record<string, string>
  concepts: string[]
  formulas: string[]
  shortcuts: string[]
  difficulty: Difficulty
  common_mistakes: string
  source_video: string
  verification_status: string
  audit_flags: AuditFlag[]
  marks: number | null
  negative_marks: number | null
}

export interface TopicMeta {
  topic_id: number
  topic_slug: string
  topic_name: string
  question_count: number
  description: string
}

export interface Attempt {
  id: string
  question_id: string
  user_answer: string
  is_correct: boolean
  marks_obtained: number
  time_taken_seconds: number
  mode: 'practice' | 'mock'
  attempted_at: string
}

export interface Bookmark {
  question_id: string
  notes: string
  is_difficult: boolean
  revision_list: string
  created_at: string
}

export interface Dataset { topics: TopicMeta[]; questions: Question[]; source: 'supabase' | 'local' }
