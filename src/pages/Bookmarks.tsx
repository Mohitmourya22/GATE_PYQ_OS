import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, Trash2 } from 'lucide-react'
import Gate from '../components/Gate'
import RichText from '../components/RichText'
import { useBookmarks, useRemoveBookmark, useSaveBookmark } from '../lib/hooks'
import type { Bookmark } from '../lib/types'

function Row({ b, title, text }: { b: Bookmark; title: string; text: string }) {
  const save = useSaveBookmark(); const remove = useRemoveBookmark()
  const [notes, setNotes] = useState(b.notes)
  const [list, setList] = useState(b.revision_list)
  const dirty = notes !== b.notes || list !== b.revision_list
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link className="font-semibold hover:text-brand" to={`/practice/${encodeURIComponent(b.question_id)}?bm=1`}>{title}</Link>
          <p className="line-clamp-2 text-sm text-muted"><RichText text={text} /></p>
        </div>
        <div className="flex gap-2">
          <button className={`btn px-2.5 ${b.is_difficult ? 'border-warn text-warn' : ''}`} aria-pressed={b.is_difficult} title="Toggle difficult" onClick={() => save.mutate({ ...b, is_difficult: !b.is_difficult })}><Flag className={`h-4 w-4 ${b.is_difficult ? 'fill-current' : ''}`} /></button>
          <button className="btn px-2.5" title="Remove bookmark" onClick={() => remove.mutate(b.question_id)}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <input className="input" placeholder="Revision list (e.g. Weak spots)" value={list} onChange={e => setList(e.target.value)} />
        <input className="input sm:col-span-2" placeholder="Your notes…" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {dirty && <button className="btn btn-primary" onClick={() => save.mutate({ ...b, notes, revision_list: list.trim() })}>Save notes</button>}
    </div>
  )
}

export default function Bookmarks() {
  const { data: bms = [] } = useBookmarks()
  const [filter, setFilter] = useState('all')
  return (
    <Gate>{ds => {
      const lists = [...new Set(bms.map(b => b.revision_list).filter(Boolean))]
      const shown = bms.filter(b => filter === 'all' ? true : filter === 'difficult' ? b.is_difficult : b.revision_list === filter)
      const ids = shown.map(b => b.question_id)
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="h1">Bookmarks & revision</h1><p className="text-muted">{bms.length} saved · {bms.filter(b => b.is_difficult).length} marked difficult</p></div>
            {ids.length > 0 && <Link className="btn btn-primary" to={`/practice/${encodeURIComponent(ids[0])}?bm=1`}>Practice bookmarked</Link>}
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'difficult', ...lists].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? 'border-brand text-brand' : ''}`}>{f === 'all' ? 'All' : f === 'difficult' ? 'Difficult' : f}</button>
            ))}
          </div>
          {shown.length === 0
            ? <div className="card text-center text-muted">Nothing here yet. Bookmark questions from the <Link className="text-brand underline" to="/questions">question bank</Link>.</div>
            : <div className="space-y-3">{shown.map(b => {
                const q = ds.questions.find(x => x.id === b.question_id)
                return <Row key={b.question_id} b={b} title={q ? `${q.year} · Q${q.question_number} · ${q.subtopic}` : b.question_id} text={q?.question ?? ''} />
              })}</div>}
        </div>
      )
    }}</Gate>
  )
}
