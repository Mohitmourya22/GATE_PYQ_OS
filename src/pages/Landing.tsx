import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Bookmark, CheckCircle2, ListChecks, Timer } from 'lucide-react'
import Gate from '../components/Gate'

const features = [
  { icon: CheckCircle2, t: 'MCQ, MSQ and NAT', d: 'Answers are checked the GATE way: single option, exact option sets, and numerical tolerance.' },
  { icon: ListChecks, t: 'Full explanations', d: 'Every question shows the stored explanation, step-by-step solution, formulae and shortcuts.' },
  { icon: Timer, t: 'Timed mock tests', d: 'Custom length and duration, mark for review, GATE-style negative marking and a results review.' },
  { icon: Bookmark, t: 'Revision lists', d: 'Bookmark questions and flag the difficult ones to drill later.' },
  { icon: BarChart3, t: 'Real analytics', d: 'Accuracy, topic strengths and weaknesses, and attempt history from your actual attempts.' }
]

export default function Landing() {
  return (
    <Gate>{ds => (
      <div className="space-y-16">
        <section className="pt-8 text-center">
          <span className="chip border-brand/40 text-brand">GATE CSE · Operating Systems</span>
          <h1 className="h1 mx-auto mt-5 max-w-3xl">Practice every OS previous-year question, <span className="bg-gradient-to-r from-brand via-violet to-cyan bg-clip-text text-transparent">understand every solution.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted">{ds.questions.length} questions across {ds.topics.length} topics with explanations, mock tests, bookmarks and analytics.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/questions" className="btn btn-primary px-6 py-3">Start practicing <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/mock" className="btn px-6 py-3"><Timer className="h-4 w-4" />Take a mock test</Link>
          </div>
        </section>

        <section>
          <h2 className="h2 mb-4">Topics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ds.topics.map(t => (
              <Link key={t.topic_id} to={`/questions?topic=${t.topic_slug}`} className="card transition hover:border-brand/60">
                <div className="text-2xl font-extrabold text-brand">{ds.questions.filter(q => q.topic_id === t.topic_id).length}</div>
                <div className="mt-1 font-semibold">{t.topic_name}</div>
                <p className="mt-1 line-clamp-3 text-xs text-muted">{t.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="h2 mb-4">What you get</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(f => (
              <div key={f.t} className="card">
                <f.icon className="h-5 w-5 text-violet" />
                <div className="mt-2 font-semibold">{f.t}</div>
                <p className="mt-1 text-sm text-muted">{f.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">Some questions in the supplied dataset have known problems (missing data, answer conflicts). They are labelled in-app — see <Link className="text-brand underline" to="/data-notes">Data notes</Link>.</p>
        </section>
      </div>
    )}</Gate>
  )
}
